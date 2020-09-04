// airshow!


//https://stackoverflow.com/questions/38305408/threejs-get-center-of-object
function getCenter(mesh){
	var mid = new THREE.Vector3();
	var geometry = mesh.geometry;
	
	geometry.computeBoundingBox();
	mid.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x)/2;
	mid.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y)/2;
	mid.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z)/2;
	
	mesh.localToWorld(mid);
	return mid;
}

// https://stackoverflow.com/questions/14813902/three-js-get-the-direction-in-which-the-camera-is-looking
// https://stackoverflow.com/questions/25224153/how-can-i-get-the-normalized-vector-of-the-direction-an-object3d-is-facing
function getForward(mesh){
	var forwardVec = new THREE.Vector3();
	mesh.getWorldDirection(forwardVec);	
	return forwardVec;
}

function checkCollision(mesh, raycaster){
	var top = new THREE.Vector3(0, 1, 0);
	var bottom = new THREE.Vector3(0, -1, 0);
	var left = new THREE.Vector3(-1, 0, 0);
	var right = new THREE.Vector3(1, 0, 0);
	var front = new THREE.Vector3(0, 0, -1);
	var back = new THREE.Vector3(0, 0, 1);
	var dirToCheck = [
		top,
		bottom,
		left,
		right,
		front,
		back
	];
	var objCenter = getCenter(mesh);
	
	for(var i = 0; i < dirToCheck.length; i++){
		var dir = dirToCheck[i];
		raycaster.set(objCenter, dir);
		var intersects = raycaster.intersectObjects(scene.children);
		for(var j = 0; j < intersects.length; j++){
			if(objCenter.distanceTo(intersects[j].point) < 1.0){
				//console.log("object collided! direction: " + dir.x + ", " + dir.y + ", " + dir.z);
				return true;
			}
		}
	}
	return false;
}


function drawForwardVector(mesh){
	
	var forwardVec = getForward(mesh);
	
	// create a vector
	var point1 = getCenter(mesh); //new THREE.Vector3(forwardVec.x, forwardVec.y, forwardVec.z);
	var point2 = new THREE.Vector3(forwardVec.x, forwardVec.y, forwardVec.z); 
	point2.multiplyScalar(2);
	
	var points = [point1, point2];
	
	var material = new THREE.LineBasicMaterial({color: 0x0000ff});
	var geometry = new THREE.BufferGeometry().setFromPoints(points);
	var line = new THREE.Line(geometry, material);
	scene.add(line);
}

// create a general progress bar
function createProgressBar(name, barColor, filled=false){
	let loadingBarContainer = document.createElement("div");
	let loadingBar = document.createElement("div");
	
	loadingBarContainer.id = name + 'BarContainer';
	loadingBarContainer.style.width = '200px';
	loadingBarContainer.style.backgroundColor = '#fff';
	loadingBarContainer.style.height = '20px';
	loadingBarContainer.style.textAlign = 'center';
	loadingBarContainer.style.position = 'absolute';
	loadingBarContainer.style.zIndex = 100;
	
	loadingBar.id = name + "Bar";
	
	if(filled){
		loadingBar.style.width = '200px';
	}else{
		loadingBar.style.width = '0px';
	}
	
	loadingBar.style.height = '20px';
	loadingBar.style.zIndex = 100;
	loadingBar.style.backgroundColor = barColor; //"#00ff00";
	
	loadingBarContainer.appendChild(loadingBar);
	return loadingBarContainer;
}

function changeMode(){
	// if plane is in taxi, can change to takeoff only
	// if plane is flying and at a certain speed, can only change to landing
	
	// in taxi mode, speed is constant
	// in takeoff mode, speed grows logarithmically?
	// takeoff transitions to flying when a certain altitude and speed are reached
		// pitch up allowed at a certain speed
		
	// being able to land should correspond with how leveled the plane is (vectors should help!)
		// landing = limited movement?
}



// https://github.com/evanw/webgl-water
// https://github.com/donmccurdy/three-gltf-viewer/blob/master/src/viewer.js
const el = document.getElementById("container");
const fov = 60;
const defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const container = document.querySelector('#container');
const raycaster = new THREE.Raycaster();
const loadingManager = new THREE.LoadingManager();




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
//camera.position.set(0,15,30);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);	
scene.add(camera);


var hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
hemiLight.position.set( 0, 300, 0 );
scene.add( hemiLight );

var dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( 75, 300, -75 );
scene.add( dirLight );

const clock = new THREE.Clock();
let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;

// need to keep some state 
const state = {
	'mode': 'taxi', // other options include: takeoff, flying, landing. taxi is for moving on the ground
	'speed': 0.0,
	'altitude': 0.0,
	'phase': null // for determining if a mode has started? like for takeoff, we kinda need to know when to start the function to gradually increase speed.
};

let loadedModels = [];

