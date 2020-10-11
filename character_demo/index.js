import { AnimationController } from './AnimationController.js';


// https://github.com/evanw/webgl-water
// https://github.com/donmccurdy/three-gltf-viewer/blob/master/src/viewer.js
const el = document.getElementById("container");
const fov = 60;
const defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const container = document.querySelector('#container');
const raycaster = new THREE.Raycaster();
const loadingManager = new THREE.LoadingManager();
let animationController;


// https://stackoverflow.com/questions/35575065/how-to-make-a-loading-screen-in-three-js
loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
	// set up a loading bar
	let container = document.getElementById("container");
	let containerDimensions = container.getBoundingClientRect();
	let left = (containerDimensions.left + Math.round(.40 * containerDimensions.width)) + "px";
	let top = (containerDimensions.top + Math.round(.50 * containerDimensions.height)) + "px";
	let loadingBarContainer = createProgressBar("loading", "#00ff00");
	loadingBarContainer.style.left = left;
	loadingBarContainer.style.top = top;
	container.appendChild(loadingBarContainer);
}

loadingManager.onLoad = () => {
	document.getElementById("container").removeChild(
		document.getElementById("loadingBarContainer")
	);
}

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
	let bar = document.getElementById("loadingBar");
	bar.style.width = (parseInt(bar.parentNode.style.width) * (itemsLoaded/itemsTotal)) + 'px';
}

loadingManager.onError = (url) => {
	console.log("there was an error loading :(");
}

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(el.clientWidth, el.clientHeight);	
container.appendChild(renderer.domElement);


//https://threejs.org/docs/#examples/en/controls/OrbitControls
// or this?: https://github.com/mrdoob/three.js/blob/dev/examples/jsm/controls/TrackballControls.js
//const controls = new OrbitControls(defaultCamera, renderer.domElement);

const camera = defaultCamera;
camera.position.set(0,5,20);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);	
scene.add(camera);


let pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 20, -25);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 0;
pointLight.shadow.mapSize.height = 0;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 100;
pointLight.shadow.camera.fov = 70;
scene.add(pointLight);


let hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const clock = new THREE.Clock();
let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;

let loadedModels = [];
let animationMixer = null;
let animationClips = null;

function getModel(modelFilePath, side, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			function(gltf){
				if(gltf.animations.length > 0 && name === "p1"){
					let clips = {};
					gltf.animations.forEach((action) => {
						let name = action['name'].toLowerCase();
						name = name.substring(0, name.length - 1);
						clips[name] = action;
					});
					animationClips = clips;
					//console.log(animationClips);
				}
				
				gltf.scene.traverse((child) => {
					if(child.type === "Mesh" || child.type === "SkinnedMesh"){
						
						if(child.type === "SkinnedMesh"){
							child.add(child.skeleton.bones[0]); // add pelvis to mesh as a child
							
							if(name !== "obj"){
								child.scale.x *= .3;
								child.scale.y *= .3;
								child.scale.z *= .3;
							}else{
								// need to re-orient tool to equip
								child.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/2);
								child.rotateOnAxis(new THREE.Vector3(0,0,-1), Math.PI/2);
							}
						}
						
						let material = child.material;
						let geometry = child.geometry;
						let obj = child;
						
						if(name === "bg"){
							obj.scale.x = child.scale.x * 10;
							obj.scale.y = child.scale.y * 10;
							obj.scale.z = child.scale.z * 10;
							//obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
						}else{
							//obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
						}
						
						obj.name = name;
						resolve(obj);
					}
				});
				
			},
			// called while loading is progressing
			function(xhr){
				console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
			},
			// called when loading has errors
			function(error){
				console.log('An error happened');
				console.log(error);
			}
		);
	});
}



// https://threejs.org/docs/#api/en/textures/Texture
// create a mesh, apply ocean shader on it 
loadedModels.push(getModel('models/oceanfloor.glb', 'none', 'bg'));
loadedModels.push(getModel('models/humanoid-rig-with-gun-test.gltf', 'player', 'p1'));
loadedModels.push(getModel('models/m4carbine-final.gltf', 'tool', 'obj'));

let thePlayer = null;
let theNpc = null;
let tool = null;
let terrain = null;
let bgAxesHelper;
let playerAxesHelper;
let playerGroupAxesHelper;

