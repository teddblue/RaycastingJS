import * as Core from "./Core.js"
export function getObjsInDir(dir, fov, x, y){
    var object = []
    var angle = []
    for(let i=1; i<Core.Map.object.length; i++){
        var obj = Core.Map.object[i]
        var ang = Math.atan2(obj.y-y, obj.x-x)
        if(fov>Math.abs(dir-ang)){
            object.push(i)
            angle.push(ang)
        }
    }
    return({object:object, angle:angle})
}
export function getObjsAtPos(x,y,radius){
    var object = [];
    var distance = [];
    for(let i=1; i<Core.Map.object.length; i++){
        var obj = Core.Map.object[i];
        var dist = Math.sqrt((obj.x-x)^2+(obj.y-y)^2);
        if(radius>dist){
            object.push(i);
            distance.push(dist);
        }
    }
}
export function playSound2d(s,x,y,maxDist,vol=1){
    var dir = Core.Cam.d - Math.atan2(y-Core.Cam.y, x-Core.Cam.x);
    var dist = Math.sqrt((x-Core.Cam.x)**2+(y-Core.Cam.y)**2);
    var pan = Math.sin(dir)*-1;
    var gain = (dist<maxDist)? (maxDist-dist)/maxDist*vol : 0;
    console.log(dist, gain, pan)
    Core.playSound(s,gain,pan);
}