
const el = document.getElementById("container");
const fov = 60;
const defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const container = document.querySelector('#container');
const raycaster = new THREE.Raycaster();
const loadingManager = new THREE.LoadingManager();
let animationController;

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

// create some 'terrain'
let texture = new THREE.TextureLoader().load('texture.png');
let terrainMat = new THREE.MeshBasicMaterial({map: texture});
let terrain = new THREE.PlaneGeometry(200, 200, 1);
let plane = new THREE.Mesh(terrain, terrainMat);
plane.position.set(0, -1, 0);
plane.rotateX((3*Math.PI)/2);
scene.add(plane);

// create the player cube 
let cubeGeometry = new THREE.BoxGeometry(5,5,5);
let material = new THREE.MeshBasicMaterial({color: 0x0000ff});
material.wireframe = true;
let thePlayer = new THREE.Mesh(cubeGeometry, material); 
thePlayer.position.set(0, 2, 0);
scene.add(thePlayer);

let bgAxesHelper;
let playerAxesHelper;
let playerGroupAxesHelper;

let firstPersonViewOn = false;


function keydown(evt){
	if(evt.keyCode === 49){
		// toggle first-person view
		firstPersonViewOn = !firstPersonViewOn;
		// make sure camera is in the head position
		// and that the camera is parented to the character mesh
		// so that it can rotate with the mesh
		if(firstPersonViewOn){
			thePlayer.add(camera);
			//camera.position.copy(thePlayer.head.position);
			//camera.rotation.copy(thePlayer.rotation);
		}else{
			scene.add(camera);
		}
	}
}


document.addEventListener("keydown", keydown);


function update(){
	
	sec = clock.getDelta();
	moveDistance = 8 * sec;
	rotationAngle = (Math.PI / 2) * sec;
	let changeCameraView = false;
	
	if(keyboard.pressed("z")){
		changeCameraView = true;
	}
	
	if(keyboard.pressed("W")){
		// moving forwards
		thePlayer.translateZ(moveDistance);
		
	}else if(keyboard.pressed("S")){
		// moving backwards
		thePlayer.translateZ(-moveDistance);
	}
	
	if(keyboard.pressed("J")){
		// for jumping
	}
	
	if(keyboard.pressed("A")){
		let axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("D")){
		let axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	let relCameraOffset;
	
	if(firstPersonViewOn){
		let newPos = new THREE.Vector3();
		newPos.copy(thePlayer.position);
		newPos.z += 1;
		newPos.y -= 0.5;
		relCameraOffset = newPos;
		//camera.rotation.copy(thePlayer.rotation);
	}else if(!changeCameraView){
		relCameraOffset = new THREE.Vector3(0, 3, -15);
	}else{
		relCameraOffset = new THREE.Vector3(0, 3, 15);
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

animate();