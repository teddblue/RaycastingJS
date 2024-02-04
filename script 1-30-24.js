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
var isFullscreen = false;
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
menu.innerHTML += '<button id="fullscreen", onclick="fullscreen()">⛶</button>'//for collapse use "⮌"
menu.innerHTML += '<p id="debug" style="display:inline"> fps:0 </0>'
div.appendChild(menu);

var logData = false;

// color
class RGB {
	constructor(red = 0, green = 0, blue = 0) {
		this.r = red;
		this.g = green;
		this.b = blue;
	}
}
function addRGB(color, r, g, b) {
	color.r += r;
	if (color.r > 255) { color.r -= 256 };
	if (color.r < 0) { color.r = 0 };
	color.g += g;
	if (color.g > 255) { color.g -= 256 };
	if (color.g < 0) { color.g = 0 };
	color.b += b;
	if (color.b > 255) { color.b -= 256 };
	if (color.b < 0) { color.b = 0 };
	return color
}
function multRGB(color, r, g, b) {
	color.r *= r;
	if (color.r > 255) { color.r = 255 };
	if (color.r < 0) { color.r = 0 };
	color.g *= g;
	if (color.g > 255) { color.g = 255 };
	if (color.g < 0) { color.g = 0 };
	color.b *= b;
	if (color.b > 255) { color.b = 255 };
	if (color.b < 0) { color.b = 0 };
	return color
}
function stringRGB(color) {
	return ("rgb(" + color.r + "," + color.g + "," + color.b + ")");
}

