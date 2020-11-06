
const el = document.getElementById("container");
const fov = 60;
const defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const container = document.querySelector('#container');
const raycaster = new THREE.Raycaster();
const loadingManager = new THREE.LoadingManager();

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

const camera = defaultCamera;
camera.position.set(0,5,20);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);	
scene.add(camera);


let pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 60, -25);
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

function getModel(modelFilePath, name){
	
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			function(gltf){	
			
				if(name === "car"){
			
					let car = new THREE.Group();
					
					// the car and its wheels are separate meshes.
					// make a group and add all of them to it
					gltf.scene.traverse((child) => {
						if(child.type === "Mesh"){
							let geometry = child.geometry;
							let material = child.material;
							let obj = new THREE.Mesh(geometry, material);
							
							obj.scale.x = child.scale.x * 1.3;
							obj.scale.y = child.scale.y * 1.3;
							obj.scale.z = child.scale.z * 1.3;
							
							obj.name = child.name;
							
							car.add(obj);
						}
					});

					console.log(car);
					resolve(car);

				}else if(name === "racetrack"){
					// handle racetrack
					gltf.scene.traverse((child) => {
						if(child.type === "Mesh"){
							child.material.shininess = 0; // doesn't seem to work? maybe a lighting issue?
							child.name = name;
							
							console.log(child.material); //check doubleface
							resolve(child);
						}
					});
				}
				
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

function addPlane(scene){
	let planeGeometry = new THREE.PlaneGeometry(400, 400);
	let texture = new THREE.TextureLoader().load('models/grass2.jpg');
	let material = new THREE.MeshBasicMaterial({map: texture}); 
	let plane = new THREE.Mesh(planeGeometry, material); 
	plane.position.set(-100, -1.5, 0);
	plane.rotateX((3*Math.PI)/2);
	plane.name = "grass";
	scene.add(plane);
}

// load in models
loadedModels.push(getModel('models/porsche.gltf', 'car'));
loadedModels.push(getModel('models/racetrack.gltf', 'racetrack'));

let thePlayer = null;
let terrain = null;
const wheelAxesHelper = new THREE.AxesHelper(2);
const carAxesHelper = new THREE.AxesHelper(4);

let firstPersonViewOn = false;
let sideViewOn = false;
let bottomViewOn = false;
let topViewOn = false;
let debugMode = false;

Promise.all(loadedModels).then((objects) => {
	objects.forEach((mesh) => {
		if(mesh.name === "racetrack"){
			mesh.position.set(6, -1.2, -7);
			mesh.receiveShadow = true;
			terrain = mesh;
			scene.add(mesh);
		}else{
			thePlayer = mesh;

			// add a plane for grass
			addPlane(scene);
			
			// remember that the car is a THREE.Group!
			thePlayer.position.set(3, -0.3, -10);
			
			thePlayer.frontWheels = [];
			thePlayer.rearWheels = [];
			thePlayer.wheels = [];
			
			// set the wheels right 
			thePlayer.children.forEach((child) => {
				
				if(child.name.indexOf("Cube") === 0){
					thePlayer.wheels.push(child);
				}
				
				if(child.name === "Cube001"){
					// front
					child.position.set(2, 0, -1.8);
					thePlayer.frontWheels.push(child);
					child.add(wheelAxesHelper); // good for debugging rotations!
				}else if(child.name === "Cube002"){
					// front
					child.rotateY(Math.PI);
					child.position.set(2, 0, 1.8);
					thePlayer.frontWheels.push(child);
				}else if(child.name === "Cube003"){
					// rear
					child.rotateY(Math.PI);
					child.position.set(-2.9, 0, 1.7);
					thePlayer.rearWheels.push(child);
				}else if(child.name === "Cube004"){
					// rear
					child.position.set(-2.9, 0, -1.7);
					thePlayer.rearWheels.push(child);
				}else{
					// car body
					thePlayer.body = child;
					thePlayer.add(carAxesHelper);
				}
			});
			
			// also add an Object3D to serve as a marker for checking terrain height
			let cubeGeometry = new THREE.BoxGeometry(0.2,0.2,0.2);
			let material = new THREE.MeshBasicMaterial({color: 0x00ff00});
			let marker = new THREE.Mesh(cubeGeometry, material);
			marker.visible = false;
			
			thePlayer.body.add(marker);
			marker.position.set(0, 2, 0);
			thePlayer.heightMarker = marker;
			
			// for lateral modifications if the road is elevated on one side
			// we want the car to be parallel with the road
			let material2 = new THREE.MeshBasicMaterial({color: 0xff0000});
			let markerRight = new THREE.Mesh(cubeGeometry, material2);			
			markerRight.position.set(0, 2, 1.5);
			markerRight.visible = false;
			
			let material3 = new THREE.MeshBasicMaterial({color: 0x0000ff});
			let markerLeft = new THREE.Mesh(cubeGeometry, material3);
			markerLeft.position.set(0, 2, -1.5);
			markerLeft.visible = false;
			
			// for forward rotation (about z-axis) adjustments
			let material4 = new THREE.MeshBasicMaterial({color: 0xffff00});
			let markerFront = new THREE.Mesh(cubeGeometry, material4);
			markerFront.position.set(2, 2, 0);
			markerFront.visible = false;
			
			let material5 = new THREE.MeshBasicMaterial({color: 0x00ffff});
			let markerRear = new THREE.Mesh(cubeGeometry, material5);
			markerRear.position.set(-2, 2, 0);
			markerRear.visible = false;
			
			thePlayer.body.add(markerLeft);
			thePlayer.body.add(markerRight);
			thePlayer.body.add(markerFront);
			thePlayer.body.add(markerRear);
			
			// maybe store these in a map?
			thePlayer.frontHeightMarker = markerFront;
			thePlayer.rearHeightMarker = markerRear;
			thePlayer.leftHeightMarker = markerLeft;
			thePlayer.rightHeightMarker = markerRight;

			thePlayer.castShadow = true;
			scene.add(thePlayer);
			
			animate();
		}
	})
});


const raycaster1 = new THREE.Raycaster();
const raycaster2 = new THREE.Raycaster();
const leftMarkerVec = new THREE.Vector3(); // probably just need 2 and can keep reusing them
const rightMarkerVec = new THREE.Vector3();
const frontMarkerVec = new THREE.Vector3();
const rearMarkerVec = new THREE.Vector3();
const markerVec = new THREE.Vector3();
const normalMatrix = new THREE.Matrix3();
const quat = new THREE.Quaternion();

function adjustLateralRotationBasedOnTerrain(thePlayer, terrain){
	// take left, right and height markers and get their heights
	// form a vector from left to right based on the points given by their heights
	// if that vector is at an angle, rotate the car accordingly about the x axis
	// so that the vector of left to right markers are parallel to the vector formed
	// from the heights of the raycasts
	let mid = thePlayer.heightMarker.getWorldPosition(markerVec);
	raycaster1.set(mid, new THREE.Vector3(0, -1 ,0));
	
	let mp = raycaster1.intersectObject(terrain);
	
	if(mp.length === 0){
		return;
	}
	
	let midPt;
	for(let obj of mp){
		if(obj.object.name === "racetrack"){
			midPt = obj;
		}
		break;
	}
	
	// the normal vector here is being converted to world space
	if(debugMode){
		normalMatrix.getNormalMatrix(terrain.matrixWorld);
		let v1 = midPt.face.normal.clone().applyMatrix3(normalMatrix).normalize();
		let v2 = v1.clone().multiplyScalar(3);
		let normal = drawVector(v1, v2, 0xff0000);
		
		let car1 = mid;
		let car2 = mid.clone();
		car2.y = 0;
		let carLine = drawVector(car1, car2, 0x00ffff);
		
		normal.position.copy(mid);
		normal.position.y -= 3;
		
		// show track normal vs car normal
		scene.add(normal);
		scene.add(carLine);
	}
	
	thePlayer.position.y = midPt.point.y + 0.5;
	
	let left = thePlayer.leftHeightMarker.getWorldPosition(leftMarkerVec);
	let right = thePlayer.rightHeightMarker.getWorldPosition(rightMarkerVec);
	
	raycaster1.set(left, new THREE.Vector3(0, -1 ,0));
	raycaster2.set(right, new THREE.Vector3(0, -1, 0));
	
	let lp = raycaster1.intersectObject(terrain);
	let rp = raycaster2.intersectObject(terrain);
	
	if(lp.length === 0 || rp.length === 0){
		// if we go off the racetrack
		return;
	}
	
	// note that the raycaster will catch both sides of the racetrack! so you'll get back the top face and the bottom face. 
	// we want the top face only!
	let leftPt, rightPt;
	for(let obj of lp){
		if(obj.object.name === "racetrack"){
			leftPt = obj.point; 
		}
		break;
	}
	
	for(let obj of rp){
		if(obj.object.name === "racetrack"){
			rightPt = obj.point; 
		}
		break; 
	}
	
	if(debugMode){
		let line = drawVector(leftPt, rightPt, 0x0000ff);
		let line2 = drawVector(leftMarkerVec, rightMarkerVec, 0x00ff00);
		scene.add(line);
		scene.add(line2);
	}
	
	let terrainSlopeVector = rightPt.sub(leftPt).normalize();
	let markerSlopeVector = right.sub(left).normalize();

	// rotate car about its x-axis so it aligns with the track
	if(markerSlopeVector.dot(terrainSlopeVector) < 0.998){
		console.log("need to rotate x on car!");
		
		quat.setFromUnitVectors(markerSlopeVector, terrainSlopeVector);
		thePlayer.applyQuaternion(quat);
	}
	
}

function adjustForwardRotation(thePlayer, terrain){
	// rotate about z-axis to prevent 'tilting' of the car
	// use front and rear height markers of car to determine how to rotate the 
	// car about the z-axis so it lines up with the surface it's on
	let front = thePlayer.frontHeightMarker.getWorldPosition(frontMarkerVec);
	let rear = thePlayer.rearHeightMarker.getWorldPosition(rearMarkerVec);
	
	raycaster1.set(front, new THREE.Vector3(0, -1 ,0));
	raycaster2.set(rear, new THREE.Vector3(0, -1, 0));
	
	let fp = raycaster1.intersectObject(terrain);
	let rp = raycaster2.intersectObject(terrain);
	
	if(fp.length === 0 || rp.length === 0){
		// if we go off the racetrack
		return;
	}

	let frontPt, rearPt;
	for(let obj of fp){
		if(obj.object.name === "racetrack"){
			frontPt = obj.point; 
		}
		break;
	}
	
	for(let obj of rp){
		if(obj.object.name === "racetrack"){
			rearPt = obj.point; 
		}
		break; 
	}
	
	let terrainSlopeVector = rearPt.sub(frontPt).normalize();
	let markerSlopeVector = rear.sub(front).normalize();

	// rotate car about its z-axis so it aligns with the track
	if(markerSlopeVector.dot(terrainSlopeVector) < 0.998){
		quat.setFromUnitVectors(markerSlopeVector, terrainSlopeVector);
		thePlayer.applyQuaternion(quat);
	}
}

function keydown(evt){
	if(evt.keyCode === 16){
		// shift key	
	}else if(evt.keyCode === 49){
		// toggle first-person view
	}else if(evt.keyCode === 50){
		// toggle side view
		firstPersonViewOn = false;
		bottomViewOn = false;
		topViewOn = false;
		sideViewOn = !sideViewOn;
	}else if(evt.keyCode === 51){
		// bottom view
		firstPersonViewOn = false;
		sideViewOn = false;
		topViewOn = false;
		bottomViewOn = !bottomViewOn;
	}else if(evt.keyCode === 52){
		// top view
		firstPersonViewOn = false;
		sideViewOn = false;
		bottomViewOn = false;
		topViewOn = !topViewOn;
	}else if(evt.keyCode === 80){
		// p key
		// toggle car body visibility
		thePlayer.body.visible = !thePlayer.body.visible;
	}else if(evt.keyCode === 84){
		// t key
		// toggle racetrack visibility
		terrain.visible = !terrain.visible;
	}else if(evt.keyCode === 88){
		// x key
		// display wireframe of track
		terrain.material.wireframe = !terrain.material.wireframe;
	}else if(evt.keyCode === 67){
		debugMode = !debugMode;
		
		thePlayer.frontHeightMarker.visible = !thePlayer.frontHeightMarker.visible;
		thePlayer.rearHeightMarker.visible = !thePlayer.rearHeightMarker.visible;
		thePlayer.leftHeightMarker.visible = !thePlayer.leftHeightMarker.visible;
		thePlayer.rightHeightMarker.visible = !thePlayer.rightHeightMarker.visible;
		thePlayer.heightMarker.visible = !thePlayer.heightMarker.visible;
	}
}

document.addEventListener("keydown", keydown);


// use this when turning the wheel to determine if the angle at which the car should
// follow should be negative or positive (carForward.angleTo(wheelForward) always returns a positive angle)
let lastDirection = 0;

function move(car, rotationAngle){
	
	adjustLateralRotationBasedOnTerrain(car, terrain);
	adjustForwardRotation(car, terrain);
	
	car.wheels.forEach((wheel) => {
		wheel.rotateZ(rotationAngle*5);
	});
	
	let wheelForward = getForward(car.frontWheels[0]);
	
	// since the forward is based off the z-axis, and the z-axis for the wheel (and all the meshes in this case)
	// actually is perpendicular to the 'front' of the wheel, rotate the forward
	// so we get it pointing in the direction we want
	// this issue probably has to do with the model?
	wheelForward.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
	
	// also rotate the car so it eventually lines up with the
	// front wheels in terms of angle (their forward vectors should be parallel)
	let carForward = getForward(car.body);
	carForward.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
	
	let angleToWheel = carForward.angleTo(wheelForward);
	if(angleToWheel >= 0.16){
		// TODO: this is tricky. getting the car to rotate just right when turning so it follows
		// the front wheels' rotation is hard :/. still working on it...
		car.rotateY((rotationAngle * lastDirection));
	}
	
	// move car based on wheel forward vector
	wheelForward.multiplyScalar(0.3 * (rotationAngle < 0 ? 1 : -1)); // we should allow variable speed?

	car.position.add(wheelForward);
	
}


function update(){
	
	sec = clock.getDelta();
	moveDistance = 8 * sec;
	rotationAngle = (Math.PI / 2) * sec;
	let changeCameraView = false;
	let maxRad = 0.56; // max/min radians for wheel angle
	
	if(keyboard.pressed("Z")){
		changeCameraView = true;
	}
	
	if(keyboard.pressed("W")){
		move(thePlayer, -rotationAngle);
	}else if(keyboard.pressed("S")){
		move(thePlayer, rotationAngle);
	}
	
	if(keyboard.pressed("A")){
		lastDirection = -1;  // angle from car body to wheel forward vector should be positive
		                    // because the body needs to be rotated counterclockwise. multiply -1 because rotationAngle is negative.
		
		thePlayer.frontWheels.forEach((wheel) => {
			// check this out: https://stackoverflow.com/questions/56426088/rotate-around-world-axis
			if(wheel.rotation.y >= -maxRad && wheel.rotation.y <= maxRad){
				wheel.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), rotationAngle/1.4);
				
				if(Math.abs(wheel.rotation.y) > maxRad){
					wheel.rotation.y = wheel.rotation.y < 0 ? -maxRad + 0.01 : maxRad - 0.01;
				}
			}
		});
	}
	
	if(keyboard.pressed("D")){
		lastDirection = 1; // clockwise rotation for the car body to align with front wheel rotation about y
		thePlayer.frontWheels.forEach((wheel) => {
			if(wheel.rotation.y >= -maxRad && wheel.rotation.y <= maxRad){
				wheel.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -rotationAngle/1.4);
				
				if(Math.abs(wheel.rotation.y) > maxRad){
					wheel.rotation.y = wheel.rotation.y < 0 ? -maxRad + 0.01 : maxRad - 0.01;
				}
			}
		});
	}
	
	let relCameraOffset;
	
	if(firstPersonViewOn){
		// nothing to do
	}else if(sideViewOn && !changeCameraView){
		// actually rear view
		relCameraOffset = new THREE.Vector3(-10, 2, 0);
	}else if(bottomViewOn){
		relCameraOffset = new THREE.Vector3(0, -6, 0);
	}else if(topViewOn){
		relCameraOffset = new THREE.Vector3(0, 15, 0);
	}else if(!changeCameraView){
		relCameraOffset = new THREE.Vector3(0, 3, -12);
	}else{
		if(sideViewOn){
			// actually front view
			relCameraOffset = new THREE.Vector3(10, 2, 0);
		}else{
			relCameraOffset = new THREE.Vector3(0, 3, 12);
		}		
	}
	
	if(!firstPersonViewOn){
		let cameraOffset = relCameraOffset.applyMatrix4(thePlayer.matrixWorld);
		camera.position.x = cameraOffset.x;
		camera.position.y = cameraOffset.y;
		camera.position.z = cameraOffset.z;
	}
	
	if(!firstPersonViewOn) camera.lookAt(thePlayer.position);

}

function animate(){
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	update();
}