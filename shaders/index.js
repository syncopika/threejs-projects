let currModel = null;
let currModelTextureMesh = null; // use this variable to keep track of the mesh whose texture is being edited
const loader = new THREE.GLTFLoader();
const textureLoader = new THREE.TextureLoader();
//const group = new THREE.Group();

const el = document.getElementById("container");
const renderer = new THREE.WebGLRenderer();
const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);	

renderer.shadowMap.enabled = true;
renderer.setSize(el.clientWidth, el.clientHeight);
el.appendChild(renderer.domElement);

camera.position.set(0, 10, 15);
camera.rotateOnAxis(new THREE.Vector3(1,0,0), -Math.PI/8);
scene.add(camera);

// https://discourse.threejs.org/t/solved-glb-model-is-very-dark/6258
let hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
hemiLight.position.set(0, 200, 0);
scene.add(hemiLight);

let dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( 0, 100, -10);
scene.add(dirLight);

// set up trackball control
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 1.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
//controls.noZoom = false;
//controls.noPan = false;
//controls.staticMoving = true;
//controls.dynamicDampingFactor = 0.3;

getModel('models/f-16.gltf', 'f16');
update();

function getModel(modelFilePath, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			async function(gltf){
				if(name === "porsche"){
					currModel = gltf.scene;
					currModel.scale.set(4,4,4);
					currModel.position.set(0, 0, -5);
					currModel.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI*.8);
					processMesh(currModel);
					
					const carBody = gltf.scene.children.filter((obj) => obj.name === "porsche")[0];
					currModelTextureMesh = carBody;						
				}else{
					gltf.scene.traverse((child) => {
						if(child.type === "Mesh"){
							
							let material = child.material;
							let geometry = child.geometry;
							let obj = new THREE.Mesh(geometry, material);			
							obj.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI/4);
							obj.name = name;
							
							if(name === "battleship2"){
								obj.scale.set(5, 5, 5);
								obj.position.set(5, 0, 0);
							}else{
								obj.position.set(0, 0, 0);
							}
							
							currModel = obj;
							currModelTextureMesh = obj;
							processMesh(obj);
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

function processMesh(mesh){
	// the local axis of the imported mesh is a bit weird and not consistent with the world axis. so, to fix that,
	// put it in a group object and just control the group object! the mesh is also just oriented properly initially when placed in the group.
	let playerAxesHelper = new THREE.AxesHelper(10);
	mesh.add(playerAxesHelper);
	
	scene.add(mesh);
	update();
	renderer.render(scene, camera);
}

function update(){
	requestAnimationFrame(update);
	controls.update();
	
	// update uniform var in frag shader
	if(currModel && currModel.material.uniforms){
		currModel.material.uniforms.u_time.value += 0.01;
	}
	
	renderer.render(scene, camera);
}

// model selection
document.getElementById('selectModel').addEventListener('change', (evt) => {
	//console.log(evt.target.value);
	scene.remove(scene.getObjectByName(currModel.name));
	if(evt.target.value === 'f-18'){
		getModel(`models/${evt.target.value}.glb`, evt.target.value);
	}else{
		getModel(`models/${evt.target.value}.gltf`, evt.target.value);
	}
});


function updateModel(){
	// update shader
	const vertexShader = `
		void main() {
			gl_Position = projectionMatrix *
			              modelViewMatrix *
						  vec4(position,1.0);
		}
	`;
	
	const fragShader = `
		uniform float u_time;
		void main() {
			gl_FragColor = vec4(1.0-abs(sin(u_time)),
			                    0.0,
								1.0,
								1.0);
		}
	`;
	
	const newShaderMaterial = new THREE.ShaderMaterial({
		uniforms: {
			u_time: {type: "f", value: 0}
		},
		vertexShader: vertexShader,
		fragmentShader: fragShader,
	});
	
	currModel.material = newShaderMaterial;
	
}

document.getElementById('updateModel').addEventListener('click', (evt) => {
	updateModel();
});
