//init
var canvas = document.getElementById("ctx")
var ctx = canvas.getContext("2d");
ctx.font = "30px Helvetica";


// PLANET //
function Planet(size=20) 
{
    this.pos = {x:0,y:0}; 
    this.force = {x: 0,y: 0};
    this.vel = {x:0,y:0};

    this.color = '#'+Math.floor(Math.random()*16777215).toString(16);

    this.size = size;
    this.draw_size = 0;
    this.mass = Math.pow(this.size,2) * Math.PI;

    this.static = false;
}
Planet.prototype = {
    constructor : Planet,
    updateDrawSize : function(){
        if ((this.size - this.draw_size) > 0.1) {
            this.draw_size = this.draw_size + ((this.size-this.draw_size)/10);
        }
    },
    setSize : function(size){
        this.size = size;
        this.mass = Math.pow(this.size,2) * Math.PI;
    },
    setMass : function(mass){
        this.mass = mass;
        this.size = parseInt(Math.sqrt(mass/Math.PI));
    }
};

// GRAPHICS //
const Graphics = function(){
    this.backgroud_color = "rgba(238,238,238,1)";
}
Graphics.prototype = {
    constructor : Graphics,
    clear : function(){
        ctx.globalAlpha = 1
        ctx.fillStyle = this.backgroud_color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    draw_planet : function(p, alpha=1){
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.pos.x, p.pos.y, p.draw_size, 0, 2*Math.PI, false);
        ctx.fill();
    },
    draw_line : function(p1,p2,alpha=1,color="#000000"){
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    },
    draw_prediction : function(pred,alpha=1,color="#eeeeee") {
        let grd_step = 0// alpha / pred.length;
        ctx.fillStyle = color;
        for (i = 0; i < pred.length; i++) { 
            point = pred[i];
            ctx.globalAlpha = alpha;
            ctx.fillRect(point[0]-1,point[1]-1,2,2);
            alpha -= grd_step;
        }
    }
}

const Simulation = function(){
    this.planets = [];
    this.planets_to_merge = [];

    this.gravity_constant = 50;
    this.dt = 0.05;
    this.prediction_dt = 0.1;
}
Simulation.prototype = {
    constructor : Simulation,
    gravity_prediction : function(p, steps=1){
        let prediction = [];
        for (st = 0; st < steps; st++) {
            p.force.x = 0;
            p.force.y = 0;
            for (i = 0; i < this.planets.length; i++) {
                let p2 = this.planets[i]
                let dx = p2.pos.x - p.pos.x;
                let dy = p2.pos.y - p.pos.y;
                let dist = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
                if (dist < 1) { dist = 1; }
                let f = (this.gravity_constant * p.mass * p2.mass) / Math.pow(dist, 2);
                let fx = (f * dx / dist);  // Break it down into components
                let fy = (f * dy / dist);
                p.force.x += fx;
                p.force.y += fy;
            }
            let dt = this.prediction_dt;
            //acceleration
            let ax = p.force.x / p.mass;
            let ay = p.force.y / p.mass;
            //velocity
            p.vel.x += ax * dt;
            p.vel.y += ay * dt;
            //position
            p.pos.x += p.vel.x * dt;
            p.pos.y += p.vel.y * dt;
    
            prediction.push([p.pos.x, p.pos.y]);
        }
        return prediction;
    },
    gravity : function(){
        for (i = 0; i < this.planets.length; i++) {
            this.planets[i].force.x = 0;
            this.planets[i].force.y = 0;
        }
        for (i = 0; i < this.planets.length; i++) {
            for (j = 0; j < this.planets.length; j++) {
                if (i < j){
                    let p1 = this.planets[i];
                    let p2 = this.planets[j];
                    let dx = p2.pos.x - p1.pos.x;
                    let dy = p2.pos.y - p1.pos.y;
                    let dist = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
                    if (dist < 1) { dist = 1; }
                    //merge
                    if (dist < (Math.abs(p1.size/2 + p2.size/2)) ) {
                        this.planets_to_merge.push([i,j]);
                    }
                    let f = (this.gravity_constant * p1.mass * p2.mass) / Math.pow(dist, 2);
                    let fx = (f * dx / dist);  // Break it down into components
                    let fy = (f * dy / dist);
                    p1.force.x += fx;
                    p1.force.y += fy;
                    p2.force.x -= fx;
                    p2.force.y -= fy;
                }
            }
        }
    },
    merge : function(){
        let to_remove = [];
        for (i = 0; i < this.planets_to_merge.length; i++) {
            let [ind1,ind2] = this.planets_to_merge[i];
            let p1 = this.planets[ind1];
            let p2 = this.planets[ind2];
            if (p1.mass < p2.mass) { 
                [p1,p2] = [p2,p1];
            }
            p1.setMass(p1.mass + p2.mass);
            to_remove.push(p2);
        }
        this.planets_to_merge = [];
        for (i = 0; i < to_remove.length; i++) {
            this.planets.splice(this.planets.indexOf(to_remove[i]), 1);
        }
    },
    move : function(){
        for (i = 0; i < this.planets.length; i++) {
            let p = this.planets[i];
            if (p.static == true) { continue; }
            let dt = this.dt;
            //acceleration
            let ax = p.force.x / p.mass;
            let ay = p.force.y / p.mass;
            //velocity
            p.vel.x += ax * dt;
            p.vel.y += ay * dt;
            //position
            p.pos.x += p.vel.x * dt;
            p.pos.y += p.vel.y * dt;
            //collision
            friction = 0.8;
            if ((p.pos.x < (p.size/2))){
                p.vel.x = Math.abs(p.vel.x * friction);
            } else if (p.pos.x > (canvas.width - (p.size/2))) {
                p.vel.x = -Math.abs(p.vel.x * friction);
            }
            if ((p.pos.y < (p.size/2))){
                p.vel.y = Math.abs(p.vel.y * friction);
            } else if (p.pos.y > (canvas.height - (p.size/2))) {
                p.vel.y = -Math.abs(p.vel.x * friction);
            }
        };
    }
}

