
let Scene = {
    w:800, h:800, swarm : [], vicinity : 25,
    neighbours : function(particlePos) {
    // can also be done with k-d tree
        let r = []
        for (let p of this.swarm) {
            var distance = Math.sqrt(Math.pow(p.pos.x - particlePos.x, 2) + Math.pow(p.pos.y - particlePos.y, 2));
            if (distance <= this.vicinity) {
                r.push(p)
            }
        }
        return r;
    },
    inSection : function() {
        // returns how many particles are in the measured section at the current time
        let n = 0
        for (let p of this.swarm) {
            if (inMeasuredSection(p)) n+=1
        }
        return n;
    }
}

const centerX = Scene.w / 2;
const centerY = Scene.h / 2;

// multiplier that indicates the strength of the track enforcement
const trackEnforcement = 5;

let sizeBig = {w: 600, h: 400} // sizes for larger outer rectangle

let sizeSmall = {w: 400, h: 250} // sizes for small inner rectangle

let sizeMeasure = {w: 400, h: 75} // sizes for the measured section, coloured red in the scene

// points of large rectangle
const leftUpPointLarge = {x: (Scene.w/2) - sizeBig.w/2, y: (Scene.h/2) - sizeBig.h/2}
const rightUpPointLarge = {x: (Scene.w/2) + sizeBig.w/2, y: (Scene.h/2) - sizeBig.h/2}
const leftDownPointLarge = {x: (Scene.w/2) - sizeBig.w/2, y: (Scene.h/2) + sizeBig.h/2}

// points of small rectangle
const leftUpPointSmall = {x: (Scene.w/2) - sizeSmall.w/2, y: (Scene.h/2) - sizeSmall.h/2}
const rightUpPointSmall = {x: (Scene.w/2) + sizeSmall.w/2, y: (Scene.h/2) - sizeSmall.h/2}
const leftDownPointSmall = {x: (Scene.w/2) - sizeSmall.w/2, y: (Scene.h/2) + sizeSmall.h/2}

// points of measured section
const leftUpPointMeasure = {x: (Scene.w/2) - sizeMeasure.w/2, y: (Scene.h/2) - sizeBig.h/2}
const rightUpPointMeasure = {x: (Scene.w/2) + sizeMeasure.w/2, y: (Scene.h/2) - sizeBig.h/2}
const leftDownPointMeasure = {x: (Scene.w/2) - sizeMeasure.w/2, y: (Scene.h/2) - sizeSmall.h/2}

let ParticleCount = 1;

// onload function to set up all necessary elements
window.onload = function setup() {
	console.log("Start");
	document.getElementById("count").innerHTML += ParticleCount.toString();

	createCanvas(Scene.w, Scene.h);
	// create particles
	for (let i = 0; i < ParticleCount; i++) {
	    Scene.swarm.push(new Particle(i+1))
	}

	draw();
}

class Particle{
    constructor(id) {

        this.id = id;
        // speed multiplier that can be adjusted also based on how often the draw function is called
        this.speedMultiplier = 2;
        // multiplier that dampens the effect of cohesion, vary from 0 to 1
        this.cohesionMultiplier = 0.9;
        // regulates distances between cells in a boid, higher means larger distance
        this.dispersionMultiplier = 100;

        // boolean that indicates whether particle is currently in the measured section or not
        this.entered = false;
        // boolean indicating whether the particle has correctly exited the measured section
        this.exited = false;

        // indicates whether we need to wait for the particle to exit so we don't continuously record time
        this.wait = false;

        // timestamps for entry and exit
        this.entryTime = 0;
        this.exitTime = 0;

        // density at start of entry
        this.densityNStart = 0
        // density at exit of entry
        this.densityNExit = 0

        // for grouping particles together at start, used to generate FD
        this.pos = {
            x : Math.random() * Scene.w * 0.05 + Scene.w * 0.8,
            y: Math.random() * Scene.h * 0.05 + Scene.h * 0.5
        }

        // Start closer together
        // this.pos = {
        //     x : Math.random() * 0.1,
        //     y : Math.random() * 0.1
        // }

        this.previousPos = {
            x: this.pos.x,
            y: this.pos.y
        }

        this.dir = {
            x : ((Math.random() * 2) - 1) * this.speedMultiplier,
            y : ((Math.random() * 2) - 1) * this.speedMultiplier
        }

    }

