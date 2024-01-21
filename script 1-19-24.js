/*
teddblue's RaycastingJS
i got help from these sources:
raycasting: https://lodev.org/cgtutor/raycasting.html
rgb to hsl: https://gist.github.com/mjackson/5311256
*/
var RUN = true

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
menu.innerHTML += '<button id="fullscreen", onclick="toggleFullscreen()">⛶</button>'//for collapse use "⮌"
menu.innerHTML += '<p id="debug" style="display:inline"> fps:0 </0>'
div.appendChild(menu);

class RGB {
	constructor(red=0, green=0, blue=0){
		this.r = red;
		this.g = green;
		this.b = blue;
	}
	string = function(){
		return ("rgb("+this.r+","+Math.floor(this.g)+","+Math.floor(this.b)+")");
	}
	add = function(r, g, b){
		this.r += r;
		if(this.r > 255){this.r -= 256};
		if(this.r < 0){this.r = 0};
		this.g += g;
		if(this.g > 255){this.g -= 256};
		if(this.g < 0){this.g = 0};
		this.b += b;
		if(this.b > 255){this.b -= 256};
		if(this.b < 0){this.b = 0};
	}
	mult = function(r, g, b){
		this.r *= r;
		if(this.r > 255){this.r -= 256};
		if(this.r < 0){this.r = 0};
		this.g *= g;
		if(this.g > 255){this.g -= 256};
		if(this.g < 0){this.g = 0};
		this.b *= b;
		if(this.b > 255){this.b -= 256};
		if(this.b < 0){this.b = 0};
	}
}

//Map
var level = {
	title: "starter world",
	texW: 2,
	texH: 2,
	tiles: [
		[new RGB(0,100,255), new RGB(0,0,0)], 
		[new RGB(0,255,0)], 
		[new RGB(200,0,255)], 
		[new RGB(255,0,0)], 
		[new RGB(255,255,0)]
	],
	floorTex: 0,
	ceilTex: 1,
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
	var type = level.grid[idx]
	if(x<0 || x>level.gridW || y<0 || y>level.grid.length/level.gridW){
		idx = -1,
		type = 1
	}
	info = {
		idx: idx,
		type: type,
	}
	return info
}

//Camera
var Cam = {
	x: 12,
	y: 12,
	z: .5,
	d: 0,
	dirX: -1,
	dirY: 0,
	planeX: 0,
	planeY: 0.66,
	res: 3,
	drawDist: 10
}
var h = Math.ceil(gameH/Cam.res)
var w = Math.ceil(gameW/Cam.res)

//Drawing
function drawBkg(){
	var horizon = h*Cam.z*Cam.res
	ctx.fillStyle = "hsl(60,30%,75%)"
	ctx.fillRect(0, 0, gameW, horizon)
	ctx.fillStyle = "hsl(0,90%,20%)"
	ctx.fillRect(0, horizon, gameW, gameH)
}
function drawVertical(x, perpWallDist, side, tile, texX){
	// make code to draw line
	if(tile == 0){
		return null
	}
	tile -= 1
	var lineHeight = (h/perpWallDist);
	var drawStart = (h*Cam.z - lineHeight/2);
	var drawEnd = (lineHeight/2 + h*Cam.z);
	var drawSize = drawEnd-drawStart
	// draw vertical in sections by color
	var segSize = (drawSize/level.tiles[tile].h)
	for(let i=0; i<level.tiles[tile].h; i++){
		var segStart = (drawStart + segSize*i)
		var segEnd = (segStart + segSize)
		if(segStart<0){segStart=0}
		if(segEnd>=h){segEnd=h}
		if(segStart<=h && segEnd>=0){
			var pixelIdx = (i*level.tiles[tile].w + texX)%(level.tiles[tile].pixels.length)
			var color = level.tiles[tile].pixels[pixelIdx]
			color = new RGB(color.r, color.g, color.b)
			if(color.string == "rgb(255,0,255)"){
				//transparency
			}else{
				if(side == 1){color.mult(.7, .7, .7)}
				color = color.string()
				ctx.fillStyle = color;
				ctx.fillRect(
					Math.floor(x*Cam.res), 
					Math.floor(segStart*Cam.res), 
					Math.floor(Cam.res), 
					Math.ceil((segEnd-segStart)*Cam.res)
				);
			}
		}
	}
	//draw floor
	for(let y=Math.floor(drawEnd+1); y<h; y++){
		
	}
}

