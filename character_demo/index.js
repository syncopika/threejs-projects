
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

// need to keep some state 
const state = {
	"movement": "idle",
	"isMoving": false
};

let loadedModels = [];
let animationMixer = null;
let animationClips = null;

function getModel(modelFilePath, side, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			function(gltf){
				if(gltf.animations.length > 0){
					console.log(gltf.animations);
					animationClips = gltf.animations;
				}
				gltf.scene.traverse((child) => {
					if(child.type === "Mesh" || child.type === "SkinnedMesh"){
						
						if(child.type === "SkinnedMesh"){
							child.add(child.skeleton.bones[0]); 
						}
						
						let material = child.material;
						let geometry = child.geometry;
						obj = child;
						
						if(name === "bg"){
							obj.scale.x = child.scale.x * 10;
							obj.scale.y = child.scale.y * 10;
							obj.scale.z = child.scale.z * 10;
							//obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
						}else{
							//obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
						}
						
						obj.side = side; // player or enemy mesh?
						obj.name = name;
						resolve(obj);
					}else{
						//console.log(child.type);
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
loadedModels.push(getModel('models/lowpolyhuman.gltf', 'player', 'p1'));

let thePlayer = null;
let theNpc = null;
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
		}else{
			console.log(mesh);
			thePlayer = mesh;
			
			// add a 3d object to serve as a marker for the 
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
			
			state['movement'] = 'idle';
			animationMixer = new THREE.AnimationMixer(mesh);
			mesh.position.set(0, 4.8, -30);
			mesh.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
			mesh.originalColor = mesh.material;
			
			// alternate materials used for the sub depending on condition 
			let hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
			mesh.hitMaterial = hitMaterial;
			mesh.originalMaterial = mesh.material;

			animate();
		}
		
		mesh.castShadow = true;
		//mesh.receiveShadow = true;
		scene.add(mesh);
		renderer.render(scene, camera);
	})
});


function updateCurrentAction(state, animationMixer, time){
	
	if(!state['isMoving']){
		//animationMixer.stopAllAction();
		state['movement'] = 'idle';
		animationMixer.timeScale = 1;
		
		for(var i = 1; i < animationClips.length; i++){
			// stop all the non-idle motion clips
			animationMixer.clipAction(animationClips[i]).stop();
		}

		var idleAction = animationMixer.clipAction(animationClips[0]);
		idleAction.setLoop(THREE.LoopRepeat);
		idleAction.play();
		animationMixer.update(time/2.5);
	}else{
	
		var movement = state['movement'];
		
		if(movement === 'walk'){
			var walkAction = animationMixer.clipAction(animationClips[2]);
			walkAction.setLoop(THREE.LoopRepeat);
			walkAction.play();
			animationMixer.update(time/1.5);
		}else if(movement === 'run'){
			var runAction = animationMixer.clipAction(animationClips[1]);
			runAction.setLoop(THREE.LoopRepeat);
			runAction.play();
			animationMixer.update(time/1.1);
		}
	}
}

// thanks to: https://docs.panda3d.org/1.10/python/programming/pandai/pathfinding/uneven-terrain
function checkTerrainHeight(objCenter, raycaster, scene){
	var intersects = raycaster.intersectObject(terrain);
	raycaster.set(objCenter, new THREE.Vector3(0, -1, 0));
	for(var i = 0; i < intersects.length; i++){
		var height = objCenter.distanceTo(intersects[i].point);
		//console.log(height);
		document.getElementById('height').textContent = ("current height: " + height);
		return height;
	}
	return 0;
}

function adjustVerticalHeightBasedOnTerrain(thePlayer, raycaster, scene){
	// for now I'm hardcoding the expected height at level terrain 
	var baseline = 8.8;
	var head = getCenter(thePlayer.head);
	var verticalDirection = checkTerrainHeight(head, raycaster, scene);
	if(verticalDirection < 8.79){
		// go uphill so increase y
		var deltaY = baseline - verticalDirection;
		thePlayer.position.y += deltaY;
	}else if(verticalDirection > 8.81){
		// go downhil so decrease y
		var deltaY = verticalDirection - baseline;
		thePlayer.position.y -= deltaY;
	}
}

document.addEventListener("keydown", (evt) => {
	if(evt.keyCode === 20){
		// caps lock
		// toggle between walk and run
	}
});


var lastTime = clock.getDelta();
function update(){
	sec = clock.getDelta();
	moveDistance = 8 * sec;
	rotationAngle = (Math.PI / 2) * sec;
	var changeCameraView = false;
	
	if(keyboard.pressed("shift")){
		changeCameraView = true;
	}
	
	if(keyboard.pressed("W")){
		// note that this gets called several times with one key press!
		// I think it's because update() in requestAnimationFrames gets called quite a few times per second
		state['movement'] = 'walk';
		state['isMoving'] = true;
		animationMixer.timeScale = 1;
		thePlayer.translateZ(moveDistance);
		
		// adjust player's vertical position based on terrain height
		adjustVerticalHeightBasedOnTerrain(thePlayer, raycaster, scene);
	}
	
	if(keyboard.pressed("S")){
		state['movement'] = 'walk';
		state['isMoving'] = true;
		animationMixer.timeScale = -1;
		thePlayer.translateZ(-moveDistance);
		adjustVerticalHeightBasedOnTerrain(thePlayer, raycaster, scene);
	}
	
	if(!keyboard.pressed("W") && !keyboard.pressed("S")){
		state['isMoving'] = false;
	}
	
	if(keyboard.pressed("A")){
		var axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("D")){
		var axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	/*
	if(keyboard.pressed("Q")){
		// notice we're not rotating about the group mesh, but the child 
		// mesh of the group, which is actually the jet mesh!
		// if you try to move in all sorts of directions, after a while
		// the camera gets off center and axes seem to get messed up :/
		var axis = new THREE.Vector3(0, 0, 1);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	if(keyboard.pressed("E")){
		var axis = new THREE.Vector3(0, 0, 1);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}*/
	
	/* check for collision?
	// check top, left, right, bottom, front, back? 
	var hasCollision = checkCollision(thePlayer, raycaster);
	if(hasCollision){
		thePlayer.material = thePlayer.hitMaterial;
	}else{
		thePlayer.material = thePlayer.originalMaterial;
	}*/
	
	// update character motion
	updateCurrentAction(state, animationMixer, sec);
	
	// how about first-person view?
	var relCameraOffset;
	if(!changeCameraView){
		relCameraOffset = new THREE.Vector3(0, 3, -15);
	}else{
		relCameraOffset = new THREE.Vector3(0, 3, 15);
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