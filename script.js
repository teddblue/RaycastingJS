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
//assets.style = "display: none; position: absolute"
div.appendChild(assets);
const menu = document.createElement("div");
menu.innerHTML += '<input type="text", id="modelImport", name="modelImport">';
menu.innerHTML += '<input type="button", id="importButton", value="import", onClick="importModel()"/>'
menu.innerHTML += '<button id="clear", onclick="clearSpace()">clear</button>'
menu.innerHTML += '<button id="fulscreen", onclick="toggleFullscreen()">⛶</button>'//for collapse use "⮌"
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
}

//Map
var level = {
	title: "starter world",
	texW: 16,
	texH: 16,
	tiles: [
		[new RGB(0,100,255), new RGB(0,0,0)], 
		[new RGB(0,255,0)], 
		[new RGB(200,0,255)], 
		[new RGB(255,0,0)], 
		[new RGB(255,255,0)]
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
	info = {
		idx: idx,
		type: level.grid[idx],
	}
	return info
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
	res: 5
}

//Drawing
function drawBkg(){
	ctx.fillStyle = "hsl(60,30%,75%)"
	ctx.fillRect(0, 0, gameW, gameH/2)
	ctx.fillStyle = "hsl(0,90%,20%)"
	ctx.fillRect(0, gameH/2, gameW, gameH)
}
function drawVertical(x, perpWallDist, side, tile, texX){
	// make code to draw line
	var h = (gameH/Cam.res);
	var lineHeight = (h/perpWallDist);
	var drawStart = (h/2 - lineHeight/2);
	var drawEnd = (lineHeight/2 + h/2);
	var drawSize = drawEnd-drawStart
	// draw vertical in sections by color
	var segSize = (drawSize/level.texH)
	for(let i=0; i<level.texH; i++){
		var segStart = (drawStart + segSize*i)
		var segEnd = (segStart + segSize)
		if(segStart<0){segStart=0}
		if(segEnd>=h){segEnd = h-1}
		if(segStart<=h && segEnd>=0){
			var pixelIdx = (i * level.texW + texX)%(level.tiles[tile-1].length)
			var color = level.tiles[tile-1][pixelIdx]
			//console.log(color)
			color = new RGB(color.r, color.g, color.b)
			if(side == 1){
				color.r *= .75
				color.g *= .75
				color.b *= .75
			}
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
		var wallX;
		if(side==0){
			wallX = Cam.y + perpWallDist * rayDirY;
		}else{
			wallX = Cam.x + perpWallDist * rayDirX;
		}
		wallX -= Math.floor(wallX)
		var texX = Math.floor(wallX * level.texW);
		if(side==0 && rayDirX>0){
			texX = level.texW - texX - 1;
		}
		if(side==1 && rayDirY<0){
			texX = level.texW - texX - 1;
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
function moveCamera(){
	var walkSpeed = .2;
	var turnSpeed = .05;
	var walk = (Keys["w"] > 0) - (Keys["s"] > 0);
	var turn = (Keys["a"] > 0) - (Keys["d"] > 0);
	var strafe = (Keys["q"] > 0) - (Keys["e"] > 0);
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
	var strafeDir = Math.atan2(Cam.dirY, Cam.dirX) + (Math.PI/2)
	if(getTile(Cam.x + Math.cos(strafeDir) * strafe * walkSpeed, Cam.y).type<1){
		Cam.x += Math.cos(strafeDir) * strafe * walkSpeed
	}
	if(getTile(Cam.x, Cam.y + Math.sin(strafeDir) * strafe * walkSpeed).type<1){
		Cam.y += Math.sin(strafeDir) * strafe * walkSpeed
	}
}
function toggleFullscreen(){
	//console.log("toggle full screen")
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
var loaded = 0;
function encodeTexture(){
	ctx.drawImage(this, 0, 0);
	sourceTex = ctx.getImageData(0, 0, 16, 16);
	for(let j=0; j<(sourceTex.data.length); j+=4){
		var r = sourceTex.data[j];
		var g = sourceTex.data[j+1];
		var b = sourceTex.data[j+2];
		data.tiles[this.texIdx].push(new RGB(r, g, b));
	}
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
		data.tiles.push([])
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
getLevelFile();
var lastRender = 0;
window.requestAnimationFrame(MainLoop);
//Raycast()