Promise.all(loadedModels).then((objects) => {
	objects.forEach((mesh) => {
		if(mesh.name === "bg"){
			mesh.position.set(0, 0, 0);
			mesh.receiveShadow = true;
			terrain = mesh;
		}else if(mesh.name === "npc"){
			// npcs?
		}else if(mesh.name === "obj"){
			// tools that can be equipped
			//mesh.position.set(0, 2, -5);
			tool = mesh;
			tool.visible = false;
		}else{
			console.log(mesh);
			thePlayer = mesh;

			// add a 3d object (cube) to serve as a marker for the 
			// location of the head of the mesh. we'll use this to 
			// create a vertical ray towards the ground
			// this ray can tell us the current height.
			// if the height is < the height of our character,
			// we know that we're on an uphill part of the terrain 
			// and can adjust our character accordingly
			// similarly, if the height is > the character height, we're going downhill
			let cubeGeometry = new THREE.BoxGeometry(0.2,0.2,0.2);
			let material = new THREE.MeshBasicMaterial({color: 0x00ff00});
			let head = new THREE.Mesh(cubeGeometry, material); 
			mesh.add(head);
			mesh.head = head;
			head.position.set(0, 4, 0);
			
			animationMixer = new THREE.AnimationMixer(mesh);
			animationController = new AnimationController(thePlayer, animationMixer, animationClips, clock);
			animationController.changeState("normal"); // set normal state by default for animations. see animation_state_map.json

			mesh.position.set(0, 2.8, -10);
			mesh.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
			mesh.originalColor = mesh.material;
			
			// alternate materials used for the sub depending on condition 
			let hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
			mesh.hitMaterial = hitMaterial;
			mesh.originalMaterial = mesh.material;
			
			// add hand bone to equip tool with as a child of the player mesh
			for(let bone of thePlayer.skeleton.bones){
				if(bone.name === "HandR001"){ // lol why is it like this??
					thePlayer.hand = bone; // set an arbitrary new property to access the hand bone
					break;
				}
			}

			animate();
		}
		
		mesh.castShadow = true;
		//mesh.receiveShadow = true;
		scene.add(mesh);
		renderer.render(scene, camera);
	})
});


// thanks to: https://docs.panda3d.org/1.10/python/programming/pandai/pathfinding/uneven-terrain
function checkTerrainHeight(objCenter, raycaster, scene){
	let intersects = raycaster.intersectObject(terrain);
	raycaster.set(objCenter, new THREE.Vector3(0, -1, 0));
	for(let i = 0; i < intersects.length; i++){
		let height = objCenter.distanceTo(intersects[i].point);
		//console.log(height);
		document.getElementById('height').textContent = ("current height: " + height);
		return height;
	}
	return 0;
}

function adjustVerticalHeightBasedOnTerrain(thePlayer, raycaster, scene){
	// for now I'm hardcoding the expected height at level terrain 
	let baseline = 2.75;
	let head = getCenter(thePlayer.head);
	let verticalDirection = checkTerrainHeight(head, raycaster, scene);
	
	if(verticalDirection < 2.74){
		// go uphill so increase y
		let deltaY = baseline - verticalDirection;
		thePlayer.position.y += deltaY;
	}else if(verticalDirection > 2.76){
		// go downhil so decrease y
		let deltaY = verticalDirection - baseline;
		thePlayer.position.y -= deltaY;
	}
}

function moveBasedOnAction(controller, thePlayer, speed, reverse){
	
	let action = controller.currAction;
	
	if(action === 'walk' || action === 'run'){
		if(action === 'run'){
			speed += 0.12;
		}
		if(reverse){
			thePlayer.translateZ(-speed);
		}else{
			thePlayer.translateZ(speed);
		}
	}
}

