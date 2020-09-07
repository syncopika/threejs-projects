// airshow!
// relies on some functions defined in utils.js in ../lib
// also Ronen Ness' partykals.js in ../lib

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

let hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
hemiLight.position.set( 0, 300, 0 );
scene.add( hemiLight );

let dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( 75, 300, -75 );
scene.add( dirLight );

const clock = new THREE.Clock();
let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;

// need to keep some state 
const state = {
	'mode': 'static', // other options include: static, takeoff, flying, landing. taxi is for moving on the ground
	'speed': 0.0,
	'altitude': 0.0,
	'isMoving': false, // when 'w' key is pressed, this is true.
	'originalPosition': {
		'position': null,
		'rotation': null,
		'aircraftPosition': null,
		'aircraftRotation': null
	}
};

function resetPosition(state, player){
	player.position.copy(state['originalPosition']['position']);
	player.rotation.copy(state['originalPosition']['rotation']);
	player.children[0].position.copy(state['originalPosition']['aircraftPosition']);
	player.children[0].rotation.copy(state['originalPosition']['aircraftRotation']);
}

function resetState(state){
	state['mode'] = 'static';
	state['speed'] = 0.0;
	state['altitude'] = 0.0;
	state['isMoving'] = false;
}

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
							obj.scale.x = 0.98;
							obj.scale.y = 0.98;
							obj.scale.z = 0.98;
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
		
		// save current position and rotation of the group and the aircraft mesh itself
		let originalPositionGroup = new THREE.Vector3();
		let originalPositionAircraft = new THREE.Vector3();
		let originalRotationGroup = new THREE.Euler();
		let originalRotationAircraft = new THREE.Euler();
		
		originalPositionGroup.copy(thePlayer.position);
		originalRotationGroup.copy(thePlayer.rotation);
		originalPositionAircraft.copy(thePlayer.children[0].position);
		originalRotationAircraft.copy(thePlayer.children[0].rotation);
		
		console.log(originalRotationAircraft);
		console.log(originalRotationGroup);
		
		state['originalPosition']['position'] = originalPositionGroup;
		state['originalPosition']['rotation'] = originalRotationGroup;
		state['originalPosition']['aircraftPosition'] = originalPositionAircraft;
		state['originalPosition']['aircraftRotation'] = originalRotationAircraft;
		
		// alternate materials used for the sub depending on condition 
		var hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
		mesh.hitMaterial = hitMaterial;
		mesh.originalMaterial = mesh.children[0].material;

		engineFlameParticles(thePlayer); // set up particles for engine
		animate();
	}

	//mesh.castShadow = true;
	mesh.receiveShadow = true;
	scene.add(mesh);
	renderer.render(scene, camera);
}


document.addEventListener("keydown", (evt) => {
	if(evt.keyCode === 20){
		// caps lock
		console.log("mode changed!");
		if(state['mode'] === 'taxi'){
			state['mode'] = 'takeoff';
			state['phase'] = 1;
			//console.log("mode changed to takeoff!");
		}else if(state['mode'] === 'flying'){
			// something for landing?
			console.log("mode changed to landing!");
			state['mode'] = 'landing';
			
			// reset rotation
			// this is broken: so far it only works if you're landing in the same direction that the plane
			// initially points to  when the scene loads. feel like it should be an easy fix but need to think some more
			// we want the plane to be aligned with the runway
			//maybe we also need to know the forward vector of the plane?

			//thePlayer.children[0].rotation.copy(state['originalPosition']['aircraftRotation']);
			thePlayer.children[0].rotation.x = state['originalPosition']['aircraftRotation'].x;
			thePlayer.children[0].rotation.Z = state['originalPosition']['aircraftRotation'].z;
			
			//thePlayer.rotation.copy(state['originalPosition']['rotation']);
			thePlayer.rotation.x = state['originalPosition']['rotation'].x;
			thePlayer.rotation.z = state['originalPosition']['rotation'].z;
			
		}else if(state['mode'] === 'landing'){
			// go back to takeoff -> flying
			state['mode'] = 'takeoff';
		}
	}
});

