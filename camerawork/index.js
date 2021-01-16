
class Path {
	constructor(start, end, linkMesh, target=null){
		this.start = start; // a threejs mesh object
		this.end = end; // a threejs mesh object
		
		this.linkMesh = linkMesh // a threejs line mesh object
		
		// other parameters to describe the path
		this.duration = 5; // seconds
		
		// add a target property?
		// it should represent the object to look at while the camera moves along this path
		this.target = target;
	}
}

class MarkerManager {

	constructor(scene, mainCamera){
		this.scene = scene; // threejs scene
		this.mainCamera = mainCamera; // the camera the user will use to move around with
		this.paths = []; // list of Path objects
		this.selectedMarkers = [];
		this.mode = "add"; // 'add' or 'select'
		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
	}
	
	changeMode(){
		this.mode = (this.mode === "add" ? "select" : "add");
	}

	// add a new marker to the path
	// marker should be a mesh or Object3D
	// x and y are 2d-to-3d converted coord values
	addMarker(marker, x, y){
		
		// add marker to scene
		camera.add(marker);
		
		// copy camera rotation
		marker.rotation.copy(camera.rotation);
		marker.updateMatrixWorld(true);
		
		// translate cube in camera object space
		let z = 10;
		let cubePos = new THREE.Vector3(10*x, 10*y, -z);
		marker.position.set(cubePos.x, cubePos.y, cubePos.z);
		
		// move it to world space
		let cubePosWorld = new THREE.Vector3();
		marker.getWorldPosition(cubePosWorld);
		marker.position.set(cubePosWorld.x, cubePosWorld.y, cubePosWorld.z);
		
		// make scene the parent of the cube
		scene.add(marker);
	}
	
	removeMarker(markerToRemove){
		// also remove from paths any path that contains this marker
	}
	
	addToSelectedMarkers(markerToAdd){
		// this is a reference to the marker mesh object
		this.selectedMarkers.push(markerToAdd);
	}
	
	removeSelectedMarker(markerToRemove){
		// this is a reference to the marker mesh object
		this.selectedMarkers = this.selectedMarkers.filter((marker) => {
			return marker.uuid !== markerToRemove.uuid;
		});
	}

	connectMarkers(markerList, target=null){
		// what if we want a path with just 1 marker? i.e. for a static camera scene
		if(markerList.length === 1){
			// create some kinda path marker for it? like a sphere hovering over the marker maybe?
			this.createPath(markerList[0], markerList[0], null);
		}else{
			// draw lines between the markers in the list (based on order in the list)
			let lineMaterial = new THREE.LineBasicMaterial({color: 0x0000ff});
			let startPos = new THREE.Vector3();
			let endPos = new THREE.Vector3();
			for(let i = 0; i < markerList.length - 1; i++){
				let start = markerList[i];
				let end = markerList[i+1];
				
				start.getWorldPosition(startPos);
				end.getWorldPosition(endPos);
				
				let linePts = [startPos, endPos];
				let tubeGeo = new THREE.TubeGeometry(
					new THREE.CatmullRomCurve3(linePts),
					512, // path segments
					0.2, // thickness
					8, // roundness
					false, // closed
				);
				
				let tube = new THREE.BufferGeometry().fromGeometry(tubeGeo);
				let line = new THREE.Line(tube, lineMaterial);
				scene.add(line);
				
				// add to list of paths
				this.createPath(start, end, line, target);
			}
		}
		
		// make sure markers are deselected
		markerList.forEach((marker) => {
			marker.material.color.setHex(0x00ff00);
		});
		
		this.selectedMarkers = [];
	}
	
	// x and y are 3d converted coordinates to 2d based on mouse location
	selectMarker(x, y){
		this.mouse.x = x;
		this.mouse.y = y;
		this.raycaster.setFromCamera(this.mouse, this.mainCamera);
		let intersects = this.raycaster.intersectObjects(this.scene.children);
		for(let i = 0; i < intersects.length; i++){
			if(intersects[i].object.objectType && intersects[i].object.objectType === "marker"){
				return intersects[i];
			}
		}
		return null;
	}
	
	createMarker(){
		let geo = new THREE.BoxGeometry(2,2,2);
		let mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
		let cube = new THREE.Mesh(geo, mat);
		cube.objectType = "marker";
		return cube;
	}
	
