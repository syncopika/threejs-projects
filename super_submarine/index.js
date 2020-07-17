// super submarine!

// create the message that shows when the player is within range to disarm the dangerous capsule
function setupDisarmMessage(canvas){
	var canvasPos = canvas.getBoundingClientRect();
	var disarmMessageText = "hold space to disarm the dangerous capsule";
	var disarmMessage = document.createElement('h3');
	
	disarmMessage.id = "disarmMessage";
	disarmMessage.style.fontFamily = 'monospace';
	disarmMessage.style.position = 'absolute';
	disarmMessage.style.color = '#fff';
	disarmMessage.style.zIndex = 100;
	disarmMessage.textContent = disarmMessageText;
	disarmMessage.style.display = 'none';
	
	canvas.parentNode.appendChild(disarmMessage);
	return disarmMessage;
}

// show/hide the message the allows the player to disarm the dangerous capsule
function toggleDisarmMessage(canvas, showMessage){
	
	var message = document.getElementById("disarmMessage");
	if(!message){
		return;
	}
	
	if(!showMessage){
		message.style.display = 'none';
	}else{
		// make sure message shows up in right place
		var canvasPos = canvas.getBoundingClientRect();
		var x = canvasPos.left;
		var y = canvasPos.top;
		
		message.style.left = (x + Math.round(.40 * canvasPos.width)) + "px";
		message.style.top = (y + Math.round(.80 * canvasPos.height)) + "px";
		message.style.display = 'block';
	}
}

function createSphereWireframe(position, params){
	var geometry = new THREE.SphereGeometry(4, 8, 6, 0, 6.3, 0, 3.1);
	var material = new THREE.MeshBasicMaterial({color: 0x3333ff});
	var sphere = new THREE.LineSegments(new THREE.WireframeGeometry(geometry)); // new THREE.Mesh(geometry, material)
	var x = position.x || 0;
	var y = position.y || 8;
	var z = position.z || -25;
	sphere.position.set(x, y, z);
	return sphere;
}

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
			if(objCenter.distanceTo(intersects[j].point) < 2.0){
				//console.log("object collided! direction: " + dir.x + ", " + dir.y + ", " + dir.z);
				return true;
			}
		}
	}
	return false;
}

// check if spotlight hits the dangerous capsule
// source = position of source obj, dir = direction vector
function checkCapsuleHit(source, dir, raycaster){
	raycaster.set(source, dir);
	var intersects = raycaster.intersectObjects(scene.children);
	for(var i = 0; i < intersects.length; i++){
		var target = intersects[i];
		//console.log(target);
		//console.log(source.distanceTo(target.point));
		if(target.object.name === "goalObject"){
			var inRange = source.distanceTo(target.point) > 7.0 && source.distanceTo(target.point) < 12.0;
			if(inRange){
				//console.log("hit capsule!");
				return target.object;
			}
		}
	}
	return null;
}

