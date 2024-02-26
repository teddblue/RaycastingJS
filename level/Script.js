import * as Core from "./Core.js"
export function Start(){
	
}
export function Update(DTime){
	Core.Map.object[0].x -= 1*DTime/1000;
}