//Map
var level = {
	title: "starter world",
	texW: 2,
	texH: 2,
	tiles: [
		{ h: 2, w: 2, pixels: [new RGB(0, 100, 255), new RGB(0, 0, 0)] },
		{ h: 1, w: 1, pixels: [new RGB(0, 255, 0)] },
		{ h: 1, w: 1, pixels: [new RGB(200, 0, 255)] },
		{ h: 1, w: 1, pixels: [new RGB(255, 0, 0)] },
		{ h: 1, w: 1, pixels: [new RGB(255, 255, 0)] }
	],
	floorTex: 0,
	ceilTex: 0,
	skybox: 0,
	gridW: 0,
	grid: [],
	floor: [],
	ceil: [],
	object: [{ x: 5, y: 5, z: 0, dist: 0, tile: 0 }, { x: 5, y: 10, z: 0, dist: 1, tile: 0 }, { x: 10, y: 5, z: 0, d: 2, tile: 0 }]
}
function getTile(x, y) {
	var idx = Math.floor(x) + (Math.floor(y) * level.gridW)
	var type = level.grid[idx]
	if (x < 0 || x > level.gridW || y < 0 || y > level.grid.length / level.gridW) {
		idx = -1;
		type = 1;
	}
	var info = {
		idx: idx,
		type: type
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
	res: 2,
	drawDist: 10,
	fog:{
		min: 5,
		max: 10
	}
}
var h = Math.ceil(gameH / Cam.res)
var w = Math.ceil(gameW / Cam.res)
var ZBuffer = [];
function fogRGB(color, distance){
	distance = Math.abs(distance)
	if(level.fog){
		var fogColor = level.fog.color
		//fogColor = new RGB(fogColor.r, fogColor.g, fogColor.b)
		if(distance>level.fog.max){
			color.r = fogColor.r;
			color.g = fogColor.g;
			color.b = fogColor.b;
		}else if(distance>level.fog.min){
			var m = (distance - Cam.fog.min)/(Cam.fog.max-Cam.fog.min);
			m = Math.min(Math.max(m, 0), 1);
			color.r = (color.r * (1-m))+(fogColor.r*m);
			color.g = (color.g * (1-m))+(fogColor.g*m);
			color.b = (color.b * (1-m))+(fogColor.b*m);
		}
	}
	return color
}

//Drawing
function drawBkg() {
	ctx.fillStyle = "rgb(0,0,0)"
	ctx.fillRect(0, 0, gameW, gameH)
	var dx = Math.floor(windW * Cam.d);
	var dy = 0 - (windH * Math.PI / 2);
	var dw = Math.floor(windW * 2 * Math.PI);
	var dh = Math.floor(windH * 2 * Math.PI);
	ctx.drawImage(document.getElementById("tex_" + level.skybox), dx, dy, dw, dh)
	ctx.drawImage(document.getElementById("tex_" + level.skybox), dx - dw, dy, dw, dh)
}
function drawHorizontal() {
	h = Math.ceil(gameH / Cam.res)
	w = Math.ceil(gameW / Cam.res)
	for (let y = 0; y < h / 2; y++) {
		var rayDirX0 = Cam.dirX - Cam.planeX;
		var rayDirY0 = Cam.dirY - Cam.planeY;
		var rayDirX1 = Cam.dirX + Cam.planeX;
		var rayDirY1 = Cam.dirY + Cam.planeY;

		var p = y - h / 2;
		var posZ = Cam.z * h;
		var rowDistance = posZ / p;

		var floorStepX = rowDistance * (rayDirX1 - rayDirX0) / w;
		var floorStepY = rowDistance * (rayDirY1 - rayDirY0) / w;
		var floorX = (rowDistance * rayDirX0) - Cam.x;
		var floorY = (rowDistance * rayDirY0) - Cam.y;

		for (let x = 0; x < w; x++) {
			var cellX = Math.floor(floorX);
			var cellY = Math.floor(floorY);

			var idx = cellX - (cellY * level.gridW)
			if (idx < 0 || idx > level.grid.length || cellX >= 0 || cellX < 0 - level.gridW) {
				idx = -1
			}

			//draw floor
			if (idx > -1) {
				if (level.floor[idx % level.floor.length] > 0) {
					var texture = level.tiles[level.floor[idx % level.floor.length]]
					var tx = Math.floor(texture.w * (floorX - cellX)) % (texture.w - 1);
					var ty = Math.floor(texture.h * (floorY - cellY)) % (texture.h - 1);
					var color = texture.pixels[tx + ty * texture.w]
					color = new RGB(color.r, color.g, color.b)
					color = fogRGB(color, rowDistance)
					if (stringRGB(color) == "rgb(255,0,255)") {
						//transparency
					} else {
						color = stringRGB(color)
						ctx.fillStyle = color;
						ctx.fillRect(
							Math.floor(x * Cam.res),
							Math.ceil((h - y) * Cam.res - 1),
							Math.floor(Cam.res),
							Math.floor(Cam.res)
						);
					}
				}
				//draw ceiling
				if (level.floor[idx % level.ceil.length] > 0) {
					texture = level.tiles[level.ceil[idx % level.ceil.length]]
					tx = Math.floor(texture.w * (floorX - cellX)) % (texture.w - 1);
					ty = Math.floor(texture.h * (floorY - cellY)) % (texture.h - 1);
					color = texture.pixels[tx + ty * texture.w]
					color = new RGB(color.r, color.g, color.b)
					color = fogRGB(color, rowDistance)
					if (stringRGB(color) == "rgb(255,0,255)") {
						//transparency
					} else {
						color = stringRGB(color)
						ctx.fillStyle = color;
						ctx.fillRect(
							Math.floor(x * Cam.res),
							Math.ceil((y) * Cam.res - 1),
							Math.floor(Cam.res),
							Math.floor(Cam.res)
						);
					}
				}
			}
			floorX += floorStepX;
			floorY += floorStepY;
		}
	}
}
function drawVertical(x, perpWallDist, side, tile, texX) {
	// make code to draw line
	if (tile == 0) {
		return null
	}
	tile -= 1
	texture = level.tiles[tile]//level.blocks[tile].texture[0]]
	var lineHeight = (h / perpWallDist);
	var drawStart = (h * Cam.z - lineHeight / 2);
	var drawEnd = (lineHeight / 2 + h * Cam.z);
	var drawSize = drawEnd - drawStart
	// draw vertical in sections by color
	var segSize = (drawSize / texture.h)
	for (let i = 0; i < texture.h; i++) {
		var segStart = (drawStart + segSize * i)
		var segEnd = (segStart + segSize)
		if (segStart < 0) { segStart = 0 }
		if (segEnd >= h) { segEnd = h }
		if (segStart <= h && segEnd >= 0) {
			var pixelIdx = Math.abs(i * texture.w + texX) % (texture.pixels.length)

			var color = texture.pixels[pixelIdx]
			color = new RGB(color.r, color.g, color.b)
			if (stringRGB(color) == "rgb(255,0,255)") {
				//transparency
			} else {
				if (side == 1) { color = multRGB(color, .7, .7, .7) }
				color = fogRGB(color, perpWallDist)
				color = stringRGB(color)
				ctx.fillStyle = color;
				ctx.fillRect(
					Math.floor(x * Cam.res),
					Math.floor(segStart * Cam.res),
					Math.floor(Cam.res),
					Math.ceil((segEnd - segStart) * Cam.res)
				);
			}
		}
	}
}
function drawObjects() {
	//calculate and sort by distance from cam per object
	for (let i = 0; i < level.object.length; i++) {
		var obj = level.object[i]
		level.object[i].dist = ((Cam.x - obj.x) ** 2) + ((Cam.y - obj.y) ** 2);
	}
	level.object.sort(function(a, b) { return a.dist - b.dist })

	for (let i = 0; i < level.object.length; i++) {
		if (obj.tile > 0) {
			//fixing object flicker, hapens within this if, the if works as intended
			var obj = level.object[i];
			var spriteX = obj.x - Cam.x;
			var spriteY = obj.y - Cam.y;

			var invDet = 1 / (Cam.planeX * Cam.dirY - Cam.dirX * Cam.planeY);
			var transformX = invDet * (Cam.dirY * spriteX - Cam.dirX * spriteY);
			var transformY = invDet * (-1 * Cam.planeY * spriteX + Cam.planeX * spriteY);
			var spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY));

			var spriteH = Math.abs(Math.floor(h / transformY))
			var drawStartY = -1 * spriteH / 2 + h / 2;
			if (drawStartY < 0) { drawStartY = 0 }
			var drawEndY = spriteH / 2 + h / 2;
			if (drawEndY >= h) { drawEndY = h - 1 }

			var spriteW = Math.abs(Math.floor(h / transformY))
			var originX = Math.floor(-1 * spriteW / 2 + spriteScreenX)
			var drawStartX = ((originX > 0) ? originX : 0)
			var drawEndX = Math.floor(spriteW / 2 + spriteScreenX);
			if (drawEndX > w) { drawEndX = w };

			var texture = level.tiles[obj.tile - 1]
			for (let stripe = drawStartX; stripe <= drawEndX; stripe++) {
				if (transformY > 0 & stripe > 0 & stripe < w & transformY < ZBuffer[stripe]) {
					var texX = Math.floor(texture.w * (stripe - originX) / spriteW);
					drawVertical(stripe, transformY, 0, obj.tile, texX)
				}
			}
		}
	}
}