//Raycast
function Raycast(){
	h = Math.ceil(gameH/Cam.res)
	w = Math.ceil(gameW/Cam.res)

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
				tile = 0;
			}
		}
		if(side == 0){
			perpWallDist = (sideDistX - dDistX);
		}else{
			perpWallDist = (sideDistY - dDistY);
		}
		var wallX;
		if(side==0){
			wallX = Cam.y + perpWallDist * rayDirY;
		}else{
			wallX = Cam.x + perpWallDist * rayDirX;
		}
		wallX -= Math.floor(wallX)
		var texX;
		if(tile > 0){
			texX = Math.floor(wallX * level.tiles[tile-1].w);
			if(side==0 && rayDirX>0){
				texX = level.tiles[tile-1].w - texX - 1;
			}
			if(side==1 && rayDirY<0){
				texX = level.tiles[tile-1].w - texX - 1;
			}
		}else{
			texX = 0;
		}
		drawVertical(x, perpWallDist, side, tile, texX);
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
function moveCamera(DTime){
	var walkSpeed = .2;
	var turnSpeed = .05;
	var walk = (Keys["w"] > 0) - (Keys["s"] > 0);
	var turn = (Keys["a"] > 0) - (Keys["d"] > 0);
	var strafe = (Keys["q"] > 0) - (Keys["e"] > 0);
	//var fly = (Keys["f"] > 0) - (Keys["r"] > 0);
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
	//strafe with collisions
	var strafeDir = Math.atan2(Cam.dirY, Cam.dirX) + (Math.PI/2)
	if(getTile(Cam.x + Math.cos(strafeDir) * strafe * walkSpeed, Cam.y).type<1){
		Cam.x += Math.cos(strafeDir) * strafe * walkSpeed
	}
	if(getTile(Cam.x, Cam.y + Math.sin(strafeDir) * strafe * walkSpeed).type<1){
		Cam.y += Math.sin(strafeDir) * strafe * walkSpeed
	}
}
function toggleFullscreen(){
	h = Math.ceil(gameH/Cam.res)
	w = Math.ceil(gameW/Cam.res)
	console.log("h: " + h + ", w: " + w)
	var btn = document.getElementById("fullscreen")
	if(gameW==windW){
		gameW = window.innerHeight * 0.9 * (4/3);
		gameH = window.innerHeight * 0.9;
		canvas.width = window.innerHeight * 0.9 * (4/3);
		canvas.height = window.innerHeight * 0.9;
		btn.innerHTML = "X"
	}else{
		gameW = windW;
		gameH = windH;
		canvas.width = windW;
		canvas.height = windH;
		btn.innerHTML = "⛶"
	}
	Cam.res = Math.round(gameW/w)
	console.log(Cam.res)
	h = Math.ceil(gameH/Cam.res)
	w = Math.ceil(gameW/Cam.res)
	console.log("h: " + h + ", w: " + w)
}

//loading files
var data;
var loaded = 0;
function encodeTexture(){
	var img = {
		h:16,
		w:16,
		pixels:[]
	}
	img.h = this.height;
	img.w = this.width;
	ctx.drawImage(this, 0, 0);
	sourceTex = ctx.getImageData(0, 0, img.w, img.h);
	for(let j=0; j<(sourceTex.data.length); j+=4){
		var r = sourceTex.data[j];
		var g = sourceTex.data[j+1];
		var b = sourceTex.data[j+2];
		img.pixels.push(new RGB(r, g, b));
	}
	data.tiles[this.texIdx]=img;
	loaded += 1;
	if(loaded == data.textures.length){
		level = data
		console.log("load finished")
		console.log(data)
		RUN = true
	}
}
function loadTextures(path){
	if(data == null){return(null)}
	path += "textures/"
	var list = data.textures
	data.tiles = []
	for(let i=0; i<list.length; i++){
		data.tiles.push({})
	}
	for(let i=0; i<list.length; i++){
		ctx.fillStyle = "rgb(0,0,0)"
		ctx.fillRect(0,0,gameW,gameH)
		var tex = new Image();
		tex.onload = encodeTexture;
		tex.src = path + list[i];
		tex.id = "tex_" + i;
		tex.texIdx = i
		assets.appendChild(tex);
	}
}
async function getLevelFile(path="./level/"){
	//RUN = false
	const requestURL = path + "map.json"
	const request = new Request(requestURL);
	const response = await fetch(request);
	data = await response.json()
	loadTextures(path)
}

//gameloop
var lastRender = 0;
var frame = 0;
var bigD = 0;
var fps = 30;
function refreshDebug(DTime){
	var debug = document.getElementById("debug")
	bigD += DTime;
	if(frame % 8 == 0){
		var fps = Math.round((1000/(bigD/8))*10)/10
		debug.innerHTML = " fps:" + fps + ", res:" + Cam.res
		bigD = 0;
		
	}
};
function MainLoop(timestamp) {
	if(RUN){
		var DTime = timestamp - lastRender;
		checkControls();
		moveCamera(DTime);
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, gameW, gameH);
		drawBkg();
		Raycast();
		refreshDebug(DTime);
		if(fps>30 && Cam.res>1){Cam.res -= 1};
		if(fps<24){Cam.res += 1}
		frame += 1;
		lastRender = timestamp;
		window.requestAnimationFrame(MainLoop);
	}
};
getLevelFile();
window.requestAnimationFrame(MainLoop);
//drawHorizontal()
//Raycast()