	// https://stackoverflow.com/questions/42309715/how-to-correctly-pass-mouse-coordinates-to-webgl
	getCoordsOnMouseClick(event){
		let target = event.target;
		let x1 = event.clientX - target.getBoundingClientRect().left;// + target.offsetWidth/2;
		let y1 = event.clientY - target.getBoundingClientRect().top;// + target.offsetHeight/2;
		let posX = (x1 * target.width) / target.clientWidth;
		let posY = (y1 * target.height) / target.clientHeight;

		let gl = target.getContext("webgl2"); // might be webgl in other browsers (not chrome)?
		
		let x = (posX / gl.canvas.width) * 2 - 1;
		let y = (posY / gl.canvas.height) * -2 + 1;
		
		return {x, y};
	}

	toggleMarkers(){
		// make a set containing all markers and then toggle visibility
		let markerSet = new Set();
		for(let path of this.paths){
			if(path.start){
				markerSet.add(path.start);
			}
			if(path.end){
				markerSet.add(path.end);
			}
		}
		for(let marker of markerSet){
			marker.visible = !marker.visible;
		}
	}

	togglePaths(){
		for(let path of this.paths){
			if(path.linkMesh){
				path.linkMesh.visible = !path.linkMesh.visible;
			}
		}
	}
	
	// markerStart and markerEnd should be threejs Mesh objects
	createPath(markerStart, markerEnd, linkMesh, target=null){
		let path = new Path(markerStart, markerEnd, linkMesh, target);
		this.paths.push(path);
	}
	
	removePath(startMarker, endMarker){
		// go through existing paths in this.paths
		// find the one that has the matching start and end markers
		// remove the path link/linkMesh (set to null?)
	}
	
	ridePath(){
		// go through path in paths
		// for each path, move the camera from start to end markers along the link mesh and for the duration specified
		
		// move the camera to the first marker first
		if(this.paths[0]){
			let firstPos = this.paths[0].start.position;
			this.mainCamera.position.copy(firstPos);
		}
		
		let timeAccumulator = 0; // use this to help schedule each path's camera movement
		let timers = [];
		this.paths.forEach((path) => {
			// figure out distance to
			const start = path.start.position.clone();
			const end = path.end.position.clone();
			const duration = path.duration; // in seconds!
			const target = path.target;
			const vectorTo = end.sub(start);
			const isStatic = (path.linkMesh === null);
			
			// get a vector segment based on duration of path
			const segmentVector = vectorTo.divideScalar(duration);
			
			// use settimeout to schedule when the new path animation interval should be run
			// this will not be very accurate though
			setTimeout(() => {
				timers.forEach((timer) => {
					// prevent any interleaving by clearing preexisting timers
					clearInterval(timer);
				});
				
				// rotate camera based on start marker for this path
				camera.rotation.copy(path.start.rotation);
				
				let newTimer = setInterval(() => {
					// move the camera every second based on the segmentVector
					//console.log(segmentVector);
					if(isStatic){
						this.mainCamera.position.copy(start); // move the camera to the start marker of this path since there is no link path to travel on
					}else{
						this.mainCamera.position.add(segmentVector);
					}
					
					if(target){
						// if there is a target that the camera should be following,
						// this will allow the camera to stay focused on that target
						let targetPosWorld = new THREE.Vector3();
						target.getWorldPosition(targetPosWorld);
						this.mainCamera.lookAt(targetPosWorld);
					}
					
				}, 1000);
				timers.push(newTimer);
				
				setTimeout(() => {
					camera.rotation.copy(path.end.rotation);
					if(isStatic){
						this.mainCamera.position.copy(start);
					}else{
						this.mainCamera.position.add(segmentVector);
					}
					clearInterval(newTimer);
				}, duration*1000);
			},
			timeAccumulator);
			//console.log("setting a new timer at: " + timeAccumulator + "ms in and stopping after: " + (timeAccumulator + duration*1000) + "ms in.");
			
			timeAccumulator += duration*1000;
		});
	}
}

class UIManager {

	constructor(){
	}

	// update UI with new changes
	// i.e. for customizing path properties, markers, etc.
	updateUI(){
	}
}

function setupSceneLights(scene){
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
}

function setupTerrain(scene){
	let texture = new THREE.TextureLoader().load('texture.png');
	let terrainMat = new THREE.MeshBasicMaterial({map: texture});
	let terrain = new THREE.PlaneGeometry(200, 200, 1);
	let plane = new THREE.Mesh(terrain, terrainMat);
	plane.position.set(0, -1, 0);
	plane.rotateX((3*Math.PI)/2);
	scene.add(plane);
}

