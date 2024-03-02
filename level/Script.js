import * as Core from "./Core.js"
import * as Engine from "./Engine.js"
export function Start(){
	
}
export function Update(DTime, frame){
	var obj = Core.Map.object[0]
	//Core.Map.object[0].x -= 1*DTime/1000;
	if(frame%120==1 || frame%120==20){
		Engine.playSound2d(0,obj.x,obj.y,10)
	}
}