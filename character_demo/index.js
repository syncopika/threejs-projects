

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
pointLight.position.set(0, 10, -35);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 100;
pointLight.shadow.camera.fov = 30;
scene.add(pointLight);


let hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 100, 0);
scene.add(hemiLight);

const clock = new THREE.Clock();
let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;

// need to keep some state 
const state = {
	"movement": "idle"
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
						//let obj = new THREE.Mesh(geometry, material);
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

let bgAxesHelper;
let playerAxesHelper;
let playerGroupAxesHelper;

Promise.all(loadedModels).then((objects) => {
	objects.forEach((mesh) => {
		if(mesh.name === "bg"){
			mesh.position.set(0, 0, 0);
		}else if(mesh.name === "npc"){
			// npcs?
		}else{
			console.log(mesh);
			thePlayer = mesh;
			
			state['movement'] = 'idle';
			animationMixer = new THREE.AnimationMixer(mesh);
			mesh.position.set(0, 5, -50);
			mesh.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
			mesh.originalColor = mesh.material; // this should only be temporary
			
			// alternate materials used for the sub depending on condition 
			var hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
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
	var movement = state['movement'];
	if(movement === "idle"){
		var idleAction = animationMixer.clipAction(animationClips[0]);
		idleAction.setLoop(THREE.LoopRepeat);
		idleAction.play();
	}else if(movement === 'walk'){
		// don't do this here
		var walkAction = animationMixer.clipAction(animationClips[1]);
		walkAction.setLoop(THREE.LoopRepeat);
		walkAction.play();		
	}else if(movement === 'run'){
		// don't do this here
	}
	animationMixer.update(time/2);
}


let lastTime = clock.getDelta();
function update(){
	sec = clock.getDelta();
	moveDistance = 20 * sec;
	rotationAngle = (Math.PI / 2) * sec;
	var changeCameraView = false;
	
	if(keyboard.pressed("shift")){
		changeCameraView = true;
	}
	
	if(keyboard.pressed("W")){
		// note that this gets called several times with one key press!
		// I think it's because update() in requestAnimationFrames gets called quite a few times per second
		state['movement'] = 'walk';
		thePlayer.translateZ(moveDistance);
	}else{
		state['movement'] = 'idle';
	}
	
	
	if(keyboard.pressed("S")){
		thePlayer.translateZ(-moveDistance);
	}
	
	if(keyboard.pressed("A")){
		var axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("D")){
		var axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
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
	}
	
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