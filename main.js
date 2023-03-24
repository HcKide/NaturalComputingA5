
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
    }
}

let sizeBig = {w: 600, h: 400} // sizes for larger outer rectangle

let sizeSmall = {w: 400, h: 250} // sizes for small inner rectangle

window.onload = function setup() {
	console.log("Start");
	let ParticleCount = 200;

	createCanvas(Scene.w, Scene.h);
	// create particles
	for (let i = 0; i < ParticleCount; i++) {
	    Scene.swarm.push(new Particle())
	}

	draw();
}

class Particle{
    constructor() {
        // speed multiplier that can be adjusted also based on how often the draw function is called
        this.speedMultiplier = 2;
        // multiplier that dampens the effect of cohesion, vary from 0 to 1
        this.cohesionMultiplier = 0.9;
        // regulates distances between cells in a boid, higher means larger distance
        this.dispersionMultiplier = 200;

        this.pos = {
            x : Math.random() * Scene.w,
            y: Math.random() * Scene.h
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
//        inTrack(this); // apply direction pressure based on location relative to track
        const [xPressure, yPressure] = clockWise(this);

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
        avg_d.x *= this.dispersionMultiplier * neighbours.length*0.2;
        avg_d.y *= this.dispersionMultiplier * neighbours.length*0.2;

        if (N == 0) {
            console.log("N is zero")
        }

        // average angle calc
        let avg_angle = Math.atan2(avg_sin, avg_cos);
        avg_angle += (Math.random() - 0.5); // random noise to angle

        // cohesion calc
        let cohesion = {
            x: (avg_p.x - this.pos.x)*this.cohesionMultiplier,
            y: (avg_p.y - this.pos.y)*this.cohesionMultiplier
        }

        // update direction with all values
        this.dir.x = Math.cos(avg_angle) + cohesion.x + avg_d.x + xPressure;
        this.dir.y = Math.sin(avg_angle) + cohesion.y + avg_d.y + yPressure;

        // calculate new position with direction
        this.pos.x += this.dir.x
        this.pos.y += this.dir.y

        // check bounds of position, wrap around if needed
        if (this.pos.x < 0 ) this.pos.x += Scene.w
        if (this.pos.x > Scene.w ) this.pos.x -= Scene.w

        if (this.pos.y < 0 ) this.pos.y += Scene.h
        if (this.pos.y > Scene.h ) this.pos.y -= Scene.h
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
}

function clockWise(particle) {
    // based on location relative to center of canvas, apply pressure to rotate clockwise
    // pressure becomes larger with a larger distance from center

    var centerX = Scene.w / 2;
    var centerY = Scene.h / 2;

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

    // in large rectangle at all
    var leftUpPointLarge = {x: (Scene.w/2) - sizeBig.w/2, y: (Scene.h/2) - sizeBig.h/2}
    var rightUpPointLarge = {x: (Scene.w/2) + sizeBig.w/2, y: (Scene.h/2) - sizeBig.h/2}
    var leftDownPointLarge = {x: (Scene.w/2) - sizeBig.w/2, y: (Scene.h/2) + sizeBig.h/2}

    // in small rectangle
    var leftUpPointSmall = {x: (Scene.w/2) - sizeSmall.w/2, y: (Scene.h/2) - sizeSmall.h/2}
    var rightUpPointSmall = {x: (Scene.w/2) + sizeSmall.w/2, y: (Scene.h/2) - sizeSmall.h/2}
    var leftDownPointSmall = {x: (Scene.w/2) - sizeSmall.w/2, y: (Scene.h/2) + sizeSmall.h/2}

    // checks whether particle is within bounds of outer rectangle
    if (particle.pos.x >= leftUpPointLarge.x && particle.pos.x <= rightUpPointLarge.x &&
    particle.pos.y >= leftUpPointLarge.y && particle.pos.y <= leftDownPointLarge.y) {

            // check whether particle is in inner rectangle, apply outwards pressure
            if (particle.pos.x >= leftUpPointSmall.x && particle.pos.x <= rightUpPointSmall.x &&
        particle.pos.y >= leftUpPointSmall.y && particle.pos.y <= leftDownPointSmall.y) {

        }
    }
    else {
        // outside of rectangles, apply inwards pressure

    }


}

function outputToText() {
    document.getElementById('text').innerHTML = 'Test';
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

function draw() {
    console.log("Iter")
    clearCanvas();
    makeRaceTrack();

	for (let p of Scene.swarm) {
	    p.draw()
	}
}

setInterval(draw, 20);