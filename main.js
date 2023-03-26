
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
        let n = 0
        for (let p of this.swarm) {
            if (inMeasuredSection(p)) n+=1
        }
        return n;
    }
}

const centerX = Scene.w / 2;
const centerY = Scene.h / 2;

const trackEnforcement = 5;

let sizeBig = {w: 600, h: 400} // sizes for larger outer rectangle

let sizeSmall = {w: 400, h: 250} // sizes for small inner rectangle

let sizeMeasure = {w: 400, h: 75}

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


window.onload = function setup() {
	console.log("Start");
	let ParticleCount = 200;

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

        this.entryTime = 0;
        this.exitTime = 0;

        // density at start of entry
        this.densityNStart = 0
        // density at exit of entry
        this.densityNExit = 0

        this.pos = {
            x : Math.random() * Scene.w,
            y: Math.random() * Scene.h
        }

        this.previousPos {
            x: this.pos.x
            y: this.pos.y
        }

        this.dir = {
            x : ((Math.random() * 2) - 1) * this.speedMultiplier,
            y : ((Math.random() * 2) - 1) * this.speedMultiplier
        }

    }

    step() {
        // if N = 0, sometimes particles will not be drawn when there are no neighbours because it tries to divide by 0 which is not possible
        var N=0;
        var selfAngle = Math.atan2(this.dir.y, this.dir.x);
        var avg_sin = 0 //Math.sin(selfAngle);
        var avg_cos = 0 //Math.cos(selfAngle);

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

        this.entered = inMeasuredSection(this);
        if (this.entered && !this.wait) {
            this.entryTime = Date.now();
            this.wait = true;
            this.densityNStart = Scene.inSection()
        }
        this.exited = correctExit(this);

        if (this.exited && this.wait) {
            this.exitTime = Date.now();
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

function makeRaceTrack() {
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

    return [xPressure/centerX, yPressure/centerY]
}

function outputToText(text) {
    document.getElementById('text').innerHTML += text;
    document.getElementById('text').innerHTML += '\n';
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


function draw() {
    console.log("Iter")
    clearCanvas();
    makeRaceTrack();

	for (let p of Scene.swarm) {
	    p.draw()
	}
}

var drawBool = true;

function toggleRun() {
    if (drawBool) {
        drawBool = false;
    }
    else {
        drawBool = true;
    }
}

function main() {
    if (drawBool)
        draw()
}

setInterval(main, 20);