    step() {
        var N=0;
        var avg_sin = 0
        var avg_cos = 0

        var avg_p = {x:0, y:0}; // average position of neighbours
        var avg_d = {x: 0, y:0}; // average dispersion to repel particles that are too close

        var angle = 0;
        var neighbours = Scene.neighbours(this.pos);
        const [trackPressureX, trackPressureY] = inTrack(this); // apply direction pressure based on location relative to track
        const [xPressure, yPressure] = clockWise(this); // apply clockwise pressure

        for (let n of neighbours) {
            // average position calculation
            avg_p.x += n.pos.x;
            avg_p.y += n.pos.y;

            // average dispersion calculation
            if (n != this) {
                // check if n is not the same as the current particle, otherwise the vector calculation will go wrong
                // since away will be a (0, 0) vector
                let away = {x:(this.pos.x - n.pos.x), y: (this.pos.y - n.pos.y)}
                let vectorLengthSq = Math.pow(away.x, 2) + Math.pow(away.y, 2)

                avg_d.x += away.x/vectorLengthSq; // scale by squared magnitude of vector
                avg_d.y += away.y/vectorLengthSq;
            }
            // average angle calculation
            angle = Math.atan2(n.dir.y, n.dir.x);
            avg_sin += Math.sin(angle);
            avg_cos += Math.cos(angle);
            N++;
        }
        // averaging
        avg_sin /= N; avg_cos /= N;
        avg_p.x /= N; avg_p.y /= N;
        avg_d.x /= N; avg_d.y /= N;

        // factors that determine the dispersion for boids
        // it becomes stronger with larger boids (high number of neighbours) because otherwise the cohesion of too many
        // particles overpowers the dispersion, but now the dispersion scales with the amount of neighbours
        avg_d.x *= this.dispersionMultiplier * neighbours.length * 0.2;
        avg_d.y *= this.dispersionMultiplier * neighbours.length * 0.2;

        // average angle calc
        let avg_angle = Math.atan2(avg_sin, avg_cos);
        avg_angle += (Math.random() - 0.5); // random noise to angle

        // cohesion calc
        let cohesion = {
            x: (avg_p.x - this.pos.x)*this.cohesionMultiplier,
            y: (avg_p.y - this.pos.y)*this.cohesionMultiplier
        }

        // update direction with all values
        this.dir.x = Math.cos(avg_angle) + cohesion.x + avg_d.x + xPressure + trackPressureX*trackEnforcement;
        this.dir.y = Math.sin(avg_angle) + cohesion.y + avg_d.y + yPressure + trackPressureY*trackEnforcement;
        
        // Without alignment
        // this.dir.x = cohesion.x + avg_d.x + xPressure + trackPressureX*trackEnforcement;
        // this.dir.y = cohesion.y + avg_d.y + yPressure + trackPressureY*trackEnforcement;
        
        // Without cohesion
        // this.dir.x = Math.cos(avg_angle) + avg_d.x + xPressure + trackPressureX*trackEnforcement;
        // this.dir.y = Math.sin(avg_angle) + avg_d.y + yPressure + trackPressureY*trackEnforcement;

        // Without separation
        // this.dir.x = Math.cos(avg_angle) + cohesion.x + xPressure + trackPressureX*trackEnforcement;
        // this.dir.y = Math.sin(avg_angle) + cohesion.y + yPressure + trackPressureY*trackEnforcement;

        // record previous position for other functions
        this.previousPos.x = this.pos.x
        this.previousPos.y = this.pos.y

        // calculate new position with direction
        this.pos.x += this.dir.x
        this.pos.y += this.dir.y

        // check bounds of position, wrap around if needed
        if (this.pos.x < 0 ) this.pos.x += Scene.w
        if (this.pos.x > Scene.w ) this.pos.x -= Scene.w

        if (this.pos.y < 0 ) this.pos.y += Scene.h
        if (this.pos.y > Scene.h ) this.pos.y -= Scene.h

        this.entered = correctEntry(this);
        if (this.entered && !this.wait) {
            // this.entryTime = Date.now();
            this.entryTime = customClock;
            this.wait = true;
            this.densityNStart = Scene.inSection()
        }
        this.exited = correctExit(this);

        if (this.exited && this.wait) {
            // this.exitTime = Date.now();
            this.exitTime = customClock;
            var deltaT = this.exitTime - this.entryTime
            var speed = sizeMeasure.w / deltaT
            speed = Math.round(speed * 1000) / 1000

            this.densityNExit = Scene.inSection()

            var density = ((this.densityNStart + this.densityNExit) / 2) / sizeMeasure.w

            var text = "{\"id\":" + this.id.toString() + ", \"speed\":" + speed.toString() + ", \"density\":" + density.toString() + "},"
            outputToText(text)

            this.wait = false; // reset vars
        }
    }

