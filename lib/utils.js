// common utility functions for my three.js projects


// https://stackoverflow.com/questions/38305408/threejs-get-center-of-object
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
	
	loadingBarContainer.id = name + 'BarContainer'; //TODO: change name? like 'Progress' instead of 'BarCOntainer'?
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

// progress bar for goal objects
function createProgressBarContainer(name){
	let container = document.getElementById("container");
	let containerDimensions = container.getBoundingClientRect();
	let left = (containerDimensions.left + Math.round(.40 * containerDimensions.width)) + "px";
	let top = (containerDimensions.top + Math.round(.50 * containerDimensions.height)) + "px";
	
	let disarmProgressBarContainer = createProgressBar(name, "#ff0000", false);
	disarmProgressBarContainer.style.border = "1px solid #000";
	disarmProgressBarContainer.style.left = left;
	disarmProgressBarContainer.style.top = top;
	
	// only show when player is in range of capsule and pressing spacebar
	disarmProgressBarContainer.style.display = 'none';
	
	container.appendChild(disarmProgressBarContainer);
}

// create message when within range of goal objects
function setupGoalObjectMessage(canvas, id, text){
	let canvasPos = canvas.getBoundingClientRect();
	let messageText = text;
	let message = document.createElement('h3');
	
	message.id = id;
	message.style.fontFamily = 'monospace';
	message.style.position = 'absolute';
	message.style.color = '#fff';
	message.style.zIndex = 100;
	message.textContent = messageText;
	message.style.display = 'none';
	
	canvas.parentNode.appendChild(message);
	return message;
}

// show/hide a message (i.e. instructions when goalObjects are activatable)
function toggleMessage(canvas, msgElement, showMessage){
	let message = msgElement;
	if(!message){
		return;
	}
	
	if(!showMessage){
		message.style.display = 'none';
	}else{
		// make sure message shows up in right place
		let canvasPos = canvas.getBoundingClientRect();
		let x = canvasPos.left;
		let y = canvasPos.top;
		
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