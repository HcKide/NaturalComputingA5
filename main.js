
let Scene = {
    w:800, h:800, swarm : [], vicinity : 25,
    neighbours : function(particle) {
    // can also be done with k-d tree
        let r = []
        for (let p of this.swarm) {
            var distance = Math.sqrt(Math.pow(p.pos.x - particle.x, 2) + Math.pow(p.pos.y - particle.y, 2));
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
        this.dir.x = Math.cos(avg_angle) + cohesion.x + avg_d.x;
        this.dir.y = Math.sin(avg_angle) + cohesion.y + avg_d.y;

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