// common utility functions for my three.js projects


// https://stackoverflow.com/questions/38305408/threejs-get-center-of-object
// note that the coordinates of the center will be with respect to the world coordinate system, not local!
function getCenter(mesh){
	let mid = new THREE.Vector3();
	let geometry = mesh.geometry;
	
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
	let forwardVec = new THREE.Vector3();
	mesh.getWorldDirection(forwardVec);	
	return forwardVec;
}

function checkCollision(mesh, raycaster, scene){
	let top = new THREE.Vector3(0, 1, 0);
	let bottom = new THREE.Vector3(0, -1, 0);
	let left = new THREE.Vector3(-1, 0, 0);
	let right = new THREE.Vector3(1, 0, 0);
	let front = new THREE.Vector3(0, 0, -1);
	let back = new THREE.Vector3(0, 0, 1);
	let dirToCheck = [
		top,
		bottom,
		left,
		right,
		front,
		back
	];
	let objCenter = getCenter(mesh);
	
	for(let i = 0; i < dirToCheck.length; i++){
		let dir = dirToCheck[i];
		raycaster.set(objCenter, dir);
		let intersects = raycaster.intersectObjects(scene.children);
		for(let j = 0; j < intersects.length; j++){
			if(objCenter.distanceTo(intersects[j].point) < 1.0){
				//console.log("object collided! direction: " + dir.x + ", " + dir.y + ", " + dir.z);
				return intersects[j].object; //true;
			}
		}
	}
	return false;
}

function drawVector(pt1, pt2, color){
	let points = [pt1, pt2];
	let material = new THREE.LineBasicMaterial({color: color});
	let geometry = new THREE.BufferGeometry().setFromPoints(points);
	let line = new THREE.Line(geometry, material);
	return line;
}

// as scene as arg
function drawForwardVector(mesh){
	
	let forwardVec = getForward(mesh);
	
	// create a vector
	let point1 = getCenter(mesh); //new THREE.Vector3(forwardVec.x, forwardVec.y, forwardVec.z);
	let point2 = new THREE.Vector3(forwardVec.x, forwardVec.y, forwardVec.z); 
	point2.multiplyScalar(2);
	
	let points = [point1, point2];
	
	let material = new THREE.LineBasicMaterial({color: 0x0000ff});
	let geometry = new THREE.BufferGeometry().setFromPoints(points);
	let line = new THREE.Line(geometry, material);
	scene.add(line);
}

// thanks to: https://docs.panda3d.org/1.10/python/programming/pandai/pathfinding/uneven-terrain
function checkTerrainHeight(objCenter, raycaster, terrainMesh, logElement=null){
	raycaster.set(objCenter, new THREE.Vector3(0, -1, 0)); // aim the raycast straight down
	let intersects = raycaster.intersectObject(terrainMesh);
	for(let i = 0; i < intersects.length; i++){
		let height = objCenter.distanceTo(intersects[i].point);
		if(logElement){
			logElement.textContent = ("current height: " + height);
		}
		return height;
	}
	return 0;
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
	let geometry = new THREE.SphereGeometry(4, 8, 6, 0, 6.3, 0, 3.1);
	let material = new THREE.MeshBasicMaterial({color: 0x3333ff});
	let sphere = new THREE.LineSegments(new THREE.WireframeGeometry(geometry)); // new THREE.Mesh(geometry, material)
	let x = position.x || 0;
	let y = position.y || 8;
	let z = position.z || -25;
	sphere.position.set(x, y, z);
	return sphere;
}