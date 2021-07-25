
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
camera.position.set(1,4,8);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);	
scene.add(camera);


let pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 8, 12);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 0;
pointLight.shadow.mapSize.height = 0;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 100;
pointLight.shadow.camera.fov = 70;
scene.add(pointLight);


let hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const clock = new THREE.Clock();

/* create some 'terrain'
let texture = new THREE.TextureLoader().load('texture.png');
let terrainMat = new THREE.MeshBasicMaterial({map: texture});
let terrain = new THREE.PlaneGeometry(200, 200, 1);
let plane = new THREE.Mesh(terrain, terrainMat);
plane.position.set(0, -1, 0);
plane.rotateX((3*Math.PI)/2);
scene.add(plane);
*/

// add the vending machine
function getModel(modelFilePath, side, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			function(gltf){
				resolve(gltf.scene);
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

let vendingMachine;
getModel('vending-machine.gltf').then((obj) => {
	obj.position.x += 1;
	obj.rotation.y = Math.PI;
	obj.scale.x *= 5;
	obj.scale.y *= 5;
	obj.scale.z *= 5;
	vendingMachine = obj;
	scene.add(obj);
});

function keydown(evt){
	if(evt.keyCode === 49){
	}
}
document.addEventListener("keydown", keydown);


function update(){
	if(vendingMachine){
		let sec = clock.getDelta();
		let rotationAngle = (Math.PI / 2) * sec;
		vendingMachine.rotateOnAxis(new THREE.Vector3(0,1,0), rotationAngle/3);
	}
}

function animate(){
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	update();
}

animate();