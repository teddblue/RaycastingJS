/*
teddblue's RaycastingJS
i got help from these sources:
raycasting: https://lodev.org/cgtutor/raycasting.html
rgb to hsl: https://gist.github.com/mjackson/5311256
*/

var windW = 320 //width of game in windowed mode
var windH = 240 //height of game in windowed mode
var gameW = windW;
var gameH = windH;
const div = document.getElementById("NicksGame");
const canvas = document.createElement("canvas");
canvas.width = gameW;
canvas.height = gameH;
canvas.style = "image-rendering: pixelated; image-rendering: crisp-edges"
const ctx = canvas.getContext("2d");
ctx.fillRect(0, 0, gameW, gameH);
div.appendChild(canvas);
const assets = document.createElement("div")
assets.style = "display: none; position: absolute"
div.appendChild(assets);
const menu = document.createElement("div");
menu.innerHTML += '<input type="text", id="modelImport", name="modelImport">';
menu.innerHTML += '<input type="button", id="importButton", value="import", onClick="importModel()"/>'
menu.innerHTML += '<button id="clear", onclick="clearSpace()">clear</button>'
menu.innerHTML += '<button id="fulscreen", onclick="toggleFullscreen()">⛶</button>'//for collapse use "⮌"
div.appendChild(menu);
var RUN = true

class HSLA {
	constructor(hue=0, saturation=100, lightness=50, alpha=1){
		this.h = hue;
		this.s = saturation;
		this.l = lightness;
		this.a = alpha
	}
	string = function(){
		return ("hsla("+this.h+","+Math.floor(this.s)+"%,"+Math.floor(this.l)+"%,"+this.a+")");
	}
}

//Map
var level = {
	title: "starter world",
	texSize: 1,
	tiles: [
		new HSLA(240), 
		new HSLA(120), 
		new HSLA(275), 
		new HSLA(), 
		new HSLA(60)
		],
	gridW: 24,
	grid: [
		0,0,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,
		0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,0,0,0,0,0,2,2,2,2,2,0,0,0,0,3,0,3,0,3,0,0,0,1,
		1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,
		1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,3,0,0,0,3,0,0,0,0,
		1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,
		1,0,0,0,0,0,2,2,0,2,2,0,0,0,0,3,0,3,0,3,0,0,0,1,
		1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,4,0,4,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,4,0,0,0,0,5,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,4,0,4,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,4,0,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
		1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1
	]
}
function getTile(x, y){
	idx = Math.floor(x) + (Math.floor(y) * level.gridW)
	data = {
		idx: idx,
		type: level.grid[idx],
		color: level.tiles[level.grid[idx]]
	}
	return data
}

//Camera
var Cam = {
	x: 12,
	y: 12,
	d: 0,
	dirX: -1,
	dirY: 0,
	planeX: 0,
	planeY: 0.66,
	res: 2
}

//Drawing
function drawBkg(){
	ctx.fillStyle = "hsl(60,30%,75%)"
	ctx.fillRect(0, 0, gameW, gameH/2)
	ctx.fillStyle = "hsl(0,90%,20%)"
	ctx.fillRect(0, gameH/2, gameW, gameH)
}
function drawVertical(x, perpWallDist, side, tile){
	// make code to draw line
	var h = Math.floor(gameH/Cam.res);
	var lineHeight = Math.floor(h/perpWallDist);
	var drawStart = h/2 - lineHeight/2;
	if(drawStart<0){drawStart = 0};
	var drawEnd = lineHeight/2 + h/2;
	if(drawEnd >= h){drawEnd = h-1};
	//console.log(tile)
	var color = level.tiles[tile-1]
	color = new HSLA(color.h, color.s, color.l)
	//console.log(tile + " " + typeof color.string())
	if(side == 1){color.l *= .75}
	color = color.string()
	ctx.fillStyle = color;
	ctx.fillRect(x*Cam.res, drawStart*Cam.res, Cam.res, (drawEnd-drawStart)*Cam.res);
}

//Raycast
function Raycast(){
	var w = Math.ceil(gameW/Cam.res);
	for(let x = 0; x < w; x++){;
		var camX = 2*x/w-1;
		var rayDirX = Cam.dirX + Cam.planeX * camX;
		var rayDirY = Cam.dirY + Cam.planeY * camX;
		var mapX = Math.floor(Cam.x);
		var mapY = Math.floor(Cam.y);
		var sideDistX;
		var sideDistY;
		var dDistX = Math.abs(1/rayDirX);// (rayDirX==0)? 1e30 :
		var dDistY = Math.abs(1/rayDirY);// (rayDirY==0)? 1e30 :
		var perpWallDist;
		var stepX;
		var stepY;
		var hit = 0;
		var side;
		var tile;
		if(rayDirX < 0){
			stepX = -1;
			sideDistX = (Cam.x - mapX) * dDistX;
		}else{
			stepX = 1;
			sideDistX = (1 + mapX - Cam.x) * dDistX;
		}
		if(rayDirY < 0){
			stepY = -1;
			sideDistY = (Cam.y - mapY) * dDistY;
		}else{
			stepY = 1;
			sideDistY = (1 + mapY - Cam.y) * dDistY;
		}
		while(hit == 0){
			if(sideDistX < sideDistY){
				sideDistX += dDistX;
				mapX += stepX;
				side = 0;
			}else{
				sideDistY += dDistY;
				mapY += stepY;
				side = 1;
			}
			tile = getTile(mapX, mapY).type
			if(tile > 0){hit = 1;}
			if((mapX<0 || mapX>level.gridW) || (mapY<0 || mapY>Math.floor(level.grid.length/level.gridW))){
				hit = 1;
				tile = 1;
			}
		}
		if(side == 0){
			perpWallDist = (sideDistX - dDistX);
		}else{
			perpWallDist = (sideDistY - dDistY);
		}
		drawVertical(x, perpWallDist, side, tile);
	}
}