//Raycast
function Raycast() {
	h = Math.ceil(gameH / Cam.res)
	w = Math.ceil(gameW / Cam.res)
	drawHorizontal();
	wallZ = [];
	for (let x = 0; x < w; x++) {
		;
		var camX = 2 * x / w - 1;
		var rayDirX = Cam.dirX + Cam.planeX * camX;
		var rayDirY = Cam.dirY + Cam.planeY * camX;
		var mapX = Math.floor(Cam.x);
		var mapY = Math.floor(Cam.y);
		var sideDistX;
		var sideDistY;
		var dDistX = Math.abs(1 / rayDirX);// (rayDirX==0)? 1e30 :
		var dDistY = Math.abs(1 / rayDirY);// (rayDirY==0)? 1e30 :
		var perpWallDist;
		var stepX;
		var stepY;
		var hit = 0;
		var side;
		var tile;
		if (rayDirX < 0) {
			stepX = -1;
			sideDistX = (Cam.x - mapX) * dDistX;
		} else {
			stepX = 1;
			sideDistX = (1 + mapX - Cam.x) * dDistX;
		}
		if (rayDirY < 0) {
			stepY = -1;
			sideDistY = (Cam.y - mapY) * dDistY;
		} else {
			stepY = 1;
			sideDistY = (1 + mapY - Cam.y) * dDistY;
		}
		while (hit == 0) {
			if (sideDistX < sideDistY) {
				sideDistX += dDistX;
				mapX += stepX;
				side = 0;
			} else {
				sideDistY += dDistY;
				mapY += stepY;
				side = 1;
			}
			tile = getTile(mapX, mapY).type
			if (tile > 0) { hit = 1; }
			if ((mapX < 0 || mapX >= level.gridW) || (mapY < 0 || mapY > Math.floor(level.grid.length / level.gridW))) {
				hit = 1;
				tile = 0;
			}
		}
		if (side == 0) {
			perpWallDist = (sideDistX - dDistX);
		} else {
			perpWallDist = (sideDistY - dDistY);
		}
		var wallX;
		if (side == 0) {
			wallX = Cam.y + perpWallDist * rayDirY;
		} else {
			wallX = Cam.x + perpWallDist * rayDirX;
		}
		wallX -= Math.floor(wallX)
		var texX;
		if (tile > 0) {
			texX = Math.floor(wallX * level.tiles[tile - 1].w);
			if (side == 0 && rayDirX > 0) {
				texX = level.tiles[tile - 1].w - texX - 1;
			}
			if (side == 1 && rayDirY < 0) {
				texX = level.tiles[tile - 1].w - texX - 1;
			}
		} else {
			texX = 0;
		}
		if (level.blocks) { tile = level.blocks[tile].texture[0] }
		drawVertical(x, perpWallDist, side, tile, texX);
		ZBuffer[x] = perpWallDist;
	}
	drawObjects();
}