const Controller = function(){
    this.object = null;
    this.mouse = {
        pos : {x:0,y:0},
        vel : {x:0,y:0}
    };
    this.mousemove = function(ev){
        this.mouse.pos = {x:ev.clientX, y:ev.clientY};
    };
    this.mousedown = function(ev){
        console.log(this.object);

        this.object = new Planet(20);
        this.object.pos = {x:ev.clientX, y:ev.clientY}
        this.object.draw_size = this.object.size;
    };
    this.mouseup = function(ev){
        if (this.object != null) {
            let pos = {x:ev.clientX, y:ev.clientY};
            dx = this.object.pos.x - pos.x
            dy = this.object.pos.y - pos.y
            this.object.setSize(this.object.size);
            this.object.vel = {x:dx, y:dy}
            simulation.planets.push(this.object);
            this.object = null;
        }
    };
    this.wheel = function(ev){
        if (this.object != null) {
            this.object.size -= ev.deltaY/50;
            this.object.draw_size -= ev.deltaY/50;
            if (this.object.size < 5){
                this.object.size = 5;
                this.object.draw_size = 5;
            }
        }
    };
}
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

var simulation = new Simulation();
var graphics = new Graphics();
var controller = new Controller();

function setPlanets(state){
    simulation.planets = [];
    for (i = 0; i < state.length; i++) {
        let prpt = state[i]
        let planet = new Planet(prpt.size)
        planet.pos = {x:prpt.pos.x + window.innerWidth/2,y:prpt.pos.y + window.innerHeight/2}
        planet.color = prpt.color
        planet.vel = {x:prpt.vel.x,y:prpt.vel.y}
        planet.static = prpt.static
        simulation.planets.push(planet)
    }
}
function update(){
    graphics.clear();
    simulation.gravity();
    simulation.move();
    for (i = 0; i < simulation.planets.length; i++) {
        let planet = simulation.planets[i];
        planet.updateDrawSize();
        graphics.draw_planet(planet,1);
    };
    if (controller.object != null) {
        graphics.draw_line(
            controller.object.pos,
            controller.mouse.pos,
            0.5,
            controller.object.color
        );
        let p = new Planet(controller.object.size);
        p.pos = {x:controller.object.pos.x,y:controller.object.pos.y}
        let pos = {x:controller.mouse.pos.x, y:controller.mouse.pos.y};
        dx = controller.object.pos.x - pos.x;
        dy = controller.object.pos.y - pos.y;
        p.vel = {x:dx, y:dy};
        let pred = simulation.gravity_prediction(p, 300);

        graphics.draw_prediction(pred, 0.5, controller.object.color);
        graphics.draw_planet(controller.object, 0.2);
    }
    simulation.merge();
};

canvas.addEventListener("mousedown", function(ev){controller.mousedown(ev)});
canvas.addEventListener("mouseup", function(ev){controller.mouseup(ev)});
canvas.addEventListener("mousemove", function(ev){controller.mousemove(ev)});
canvas.addEventListener("wheel", function(ev){controller.wheel(ev)});
canvas.addEventListener('scroll', function(){window.scrollTo(0,0)});
window.addEventListener("resize", resize);
window.addEventListener("load", update);

resize();

setInterval(update, 1000 / 60);