function setupDemoMesh(scene){
	let cubeGeometry = new THREE.BoxGeometry(5,5,5);
	let material = new THREE.MeshBasicMaterial({color: 0x0000ff});
	material.wireframe = true;
	let thePlayer = new THREE.Mesh(cubeGeometry, material);

	let cube2g = new THREE.BoxGeometry(2,2,2);
	let mat = new THREE.MeshBasicMaterial({color: 0xff0000});
	let cube = new THREE.Mesh(cube2g, mat);

	thePlayer.add(cube);
	cube.position.set(0, 3, 0);

	thePlayer.position.set(0, 2, 0);
	scene.add(thePlayer);
	
	let playerAxesHelper = new THREE.AxesHelper(5);
	let playerGroupAxesHelper = new THREE.AxesHelper(5);
	thePlayer.add(playerAxesHelper);
	cube.add(playerGroupAxesHelper);
	return thePlayer;
}

let addMarker = true;
let selectMarker = false;

////////////////////////////////////////////////////////
const el = document.getElementById("container");
const container = document.querySelector('#container');
const fov = 60;

const defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const raycaster = new THREE.Raycaster();
const loadingManager = new THREE.LoadingManager();
const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(el.clientWidth, el.clientHeight);	
container.appendChild(renderer.domElement);

const camera = defaultCamera;
camera.position.set(0,5,15);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);	
scene.add(camera);

setupSceneLights(scene);
setupTerrain(scene);
const targetObj = setupDemoMesh(scene);

const clock = new THREE.Clock();
let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;


renderer.domElement.addEventListener("click", (evt) => {
	let coords = markerManager.getCoordsOnMouseClick(evt);
	if(markerManager.mode === "add"){
		let cube = markerManager.createMarker();
		markerManager.addMarker(cube, coords.x, coords.y);
	}else{
		let selectedMarker = markerManager.selectMarker(coords.x, coords.y);
		if(selectedMarker){
			if(selectedMarker.object.material.color.g === 1){
				// select 
				selectedMarker.object.material.color.setHex(0xff0000);
				markerManager.addToSelectedMarkers(selectedMarker.object);
			}else{
				// deselect
				selectedMarker.object.material.color.setHex(0x00ff00);
				markerManager.removeSelectedMarker(selectedMarker.object);
			}
		}
	}
});

const markerManager = new MarkerManager(scene, camera);
function update(){
	sec = clock.getDelta();
	moveDistance = 8 * sec;
	rotationAngle = (Math.PI / 2) * sec;
	let changeCameraView = false;
	
	if(keyboard.pressed("W")){
		// moving forwards
		camera.translateZ(-moveDistance);
		
	}else if(keyboard.pressed("S")){
		// moving backwards
		camera.translateZ(moveDistance);
	}
	
	if(keyboard.pressed("up")){
		// up arrow (rotate x)
		// need to prevent default (i.e. scrolling)
		// clamp also?
		camera.rotateX(rotationAngle);
	}
	
	if(keyboard.pressed("down")){
		camera.rotateX(-rotationAngle);
	}
	
	if(keyboard.pressed("A")){
		let axis = new THREE.Vector3(0, 1, 0);
		camera.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("D")){
		let axis = new THREE.Vector3(0, 1, 0);
		camera.rotateOnAxis(axis, -rotationAngle);
	}
	
	if(keyboard.pressed("Q")){
		let axis = new THREE.Vector3(0, 0, 1);
		camera.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("E")){
		let axis = new THREE.Vector3(0, 0, 1);
		camera.rotateOnAxis(axis, -rotationAngle);
	}
}

function animate(){
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	update();
}

animate();


document.getElementById('addMarker').addEventListener('click', (evt) => {
	addMarker = true;
	selectMarker = false;
	evt.target.style.border = "3px solid green";
	document.getElementById('selectMarker').style.border = "none";
	markerManager.changeMode();
});

document.getElementById('selectMarker').addEventListener('click', (evt) => {
	selectMarker = true;
	addMarker = false;
	evt.target.style.border = "3px solid green";
	document.getElementById('addMarker').style.border = "none";
	markerManager.changeMode();
});

document.getElementById('createPath').addEventListener('click', (evt) => {
	if(markerManager.mode === "select"){
		// take all selected markers and create a path between them in the order they are in
		markerManager.connectMarkers(markerManager.selectedMarkers, targetObj);
	}
});

document.getElementById('ridePath').addEventListener('click', (evt) => {
	markerManager.ridePath();
});

document.getElementById('toggleMarkerVisibility').addEventListener('click', (evt) => {
	markerManager.toggleMarkers();
});

document.getElementById('togglePathVisibility').addEventListener('click', (evt) => {
	markerManager.togglePaths();
});