document.addEventListener("keyup", (evt) => {
	if(evt.keyCode === 87){
		// 'w' key
		if(state['mode'] !== 'landing'){
			state['isMoving'] = false;
			if(state['mode'] === 'flying'){
				state['start'] = Date.now();
				state['mode'] = 'falling';
			}
		}
	}
});

let particleSystems = [];
function engineFlameParticles(obj){
	// sample some number of points in a circle 
	// we want their paths to converge at some point to form a cone shape
	// actually let's skip the cone thing. let's just make a straight path but gradually decrease
	// the size of the particles (and make them more transparent)
	/*
	let theta = 60; // 60 deg. slices
	let radius = 8;
	let convergePoint = {
		'x': 0,
		'y': 0,
		'z': 10
	};
	let particlePaths = [];
	for(let deg = 0; deg < 360; deg += theta){
		// 7 points total?
		let x = radius * Math.cos((Math.PI * deg) / 180);
		let y = radius * Math.sin((Math.PI * deg) / 180);
		particlePaths.push({
			'start': {
				'x': x, 
				'y': y,
				'z': 0.0
			},
			'end': convergePoint
			'particles': []
		});
	}
	*/
	
	// using partykals.js: https://github.com/RonenNess/partykals
	// create a set of particles for each engine
	for(let i = 0; i < 2; i++){
		let pSystem = new Partykals.ParticlesSystem({
			container: obj,
			particles: {
				startAlpha: 1,
				endAlpha: 0,
				startSize: 3.5,
				endSize: 15,
				ttl: 5,
				velocity: new Partykals.Randomizers.SphereRandomizer(5),
				velocityBonus: new THREE.Vector3(0, 0, 25),
				colorize: true,
				startColor: new Partykals.Randomizers.ColorsRandomizer(new THREE.Color(0.5, 0.2, 0), new THREE.Color(1, 0.5, 0)),
				endColor: new THREE.Color(0, 0, 0),
				blending: "additive",
				worldPosition: true,
			},
			system: {
				particlesCount: 200,
				scale: 400,
				emitters: new Partykals.Emitter({
					onInterval: new Partykals.Randomizers.MinMaxRandomizer(0, 5),
					interval: new Partykals.Randomizers.MinMaxRandomizer(0, 0.25),
				}),
				depthWrite: false,
				speed: 1.5,
				onUpdate: (system) => {
					system.startX = system.startX || system.particleSystem.position.x;
					system.particleSystem.position.x = system.startX + Math.sin(system.age * 2) * 5;
					system.particleSystem.position.z = -Math.sin(system.age * 2) * 5;
				},
			}
		});
		particleSystems.push(pSystem);
	}
	
	// launch them?
}

