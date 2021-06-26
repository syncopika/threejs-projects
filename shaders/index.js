let currModel = null;
let currModelTexture = null;
const loader = new THREE.GLTFLoader();
const textureLoader = new THREE.TextureLoader();

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

getModel('../shared_assets/f-16.gltf', 'f16');
update();

function getModel(modelFilePath, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			async function(gltf){
				gltf.scene.traverse((child) => {
					if(child.type === "Mesh"){	
						let material = child.material;
						let geometry = child.geometry;
						let obj = new THREE.Mesh(geometry, material);			
						obj.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI/4);
						obj.name = name;
						
						if(name === "battleship2" || name === "whale-shark-camo"){
							obj.scale.set(5, 5, 5);
							obj.position.set(5, 0, 0);
						}else{
							obj.position.set(0, 0, 0);
						}
						
						currModel = obj;
						currModelTexture = obj.material.map ? obj.material.map.image : null;
						processMesh(obj);
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
	if(["whale-shark-camo", "f-18"].indexOf(evt.target.value) > -1){
		getModel(`../shared_assets/${evt.target.value}.glb`, evt.target.value);
	}else{
		getModel(`../shared_assets/${evt.target.value}.gltf`, evt.target.value);
	}
});

function getTextureImageUrl(imgElement){
	const canvas = document.createElement('canvas');
	canvas.width = imgElement.width;
	canvas.height = imgElement.height;
	canvas.getContext('2d').drawImage(imgElement, 0, 0);
	return canvas.toDataURL();
}


function updateModel(){
	// update shader
	const vertexShader = `
		varying vec2 vUv;
		uniform float u_time;
	
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix *
			              modelViewMatrix *
						  vec4(position, 1.0); //vec4(position.x,position.y+(3.0*sin(u_time)),position.z,1.0);
		}
	`;
	
	const fragShader = `
		varying vec2 vUv;
		uniform sampler2D img;
		uniform float u_time;
		uniform vec2 u_resolution; // dimensions of renderer
		
		void main() {
			vec2 pt = gl_FragCoord.xy/u_resolution.xy;
			
			float y = pow(pt.x,2.0);
			
			vec3 color = vec3(y);
			
			vec4 txColor = texture2D(img, vUv);
			
			gl_FragColor = vec4(txColor.r*1.2*abs(sin(u_time)), txColor.g*1.2*abs(sin(u_time)), txColor.b*1.2*abs(sin(u_time)), 0.0);
			
			//gl_FragColor = vec4(1.0-abs(sin(u_time)),
			//                    0.0,
			//					color.z,
			//					1.0);
		}
	`;
	
	const uniforms = {
		u_time: {type: "f", value: 0},
		u_resolution: {type: "vec2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height)},
	}
	
	if(currModelTexture){
		const textureUrl = getTextureImageUrl(currModelTexture);
		const texture = textureLoader.load(textureUrl);
		texture.flipY = false; // this part is important!
		uniforms.img = {type: "t", value: texture};
	}
	
	const newShaderMaterial = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertexShader,
		fragmentShader: fragShader,
	});
	
	currModel.material = newShaderMaterial;
	
}

document.getElementById('updateModel').addEventListener('click', (evt) => {
	updateModel();
});
