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


let pointLight = new THREE.PointLight(0xffffff, 1, 0); //new THREE.pointLight( 0xffffff );
pointLight.position.set(0, 10, -35);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 100;
pointLight.shadow.camera.fov = 30;
scene.add(pointLight);

const clock = new THREE.Clock();
let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;

// need to keep some state 
const state = {};

let loadedModels = [];

function getModel(modelFilePath, side, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			function(gltf){
				gltf.scene.traverse((child) => {
					if(child.type === "Mesh"){
					
						let material = child.material;
						//console.log(material)
						let geometry = child.geometry;
						let obj = new THREE.Mesh(geometry, material);
						
						if(name === "bg"){
							// TODO: having trouble scaling the runway :/
							// for now use the ocean floor 
							obj.scale.x = child.scale.x * 10;
							obj.scale.y = child.scale.y * 10;
							obj.scale.z = child.scale.z * 10;
							//obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
						}else{
							// jet needs to be rotated 180 deg. -_-
							obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
						}
						
						obj.side = side; // player or enemy mesh?
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
loadedModels.push(getModel('models/airshow-bg-test.glb', 'none', 'bg'));
loadedModels.push(getModel('models/f-18hornet-edit.glb', 'player', 'p1'));

let thePlayer = null;
let theNpc = null;

let bgAxesHelper;
let playerAxesHelper;
let playerGroupAxesHelper;

Promise.all(loadedModels).then((objects) => {
	objects.forEach((mesh) => {
		if(mesh.name === "bg"){
			// runway
			//mesh.position.set(0, -10, -50);
			mesh.position.set(0, 0, 0);
			bgAxesHelper = new THREE.AxesHelper(10);
			mesh.add(bgAxesHelper);
		}else if(mesh.name === "npc"){
			// npcs?
		}else{
			// the local axis of the imported mesh is a bit weird and not consistent with the world axis. so, to fix that,
			// put it in a group object and just control the group object! the mesh is also just orientated properly initially when placed in the group.
			playerAxesHelper = new THREE.AxesHelper(10);
			mesh.add(playerAxesHelper);
			
			var group = new THREE.Group();
			group.add(mesh);
			playerGroupAxesHelper = new THREE.AxesHelper(8);
			group.add(playerGroupAxesHelper);
			
			thePlayer = group;
			mesh = group;
			mesh.position.set(0, 1, -50);
			mesh.originalColor = group.children[0].material; // this should only be temporary
			
			// alternate materials used for the sub depending on condition 
			var hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
			mesh.hitMaterial = hitMaterial;
			mesh.originalMaterial = mesh.children[0].material;

			animate();
		}
		
		mesh.castShadow = true;
		//mesh.receiveShadow = true;
		scene.add(mesh);
		renderer.render(scene, camera);
	})
});


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
	
	if(keyboard.pressed("up")){
		// rotate up (note that we're rotating on the mesh's axis. its axes might be configured weird)
		// the forward vector for the mesh might be backwards and perpendicular to the front of the sub
		// up arrow key
		// NEED TO CLAMP ANGLE
		var axis = new THREE.Vector3(1, 0, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
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
		relCameraOffset = new THREE.Vector3(0, 3, 15);
	}else{
		relCameraOffset = new THREE.Vector3(0, 3, -15);
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