function getModel(modelFilePath, side, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			function(gltf){
				gltf.scene.traverse((child) => {
					if(child.type === "Mesh"){
					
						let material = child.material;
						let geometry = child.geometry;
						let obj = new THREE.Mesh(geometry, material);
						
						if(name === "bg"){
						}
						
						if(name === "player"){
							// jet needs to be rotated 180 deg. -_-
							obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
						}
						
						obj.name = name;
						//resolve(obj);
						
						processMesh(obj);
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
//loadedModels.push(getModel('models/airshow-bg-test.glb', 'none', 'bg'));
loadedModels.push(getModel('models/f-18hornet-edit.glb', 'player', 'player'));
loadedModels.push(getModel('models/airbase.gltf', 'airbase', 'bg'));

let thePlayer = null;
let theNpc = null;

let bgAxesHelper;
let playerAxesHelper;
let playerGroupAxesHelper;

function processMesh(mesh){
	
	if(mesh.name === "player"){
		
		// the local axis of the imported mesh is a bit weird and not consistent with the world axis. so, to fix that,
		// put it in a group object and just control the group object! the mesh is also just oriented properly initially when placed in the group.
		playerAxesHelper = new THREE.AxesHelper(10);
		mesh.add(playerAxesHelper);
		
		var group = new THREE.Group();
		group.add(mesh);
		playerGroupAxesHelper = new THREE.AxesHelper(8);
		group.add(playerGroupAxesHelper);
		
		thePlayer = group;
		mesh = group;
		mesh.position.set(-15, 1, -40);
		mesh.originalColor = group.children[0].material; // this should only be temporary
		
		// alternate materials used for the sub depending on condition 
		var hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
		mesh.hitMaterial = hitMaterial;
		mesh.originalMaterial = mesh.children[0].material;

		animate();
	}

	//mesh.castShadow = true;
	//mesh.receiveShadow = true;
	scene.add(mesh);
	renderer.render(scene, camera);
}


document.addEventListener("keydown", (evt) => {
	if(evt.keyCode === 20){
		// capslock
		console.log("mode changed!");
		if(state['mode'] === 'taxi'){
			state['mode'] = 'takeoff';
			state['phase'] = 1;
		}else if(state['mode'] === 'flying'){
			// 
		}
	}
});


let lastTime = clock.getDelta();

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log
function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}


function getSpeed(timeDelta){
	//return getBaseLog(2, timeDelta);
	return Math.exp(timeDelta);
}

function update(){
	sec = clock.getDelta();
	rotationAngle = (Math.PI / 2) * sec;
	var changeCameraView = false;
	
	// update altitude 
	state['altitude'] = thePlayer.position.y;
	
	if(keyboard.pressed("shift")){
		changeCameraView = true;
	}
	
	if(keyboard.pressed("W")){
		// note that this gets called several times with one key press!
		// I think it's because update() in requestAnimationFrames gets called quite a few times per second
		
		// have distance amount increase/decrease along a logarithmic function? based on how long
		// the W key is held down
		// when W is released, speed should decrease by the same function too?
		// http://www.aerodynamics4students.com/aircraft-performance/take-off-and-landing.php
		// https://aviation.stackexchange.com/questions/9961/does-acceleration-increase-linearly-on-a-takeoff-roll
		if(state['mode'] === 'takeoff' && state['phase']){
			state['phase'] = 0;
			state['start'] = Date.now();
		}/*else if(state['mode'] === 'flying' && ) -> need a state for stopped moving? when W is released? */ 
		
		if(state['mode'] === 'takeoff'){
			let now = Date.now();
			let deltaTime = now - state['start'];
			
			if(moveDistance < 1.8){
				let currSpeed = getSpeed(deltaTime/1000);
				moveDistance = 15 * currSpeed * sec;
			}else{
				//console.log(thePlayer.position.y);
				// check altitude
				if(state['altitude'] > 5.0){
					console.log("ok i'm flying");
					state['mode'] = 'flying';
				}
			}
			
		}else if(state['mode'] === 'taxi'){
			moveDistance = 15 * sec;
		}
		
		// if W stops being pressed, the plane should decelerate (make moveDistance decrease exponentially to 0?) and lose altitude
		thePlayer.translateZ(-moveDistance);
	}
	
	if(keyboard.pressed("S")){
		thePlayer.translateZ(moveDistance);
	}
	
	if(keyboard.pressed("A")){
		var axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("D")){
		var axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	if(keyboard.pressed("Q") && thePlayer.position.y > 6.0){
		// notice we're not rotating about the group mesh, but the child 
		// mesh of the group, which is actually the jet mesh!
		// if you try to move in all sorts of directions, after a while
		// the camera gets off center and axes seem to get messed up :/
		var axis = new THREE.Vector3(0, 0, 1);
		thePlayer.children[0].rotateOnAxis(axis, -rotationAngle);
	}
	
	if(keyboard.pressed("E") && thePlayer.position.y > 6.0){
		var axis = new THREE.Vector3(0, 0, 1);
		thePlayer.children[0].rotateOnAxis(axis, rotationAngle);
	}
	
	// check altitude
	if(keyboard.pressed("up") && moveDistance >= 1.8){
		// rotate up (note that we're rotating on the mesh's axis. its axes might be configured weird)
		// the forward vector for the mesh might be backwards and perpendicular to the front of the sub
		// up arrow key
		// NEED TO CLAMP ANGLE
		var axis = new THREE.Vector3(1, 0, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	// check altitude
	if(keyboard.pressed("down")){
		// down arrow key
		// CLAMP ANGLE!
		var axis = new THREE.Vector3(1, 0, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	// check for collision?
	// check top, left, right, bottom, front, back? 
	var hasCollision = checkCollision(thePlayer.children[0], raycaster);
	if(hasCollision){
		thePlayer.children[0].material = thePlayer.hitMaterial;
	}else{
		thePlayer.children[0].material = thePlayer.originalMaterial;
	}
	
	// how about first-person view?
	var relCameraOffset;
	if(!changeCameraView){
		relCameraOffset = new THREE.Vector3(0, 8, 25);
	}else{
		relCameraOffset = new THREE.Vector3(0, 8, -25);
	}
	
	var cameraOffset = relCameraOffset.applyMatrix4(thePlayer.matrixWorld);
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