    draw() {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        this.step();
    }
}

class BoidAverageParticle extends Particle {

    constructor(id) {
        super(id);
        this.boidSize = 0;
    }
    step() {
        this.entered = correctEntry(this);
        if (this.entered && !this.wait) {
            // this.entryTime = Date.now();
            this.entryTime = customClock;
            this.wait = true;
            this.densityNStart = Scene.inSection()
        }
        this.exited = boidExit(this); // exit check with looser conditions

        if (this.exited && this.wait) {
            console.log("exited");
            // this.exitTime = Date.now();
            this.exitTime = customClock;
            var deltaT = this.exitTime - this.entryTime
            var speed = sizeMeasure.w / deltaT
            speed = Math.round(speed * 1000) / 1000

            this.densityNExit = Scene.inSection()

            var density = ((this.densityNStart + this.densityNExit) / 2) / sizeMeasure.w
            
            var text = "{\"id\":" + this.id.toString() + ", \"speed\":" + speed.toString() + ", \"density\":" +
                density.toString() + ", \"boidSize\":" + this.boidSize.toString() + "},"
            // outputToText2(text);

            this.wait = false; // reset vars

            // loggin speed and density
            speeds.push(speed);
            densities.push(density);
        }
    }

    draw() {
        if (showBoidAvg) {
            var canvas = document.getElementById("canvas");
            var ctx = canvas.getContext("2d");
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
        this.step();
    }
}

function checkNeighbours(particle, particlesInBoid) {
    var neighbours = Scene.neighbours(particle.pos);
    for (let n of neighbours) {
        // if particle is not in the list already, add it and check its neighbours
        if (!particlesInBoid.includes(n)) {
            particlesInBoid.push(n);
            checkNeighbours(n, particlesInBoid);
        }
    }
}

function boidCalculation() {
    // pick a particle and see which particles belong to the same boid
    var particle = Scene.swarm[0]; // pick the first particle
    var particlesInBoid = [particle];
    checkNeighbours(particle, particlesInBoid);

    var averageBoidPosition = {x: 0, y: 0};
    for (let p of particlesInBoid) {
        averageBoidPosition.x += p.pos.x;
        averageBoidPosition.y += p.pos.y;
    }
    averageBoidPosition.x /= particlesInBoid.length;
    averageBoidPosition.y /= particlesInBoid.length;

    var boidSize = particlesInBoid.length;
    return [averageBoidPosition, boidSize];
}

function makeRaceTrack() {
    // create the racetrack from a few rectangles
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "grey";
    // draw the outer rectangle
    ctx.fillRect((Scene.w/2) - sizeBig.w/2, (Scene.h/2) - sizeBig.h/2, sizeBig.w, sizeBig.h);

    ctx.fillStyle = "white"; // set the fill color
    // draw the inner rectangle
    ctx.fillRect((Scene.w/2) - sizeSmall.w/2, (Scene.h/2) - sizeSmall.h/2, sizeSmall.w, sizeSmall.h);

    ctx.fillStyle = "red"; // set the fill color
    // draw the measured section
    ctx.fillRect((Scene.w/2) - sizeMeasure.w/2, (Scene.h/2) - sizeBig.h/2, sizeMeasure.w, sizeMeasure.h);

}

function clockWise(particle) {
    // based on location relative to center of canvas, apply pressure to rotate clockwise
    // pressure becomes larger with a larger distance from center
    var xPressure = 0;
    var yPressure = 0;

    var distanceX = 0;
    var distanceY = 0;

    // x location, right side of center means downwards, left side means upwards
    if (particle.pos.x >= centerX) {
        // particle right of center (or middle)
        distanceX = Math.abs(particle.pos.x - centerX)
        yPressure = distanceX
    }
    else {
        // particle left of center
        distanceX = Math.abs(particle.pos.x - centerX)
        yPressure = -distanceX
    }

    // y location, above means right, below means left
    if (particle.pos.y >= centerY) {
        // particle below center (or middle)
        distanceY = Math.abs(particle.pos.y - centerY)
        xPressure = -distanceY
    }
    else {
        // particle above center
        distanceY = Math.abs(particle.pos.y - centerY)
        xPressure = distanceY
    }
    return [xPressure/centerX, yPressure/centerY]
}

function inTrack(particle) {
    // sees whether particle is in the racetrack
    var xPressure = 0;
    var yPressure = 0;

    // checks whether particle is within bounds of outer rectangle
    if (particle.pos.x >= leftUpPointLarge.x && particle.pos.x <= rightUpPointLarge.x &&
    particle.pos.y >= leftUpPointLarge.y && particle.pos.y <= leftDownPointLarge.y) {

            // check whether particle is in inner rectangle
            if (particle.pos.x >= leftUpPointSmall.x && particle.pos.x <= rightUpPointSmall.x &&
        particle.pos.y >= leftUpPointSmall.y && particle.pos.y <= leftDownPointSmall.y) {
                // apply outwards pressure
                distanceX = Math.abs(particle.pos.x - centerX);
                if (particle.pos.x >= centerX) {
                    xPressure = distanceX;
                }
                else {
                    xPressure = -distanceX;
                }

                distanceY = Math.abs(particle.pos.y - centerY);
                if (particle.pos.y >= centerY) {
                    yPressure = distanceY;
                }
                else {
                    yPressure = -distanceY;
                }
        }
    }
    else {
        // outside of rectangles, apply inwards pressure
        // apply outwards pressure
        distanceX = Math.abs(particle.pos.x - centerX);
        if (particle.pos.x >= centerX) {
            xPressure = -distanceX;
        }
        else {
            xPressure = distanceX;
        }

        distanceY = Math.abs(particle.pos.y - centerY);
        if (particle.pos.y >= centerY) {
            yPressure = -distanceY;
        }
        else {
            yPressure = distanceY;
        }
    }

    return [xPressure/centerX, yPressure/centerY] // normalize by pixel count
}

function outputToText(text) {
    if (outputBool){
        document.getElementById('text').innerHTML += text;
        document.getElementById('text').innerHTML += '\n';
    }
}

function outputToText2(text){
    document.getElementById('text2').innerHTML += text;
    document.getElementById('text2').innerHTML += '\n';
}

function clearOutput() {
    document.getElementById('text').innerHTML = "";
}

function createCanvas(w, h) {
    var canvas = document.createElement("canvas");
    canvas.id = "canvas"
    canvas.width = w;
    canvas.height = h;
    canvas.style.border = "1px solid black";
    document.body.appendChild(canvas);
}

function clearCanvas() {
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function correctExit(particle) {
    // checks whether the particle has correctly exited the section on the right and not on top or bottom
    let particleX = particle.pos.x;
    let particleY = particle.pos.y;

    if (leftUpPointMeasure.y <= particleY && leftDownPointMeasure.y >= particleY && rightUpPointMeasure.x <= particleX )
    {
        // exited correctly via right side
        return true
    }
    return false
}

function boidExit(particle) {
    /* like correctExit, but for boids, which needs looser checking because for larger boids it
     is difficult to get them to exit the measured section in a straight line, therefore this only checks
     whether the particle has exited the measured section on the right side
    */
    if (rightUpPointMeasure.x <= particle.pos.x)
    {
        // exited via right side
        return true
    }
    return false
}

function correctEntry(particle) {
    /* checks correct entry of a particle into the measured section
     if a particle is currently in the measured section, and at a previous point was to the immediate left of the
     measured section (not below or above) then the particle has entered the measured section in the correct manner
    */

    if (inMeasuredSection) {
        if (leftUpPointMeasure.x > particle.previousPos.x && leftUpPointMeasure.y <= particle.previousPos.y
        && leftDownPointMeasure.y >= particle.previousPos.y) {
            return true
        }
    }
    return false
}

function inMeasuredSection(particle) {
    // checks whether a particle is in the measured section, regardless of whether it correctly entered it from the left
    // side or not
    let particleX = particle.pos.x;
    let particleY = particle.pos.y;

    if (leftUpPointMeasure.x <= particleX && leftUpPointMeasure.y <= particleY && rightUpPointMeasure.x >= particleX
        && leftDownPointMeasure.y >= particleY
    )
    {
        // entered the measured section
        return true
    }
    return false
}

// initialize average particle
const avgPart = new BoidAverageParticle(1);
avgPart.previousPos.x = 0;
avgPart.previousPos.y = 0;

/* initially we used Date.time() but depending on the browser the simulation would run faster or slower which
gives inaccurate results. The speed of particles would seem much slower when the system started lagging because the
clock did not run in parallel with the simulation.
Therefore, we use a custom clock that is incremented by 1 every time the draw function is called.
 */
var customClock = 0;

function draw() {
    // draw function that is called continuously
    clearCanvas();
    makeRaceTrack();

	for (let p of Scene.swarm) {
	    p.draw()
	}
    [avgPos, boidSize] = boidCalculation();
    avgPart.previousPos = avgPart.pos;
    avgPart.boidSize = boidSize;
    avgPart.pos = avgPos;
    avgPart.draw();
    customClock += 1;
}

var drawBool = true;
var outputBool = true;
var showBoidAvg = false;

function toggleRun() {
    // function that is called by the pause/unpause button
    if (drawBool) {
        drawBool = false;
    }
    else {
        drawBool = true;
    }
}

function toggleBoidAvg() {
    // function that is called by the pause/unpause button
    if (showBoidAvg) {
        showBoidAvg = false;
    }
    else {
        showBoidAvg = true;
    }
}

function toggleOutput() {
    if (outputBool) {
        outputBool = false;
    }
    else {
        outputBool = true;
    }
}

function main() {
    counter += 1
    if (counter >= 2100) {
        // reset simulation with different particle count in order to get proper FD
        counter = 0;
        Scene.swarm = [];
        if (ParticleCount < 10){
            ParticleCount += 1;
        } else {
            ParticleCount +=5
        }
        document.getElementById("count").innerHTML = ParticleCount.toString();
        for (let i = 0; i < ParticleCount; i++) {
            Scene.swarm.push(new Particle(i+1))
        }

        // Calculate averages of simulation, becomes single point on FD
        let avg_speed = average(speeds);
        let avg_density = average(densities);

        // reset speeds and densities
        speeds = [];
        densities = [];

        // push text
        var text = "{\"speed\":" + avg_speed.toString() + ", \"density\":" +
            avg_density.toString() + "p_count:"+ ParticleCount +"},"
        outputToText2(text)
    }
    if (drawBool)
        draw()
}

// keep track of stuff
let counter = 0;
let speeds = [];
let densities = [];
// let avg_speeds = [];
// let avg_densities = [];

// averaging function
const average = list => list.reduce((prev, curr) => prev + curr) / list.length;

// set interval of main to run
interval = setInterval(main, 1); 