// Control
var Keys = {}
var Mouse = { x: 0, y: 0, z: 0, b1: 0, b2: 0, b3: 0 }
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
document.addEventListener('mousemove', (event) => {
	Mouse.x = event.movementX;
	Mouse.y = event.movementY;
}, false);

function moveCamera(DTime) {
	var walkSpeed = .2;
	var turnSpeed = .1;
	var walk = (Keys["w"] > 0 || Keys["ArrowUp"] > 0) - (Keys["s"] > 0 || Keys["ArrowDown"] > 0);
	var turn = (Keys["q"] > 0 || Keys["ArrowLeft"] > 0) - (Keys["e"] > 0 || Keys["ArrowRight"] > 0);
	if (document.pointerLockElement == canvas) { turn = Mouse.x / -20 }; //mouse controls
	var strafe = (Keys["a"] > 0) - (Keys["d"] > 0);
	//var fly = (Keys["f"] > 0) - (Keys["r"] > 0);
	//rotate
	Cam.d = (Cam.d + turn * turnSpeed) % (2 * Math.PI);
	if (Cam.d < 0) { Cam.d += 2 * Math.PI };
	var oDirX = Cam.dirX;
	Cam.dirX = Cam.dirX * Math.cos(turn * turnSpeed) - Cam.dirY * Math.sin(turn * turnSpeed);
	Cam.dirY = oDirX * Math.sin(turn * turnSpeed) + Cam.dirY * Math.cos(turn * turnSpeed);
	var oPlaneX = Cam.planeX;
	Cam.planeX = Cam.planeX * Math.cos(turn * turnSpeed) - Cam.planeY * Math.sin(turn * turnSpeed);
	Cam.planeY = oPlaneX * Math.sin(turn * turnSpeed) + Cam.planeY * Math.cos(turn * turnSpeed);
	//move with collisions
	if (getTile(Cam.x + Cam.dirX * walk * .4 + walk * Cam.dirX * walkSpeed, Cam.y).type < 1) {
		Cam.x += walk * Cam.dirX * walkSpeed;
	};
	if (getTile(Cam.x, Cam.y + Cam.dirY * walk * .4 + walk * Cam.dirY * walkSpeed).type < 1) {
		Cam.y += walk * Cam.dirY * walkSpeed;
	};
	//strafe with collisions
	var strafeDir = Math.atan2(Cam.dirY, Cam.dirX) + (Math.PI / 2);
	if (getTile(Cam.x + Math.cos(strafeDir) * strafe * .4 + Math.cos(strafeDir) * strafe * walkSpeed, Cam.y).type < 1) {
		Cam.x += Math.cos(strafeDir) * strafe * walkSpeed;
	};
	if (getTile(Cam.x, Cam.y + Math.sin(strafeDir) * strafe * .4 + Math.sin(strafeDir) * strafe * walkSpeed).type < 1) {
		Cam.y += Math.sin(strafeDir) * strafe * walkSpeed;
	};

	Mouse.x = 0;
	Mouse.y = 0;
}
function fullscreen() {
	if (canvas.webkitRequestFullScreen) {
		canvas.webkitRequestFullScreen();
	} else {
		canvas.mozRequestFullScreen();
	}
}
document.addEventListener("fullscreenchange", (event) => {
	if (document.fullscreenElement) {
		isFullscreen = true
	} else {
		isFullscreen = false
	}
}, false);
canvas.addEventListener("click", async () => {
	await canvas.requestPointerLock();
});