function keydown(evt){
	if(evt.keyCode === 16){
		// shift key
		// toggle between walk and run while moving
		if(animationController.currAction === 'walk'){
			animationController.changeAction('run');
			animationController.setUpdateTimeDivisor(.12);
		}
	}else if(evt.keyCode === 71){
		// g key
		// for toggling weapon/tool equip
		
		// attach the tool
		// try attaching tool to player's hand?
		// https://stackoverflow.com/questions/19031198/three-js-attaching-object-to-bone
		// https://stackoverflow.com/questions/54270675/three-js-parenting-mesh-to-bone
		let handBone = thePlayer.hand;
		if(handBone.children.length === 0){
			handBone.add(tool);
		}
		
		// adjust location of tool 
		tool.position.set(0, 0.8, 0);
		
		// the weapon-draw/hide animation should lead directly to the corresponding idle animation
		// since I have the event listener for a 'finished' action set up
		let timeScale = 1;
		
		if(animationController.currState === "normal"){
			tool.visible = true;
			animationController.changeState("equip"); // equip weapon
		}else{
			animationController.changeState("normal"); // go back to normal state
			timeScale = -1; // need to play equip animation backwards to put away weapon
			tool.visible = false; // this is too early - should be done after the "drawgun" anim is finished
		}
		animationController.setUpdateTimeDivisor(.20);
		animationController.changeAction("drawgun", timeScale);
	}
}

function keyup(evt){
	if(evt.keyCode === 16){
		if(animationController.currAction === 'run'){
			animationController.changeAction('walk');
			animationController.setUpdateTimeDivisor(.12);
		}
	}
}

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);


function update(){
	sec = clock.getDelta();
	moveDistance = 8 * sec;
	rotationAngle = (Math.PI / 2) * sec;
	let changeCameraView = false;
	

	
	if(keyboard.pressed("z")){
		changeCameraView = true;
	}
	
	if(keyboard.pressed("W")){
		// moving forwards
		if(animationController.currAction !== "run"){
			animationController.changeAction('walk');
		}
		animationController.setUpdateTimeDivisor(.10);
		moveBasedOnAction(animationController, thePlayer, moveDistance, false);
		
	}else if(keyboard.pressed("S")){
		// moving backwards
		if(animationController.currAction !== "run"){
			animationController.changeAction('walk', -1);
		}
		animationController.setUpdateTimeDivisor(.10);
		moveBasedOnAction(animationController, thePlayer, moveDistance, true);
		
	}else if(!keyboard.pressed("W") && !keyboard.pressed("S")){
		// for idle pose
		// can we make this less specific i.e. don't explicitly check for "drawgun"?
		if(animationController.currAction !== 'idle' && animationController.currAction !== "drawgun"){
			animationController.changeAction('idle');
			animationController.setUpdateTimeDivisor(.50);
		}
	}
	
	if(keyboard.pressed("J")){
		// for jumping
		// this one is not yet working and a bit tricky to think about for me - the animation 
		// is currently set to loop once and I'm not really sure yet how 
		// to set up the transition. maybe I need to keep a reference to 
		// the previous action before I trigger the jump?
		animationController.changeAction('jump');
		animationController.setUpdateTimeDivisor(.12);
		//moveBasedOnState(state, thePlayer, moveDistance, true);
	}
	
	if(keyboard.pressed("A")){
		let axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("D")){
		let axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	adjustVerticalHeightBasedOnTerrain(thePlayer, raycaster, scene);
	
	// keep the current animation running
	animationController.update();
	
	/*
	if(keyboard.pressed("Q")){
		// notice we're not rotating about the group mesh, but the child 
		// mesh of the group, which is actually the jet mesh!
		// if you try to move in all sorts of directions, after a while
		// the camera gets off center and axes seem to get messed up :/
		let axis = new THREE.Vector3(0, 0, 1);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	if(keyboard.pressed("E")){
		let axis = new THREE.Vector3(0, 0, 1);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}*/
	
	
	// how about first-person view?
	let relCameraOffset;
	if(!changeCameraView){
		relCameraOffset = new THREE.Vector3(0, 3, -15);
	}else{
		relCameraOffset = new THREE.Vector3(0, 3, 15);
	}
	
	let cameraOffset = relCameraOffset.applyMatrix4(thePlayer.matrixWorld);
	camera.position.x = cameraOffset.x;
	camera.position.y = cameraOffset.y;
	camera.position.z = cameraOffset.z;
	camera.lookAt(thePlayer.position);
	
	// hmm can we take the player's rotation (since it's the group's rotation) and just apply 
	// it to the camera? just make sure the camera is behind the player. (instead of using lookAt)

}

function animate(){
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	update();
}