// Control
var Keys = {}
function checkControls() {
}
document.addEventListener('keydown', (event) => {
	if (Keys[event.key]) {
		Keys[event.key] += 1;
	} else {
		Keys[event.key] = 1;
	}
}, false);
document.addEventListener('keyup', (event) => {
	Keys[event.key] = 0;
}, false);
function moveCamera(){
	var walkSpeed = .2;
	var turnSpeed = .05;
	var walk = (Keys["w"] > 0) - (Keys["s"] > 0);
	var turn = (Keys["a"] > 0) - (Keys["d"] > 0);
	var strafe = (Keys["e"] > 0) - (Keys["q"] > 0);
	//rotate
	var oDirX = Cam.dirX
	Cam.dirX = Cam.dirX * Math.cos(turn * turnSpeed) - Cam.dirY * Math.sin(turn * turnSpeed);
	Cam.dirY = oDirX * Math.sin(turn * turnSpeed) + Cam.dirY * Math.cos(turn * turnSpeed);
	var oPlaneX = Cam.planeX
	Cam.planeX = Cam.planeX * Math.cos(turn * turnSpeed) - Cam.planeY * Math.sin(turn * turnSpeed);
	Cam.planeY = oPlaneX * Math.sin(turn * turnSpeed) + Cam.planeY * Math.cos(turn * turnSpeed);
	//move with collisions
	if(getTile(Cam.x + walk * Cam.dirX * walkSpeed, Cam.y).type<1){
		Cam.x += walk * Cam.dirX * walkSpeed
	}
	if(getTile(Cam.x, Cam.y + walk * Cam.dirY * walkSpeed).type<1){
		Cam.y += walk * Cam.dirY * walkSpeed
	}
}
function toggleFullscreen(){
	console.log("toggle full screen")
	if(gameW==windW){
		gameW = window.innerHeight * 0.9 * (4/3);
		gameH = window.innerHeight * 0.9;
		canvas.width = window.innerHeight * 0.9 * (4/3);
		canvas.height = window.innerHeight * 0.9;
	}else{
		gameW = windW;
		gameH = windH;
		canvas.width = windW;
		canvas.height = windH;
	}
}

//loading files
var data;
function loadTextures(path){
	if(data == null){return(null)}
	RUN = false
	path += "textures/"
	var list = data.textures
	for(let i=0; i<list.length; i++){
		ctx.fillStyle = "hsla(0,50%,100%,1)"
		ctx.fillRect(0,0,gameW,gameH)
		var tex = document.createElement("img");
		tex.src = path + list[i];
		tex.id = "tex_" + i;
		assets.appendChild(tex);
		ctx.drawImage(tex, 0, 0);
		sourceTex = ctx.getImageData(0, 0, data.texSize, data.texSize).data;
		//console.log(sourceTex)
		data.tiles.push([])
		for(let j=0; j<(sourceTex.length); j+=4){
			var r = sourceTex[j]/255;
			var g = sourceTex[j+1]/255;
			var b = sourceTex[j+2]/255;
			var a = sourceTex[j+3]/255;
			//convert to hsla
			var max = Math.max(r,g,b), min = Math.min(r,g,b);
			var h = (max-min)/2;
			var s = (max-min)/2;
			var l = (max-min)/2;
			if(max==min){
				h = s = 0;
			}else{
				var d = max - min;
				s = l>.05? d/(2-max-min) : d/(max+min);
				switch(max){
					case r: h = (g-b)/d + (g>b? 6 : 0); break;
					case g: h = (b-r)/d + 2; break;
					case b: h = (r-g)/d + 4; break;
				}
				h /= 6;
			}
			h *= 360;
			s *= 100;
			l *= 100;
			data.tiles[i].push(new HSLA(h, s, l, a));
		}
	}
	RUN=true
	console.log(data)
}
async function getLevelFile(path="./level/"){
	const requestURL = path + "map.json"
	const request = new Request(requestURL);
	const response = await fetch(request);
	data = await response.json()
	//console.log(JSON.stringify(data))
	loadTextures(path)
}
getLevelFile();

//gameloop
function MainLoop(timestamp) {
	if(RUN){
		var progress = timestamp - lastRender;
		checkControls();
		moveCamera();
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, gameW, gameH);
		drawBkg();
		Raycast();
		lastRender = timestamp;
		window.requestAnimationFrame(MainLoop);
	}
};
var lastRender = 0;
window.requestAnimationFrame(MainLoop);
//Raycast()