//loading files
var data;
var loaded = 0;
function encodeTexture() {
	var img = {
		h: 16,
		w: 16,
		pixels: []
	}
	img.h = this.height;
	img.w = this.width;
	ctx.drawImage(this, 0, 0);
	sourceTex = ctx.getImageData(0, 0, img.w, img.h);
	for (let j = 0; j < (sourceTex.data.length); j += 4) {
		var r = sourceTex.data[j];
		var g = sourceTex.data[j + 1];
		var b = sourceTex.data[j + 2];
		img.pixels.push(new RGB(r, g, b));
	}
	data.tiles[this.texIdx] = img;
	loaded += 1;
	if (loaded == data.textures.length) {
		level = data
		console.log("load finished")
		console.log(data)
		RUN = true
	}
}
function loadTextures(path) {
	if (data == null) { return (null) }
	path += "textures/"
	var list = data.textures
	data.tiles = []
	for (let i = 0; i < list.length; i++) {
		data.tiles.push({})
	}
	for (let i = 0; i < list.length; i++) {
		ctx.fillStyle = "rgb(0,0,0)"
		ctx.fillRect(0, 0, gameW, gameH)
		var tex = new Image();
		tex.onload = encodeTexture;
		tex.src = path + list[i];
		tex.id = "tex_" + i;
		tex.texIdx = i
		assets.appendChild(tex);
	}
}
async function getLevelFile(path = "./level/") {
	//RUN = false
	const requestURL = path + "map.json"
	const request = new Request(requestURL);
	const response = await fetch(request);
	data = await response.json()
	if (data == null) { return (null) }
	path += "textures/"
	var list = data.textures
	data.tiles = []
	for (let i = 0; i < list.length; i++) {
		data.tiles.push({})
	}
	for (let i = 0; i < list.length; i++) {
		ctx.fillStyle = "rgb(0,0,0)"
		ctx.fillRect(0, 0, gameW, gameH)
		var tex = new Image();
		tex.onload = encodeTexture;
		tex.src = path + list[i];
		tex.id = "tex_" + i;
		tex.texIdx = i
		assets.appendChild(tex);
	}
}

//gameloop
var lastRender = 0;
var frame = 0;
var bigD = 0;
var fps = 30;
function refreshDebug(DTime) {
	var debug = document.getElementById("debug")
	bigD += DTime;
	if (frame % 8 == 0) {
		var fps = Math.round((1000 / (bigD / 8)) * 10) / 10
		debug.innerHTML = " fps:" + fps + ", res:" + Cam.res;
		bigD = 0;

	}
};
function MainLoop(timestamp) {
	if (RUN) {
		var DTime = timestamp - lastRender;
		moveCamera(DTime);
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, gameW, gameH);
		drawBkg();
		Raycast();
		refreshDebug(DTime);
		if (fps > 30 && Cam.res > 1) { Cam.res -= 1 };
		if (fps < 24) { Cam.res += 1 }
		frame += 1;
		lastRender = timestamp;
		window.requestAnimationFrame(MainLoop);
	}
};
getLevelFile().then(MainLoop);
//drawHorizontal()
//Raycast()