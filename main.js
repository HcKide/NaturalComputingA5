
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
        var N=1;
        var selfAngle = Math.atan2(this.dir.y, this.dir.x);
        var avg_sin = Math.sin(selfAngle);
        var avg_cos = Math.cos(selfAngle);

        var angle = 0;

        for (let n of Scene.neighbours(this.pos)) {
            angle = Math.atan2(n.dir.y, n.dir.x);
            avg_sin += Math.sin(angle);
            avg_cos += Math.cos(angle);
            N++;
        }
        avg_sin /= N; avg_cos /= N
        let avg_angle = Math.atan2(avg_sin, avg_cos);
        avg_angle += (Math.random() - 0.5);

        this.dir.x = Math.cos(avg_angle);
        this.dir.y = Math.sin(avg_angle);

        // calculate new position
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
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        this.step();
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

	for (let p of Scene.swarm) {
	    p.draw()
	}
}

setInterval(draw, 20);