function drawForwardVector(mesh){
	var forwardVec = new THREE.Vector3();
	forwardVec.applyQuaternion(mesh.quaternion);
	
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

function createSpotlight(){
	var spotlight = new THREE.SpotLight(0xffffff, 1.8, 50, 0.35, 1.0, 1.2);
	spotlight.castShadow = true;
	
	spotlight.shadow.mapSize.width = 20;
	spotlight.shadow.mapSize.height = 20;
	
	spotlight.shadow.camera.near = 10;
	spotlight.shadow.camera.far = 20;
	spotlight.shadow.camera.fov = 10;
	
	return spotlight;
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


// set up health bar 
function createHealthBar(){
	let container = document.getElementById("container");
	let containerDimensions = container.getBoundingClientRect();
	let left = (containerDimensions.left + Math.round(.05 * containerDimensions.width)) + "px";
	let top = (containerDimensions.top + Math.round(.05 * containerDimensions.height)) + "px";
	let healthBarContainer = createProgressBar("health", "#00ff00", true);
	healthBarContainer.style.border = "1px solid #000";
	healthBarContainer.style.left = left;
	healthBarContainer.style.top = top;
	container.appendChild(healthBarContainer);
}

// progress bar for disarming the dangerous capsule
function createDisarmProgressBar(){
	let container = document.getElementById("container");
	let containerDimensions = container.getBoundingClientRect();
	let left = (containerDimensions.left + Math.round(.40 * containerDimensions.width)) + "px";
	let top = (containerDimensions.top + Math.round(.50 * containerDimensions.height)) + "px";
	
	let disarmProgressBarContainer = createProgressBar("disarm", "#ff0000", false);
	disarmProgressBarContainer.style.border = "1px solid #000";
	disarmProgressBarContainer.style.left = left;
	disarmProgressBarContainer.style.top = top;
	
	// only show when player is in range of capsule and pressing spacebar
	disarmProgressBarContainer.style.display = 'none';
	
	container.appendChild(disarmProgressBarContainer);
}


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
	
	// add the player's health bar 
	createHealthBar();
	
	// set up the progress bar to be used for disarming the dangerous capsule 
	createDisarmProgressBar();
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

setupDisarmMessage(document.getElementsByTagName('canvas')[0]);

//https://threejs.org/docs/#examples/en/controls/OrbitControls
// or this?: https://github.com/mrdoob/three.js/blob/dev/examples/jsm/controls/TrackballControls.js
//const controls = new OrbitControls(defaultCamera, renderer.domElement);

const camera = defaultCamera;
camera.position.set(0,2,0);

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
						
						obj.scale.x = child.scale.x * 20;
						obj.scale.y = child.scale.y * 20;
						obj.scale.z = child.scale.z * 20;
						obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI / 2);
					
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

var newSphere = createSphereWireframe({}, {});
var newSphere2 = createSphereWireframe({x: 5, y: 6, z: -45}, {});
scene.add(newSphere);
scene.add(newSphere2);

// https://threejs.org/docs/#api/en/textures/Texture
// create a mesh, apply ocean shader on it 
loadedModels.push(getModel('models/submarine1.glb', 'player', 'p1'));
loadedModels.push(getModel('models/battleship2.glb', 'player2', 'p2'));
loadedModels.push(getModel('models/oceanfloor.glb', 'none', 'bg'));
loadedModels.push(getModel('models/whale-shark-final.glb', 'none', 'npc'));
loadedModels.push(getModel('models/dangerous-capsule-edit-final.glb', 'none', 'goalObject'));
let thePlayer = null;
let theNpc = null;
let capsuleToDisarm = null;

Promise.all(loadedModels).then((objects) => {
	objects.forEach((mesh) => {
		if(mesh.name === "p2"){
			// battleship
			mesh.position.set(-15, 25, -50);
			mesh.scale.x *= 3;
			mesh.scale.y *= 3;
			mesh.scale.z *= 3;
		}else if(mesh.name === "bg"){
			// ocean floor
			mesh.position.set(0, -20, 0);
		}else if(mesh.name === "npc"){
			// whale shark
			mesh.position.set(-80, 2, -120);
			mesh.scale.x /= 2;
			mesh.scale.y /= 2;
			mesh.scale.z /= 2;
			theNpc = mesh;
		}else if(mesh.name === "goalObject"){
			mesh.position.set(-100, -18.2, -100);
			mesh.rotation.y = Math.PI / 6;
			mesh.scale.x /= 2;
			mesh.scale.y /= 2;
			mesh.scale.z /= 2;

			capsuleToDisarm = mesh;
			capsuleToDisarm.disarmed = false;
		}else{
			// the local axis of the imported mesh is a bit weird and not consistent with the world axis. so, to fix that,
			// put it in a group object and just control the group object! the mesh is also just orientated properly initially when placed in the group.
			var group = new THREE.Group();
			group.add(mesh);
			thePlayer = group;
			mesh = group;
			mesh.position.set(0, 0, -10);
			mesh.originalColor = group.children[0].material; // this should only be temporary
			//console.log(group.children[0].material);
			
			// alternate materials used for the sub depending on condition 
			var hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
			mesh.hitMaterial = hitMaterial;
			mesh.originalMaterial = mesh.children[0].material;
			
			// give the submarine a spotlight
			// the spotlight should be facing downwards!
			var spotlight = createSpotlight(); //createSphereWireframe({}, {});
			thePlayer.spotlight = spotlight;
			thePlayer.spotlightVisible = false;
			spotlight.visible = false;
			scene.add(spotlight);
			
			// make a dummy 3d object for the spotlight to track.
			// this 3d object will always be slightly ahead and below of the submarine's nose
			// can't think of any other way to get the spotlight to point below and forward of the submarine atm
			// can I position the dummy object relative to the group and have its position stay consistent with 
			// any movement? for now I'm going to try to reposition the spotlight target based on the group's
			// forward vector.
			var spotlightTarget = new THREE.Object3D();
			group.add(spotlightTarget);
			
			scene.add(spotlightTarget);
			spotlight.target = spotlightTarget;
			
			keyboard.domElement.addEventListener("keydown", (evt) => {
				// this is supposed to turn on headlights for the sub?
				if(keyboard.eventMatches(evt, "X")){
					// we do this stuff here instead of update because on keyup, the state of key X in the keyboard object gets reset to false, 
					// which we don't want (since we're trying to set a state)

					if(!thePlayer.spotlightVisible){
						thePlayer.spotlightVisible = true;
						thePlayer.spotlight.visible = true;
					}else{
						// make sure spotlight is not visible
						thePlayer.spotlight.visible = false;
						thePlayer.spotlightVisible = false;
						
						// hide capsule disarm message if it was showing
						toggleDisarmMessage(document.getElementsByTagName('canvas')[0], false);
					}
				}
			});
			
			animate();
		}
		
		mesh.castShadow = true;
		//mesh.receiveShadow = true;
		scene.add(mesh);
		renderer.render(scene, camera);
	})
});

let t = 0;
let lastTime = clock.getDelta();
function update(){
	sec = clock.getDelta();
	moveDistance = 20 * sec;
	rotationAngle = (Math.PI / 2) * sec;
	var changeCameraView = false;
	//console.log(rotationAngle);
	//console.log(Math.cos(rotationAngle));
	t += 0.006;
	
	// move the whale shark in a circle
	// to get it to rotate in a realistic manner as well, I think I have to 
	// do something a bit more complicated? I forgot what I did in my graphics course :(
	if(theNpc){
		var x = theNpc.position.x;
		var z = theNpc.position.z;
		var newX = x + (8*Math.cos(t))/10;
		var newZ = z + (8*Math.sin(t))/10;
		theNpc.position.set(newX, theNpc.position.y, newZ);
	}
	
	
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
		// rotate the sub and the camera appropriately
		var axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("D")){
		var axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	if(keyboard.pressed("Q")){
		var axis = new THREE.Vector3(0, 0, 1);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("E")){
		var axis = new THREE.Vector3(0, 0, 1);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
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
	
	// make sure sub spotlight stays with the sub
	if(thePlayer.spotlightVisible){
		// reposition spotlight target so that it's slightly below 
		// and forward relative to the front of the sub
		var subForward = getForward(thePlayer); 
		var spotlight = thePlayer.spotlight;
		
		var x = thePlayer.position.x - (subForward.x * 2);
		var y = thePlayer.position.y - 3;
		var z = thePlayer.position.z - (subForward.z * 2);
		
		spotlight.target.position.set(x, y, z);
		
		var pos = getCenter(thePlayer.children[0]);
		spotlight.position.x = pos.x;
		spotlight.position.y = pos.y;
		spotlight.position.z = pos.z;
		
		// see if the spotlight hits the dangerous capsule
		var source = spotlight.position;
		var target = spotlight.target.position;
		var dir = (new THREE.Vector3(target.x - source.x, target.y - source.y, target.z - source.z)).normalize();
		var capsuleHit = checkCapsuleHit(source, dir, raycaster);

		if(capsuleHit && !capsuleHit.disarmed){
			toggleDisarmMessage(document.getElementsByTagName('canvas')[0], true);
			
			var disarmProgress = document.getElementById("disarmBarContainer");
			var progressBar = disarmProgress.children[0];
			var congratsMsg;
			
			if(keyboard.pressed("space")){
				disarmProgress.style.display = "block";
				var currWidth = parseInt(progressBar.style.width);
				var fullWidth = parseInt(disarmProgress.style.width);

				if(lastTime === 0){
					lastTime = clock.getElapsedTime();
				}
				
				var currTime = clock.getElapsedTime();
				if(currWidth < fullWidth && (currTime - lastTime) > 0.5){
					var newWidth = Math.min(currWidth + 50, fullWidth);
					progressBar.style.width = newWidth + "px";
					lastTime = currTime;
				}else if(currWidth >= fullWidth){
					// disarm successful!
					disarmProgress.style.display = "none";
					capsuleHit.disarmed = true;
					toggleDisarmMessage(document.getElementsByTagName('canvas')[0], false);
					
					congratsMsg = document.createElement("h3");
					congratsMsg.style.position = "absolute";
					congratsMsg.style.top = disarmProgress.style.top;
					congratsMsg.style.left = disarmProgress.style.left;
					congratsMsg.style.fontFamily = "monospace";
					congratsMsg.style.color = "#fff";
					congratsMsg.textContent = "nice! you disarmed the dangerous capsule!";	
					congratsMsg.style.display = "block";
					disarmProgress.parentNode.appendChild(congratsMsg);
					
					setTimeout(function(){
						congratsMsg.style.display = "none";
					}, 2000); // show congrats msg for only 2 sec
				}
			}else{
				disarmProgress.style.display = "none";
				progressBar.style.width = "0px"; // reset to 0 width
				lastTime = 0;
			}
			
		}else{
			toggleDisarmMessage(document.getElementsByTagName('canvas')[0], false);
		}
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
		relCameraOffset = new THREE.Vector3(0, 3, 12);
	}else{
		relCameraOffset = new THREE.Vector3(0, 3, -12);
	}
	
	var cameraOffset = relCameraOffset.applyMatrix4(thePlayer.matrixWorld);
	camera.position.x = cameraOffset.x;
	camera.position.y = cameraOffset.y;
	camera.position.z = cameraOffset.z;
	camera.lookAt(thePlayer.position);

}

function animate(){
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	update();
}