// for incrementing the speed when accelerating on takeoff
function getSpeed(timeDelta){
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
		state['isMoving'] = true;
		
		// engine particles 
		if(state['mode'] !== 'taxi'){
			particleSystems.forEach((pSystem) => {
				pSystem.update();
			});
		}else{
			// clear the particles!
		}
		
		if(state['mode'] === 'static'){
			state['mode'] = 'taxi';
			//console.log("starting to taxi...");
		}
	
		if(state['mode'] === 'takeoff' && state['phase']){
			state['phase'] = 0;
			state['start'] = Date.now();
			//console.log("starting takeoff...");
		}
		
		if(state['mode'] === 'takeoff' || state['mode'] === 'falling'){
			// if takeoff, accelerate to a certain point. also allow user to accelerate/regain movement again if falling.
			let now = Date.now();
			let deltaTime = now - state['start'];
			
			if(state['mode'] === 'falling'){
				// hmm it would make sense for the aircraft to continue falling I think until a certain speed is reached, maybe?
				// if we switch modes here, the plane kinda hangs for a little bit since it's not 'falling' anymore
				state['mode'] === 'takeoff';
			}
			
			if(moveDistance < 1.8){
				let currSpeed = getSpeed(deltaTime/1000);
				moveDistance = 15 * currSpeed * sec;
			}else{
				// check altitude
				if(state['altitude'] > 5.0){
					//console.log("ok i'm flying");
					state['mode'] = 'flying';
				}
			}
		}else if(state['mode'] === 'taxi'){
			moveDistance = 15 * sec;
			//console.log("taxiing...");
		}
		
		if(state['mode'] === 'landing'){
			console.log("landing!");
			if(state['altitude'] > 0.0){
				thePlayer.translateY(-0.3);
				moveDistance = 1.2;
			}else{
				console.log("touchdown");
				thePlayer.position.y = 0.0;
				resetState(state);
			}
		}
		
		state['speed'] = moveDistance;
		
		thePlayer.translateZ(-moveDistance);
		
	}else if(state['mode'] === 'falling'){
		
		// handle deceleration
		if(moveDistance > 0.10){
			let deltaTime = Date.now() - state['start'];
			let currSpeed = getSpeed(-deltaTime/1000);
			moveDistance = 30 * currSpeed * sec;
			//console.log("decelerating...");
			
			if(moveDistance < 0.0){
				moveDistance = 0.0;
			}
			
			thePlayer.translateZ(-moveDistance*3);
		}else{
			moveDistance = 0.0;
		}
		
		if(state['altitude'] > -1.0){
			let deltaTime = Date.now() - state['start'];
			let currSpeed = getSpeed(deltaTime/1000);
			let fallSpeed = 30 * currSpeed * sec;
			thePlayer.translateY(-fallSpeed*3); // -0.9
		}
		
		state['speed'] = moveDistance;
		
		// start over at original position
		if(state['altitude'] <= 0.0){
			// since thePlayer is actually a group, we need to reset the position + rotation of the group 
			// and the actual aircraft mesh, which is a child of the group.
			resetPosition(state, thePlayer);
			
			// reset state params like altitude, speed, mode
			resetState(state);
		}
	}else if(state['mode'] === 'landing'){
		console.log("landing!");
		if(state['altitude'] > 0.0){
			// gradually get closer to the ground. plane should be aligned with ground ideally
			thePlayer.translateY(-0.3);
			thePlayer.translateZ(-1.2);
		}else{
			thePlayer.position.y = 0.0;
			resetState(state);
		}
	}
	
	if(keyboard.pressed("S") && state['mode'] === 'taxi'){
		thePlayer.translateZ(moveDistance);
	}
	
	if(keyboard.pressed("A") && state['mode'] !== 'landing'){
		var axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("D") && state['mode'] !== 'landing'){
		var axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	if(keyboard.pressed("Q") && thePlayer.position.y > 6.0 && state['mode'] !== 'landing'){
		// notice we're not rotating about the group mesh, but the child 
		// mesh of the group, which is actually the jet mesh!
		// if you try to move in all sorts of directions, after a while
		// the camera gets off center and axes seem to get messed up :/
		var axis = new THREE.Vector3(0, 0, 1);
		thePlayer.children[0].rotateOnAxis(axis, -rotationAngle);
	}
	
	if(keyboard.pressed("E") && thePlayer.position.y > 6.0 && state['mode'] !== 'landing'){
		var axis = new THREE.Vector3(0, 0, 1);
		thePlayer.children[0].rotateOnAxis(axis, rotationAngle);
	}
	
	// check altitude
	if(keyboard.pressed("up") && moveDistance >= 1.8 && state['mode'] !== 'landing'){
		// rotate up (note that we're rotating on the mesh's axis. its axes might be configured weird)
		// the forward vector for the mesh might be backwards and perpendicular to the front of the sub
		// up arrow key
		var axis = new THREE.Vector3(1, 0, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	// check altitude
	if(keyboard.pressed("down") && moveDistance >= 1.8 && state['mode'] !== 'landing'){
		// down arrow key
		// CLAMP ANGLE?
		var axis = new THREE.Vector3(1, 0, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	// check for collision?
	// check top, left, right, bottom, front, back? 
	var hasCollision = checkCollision(thePlayer.children[0], raycaster);
	if(hasCollision){
		thePlayer.children[0].material = thePlayer.hitMaterial;
		
		// crash - reset everything 
		resetPosition(state, thePlayer);
		resetState(state);
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