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
						
						if(name === "whale-shark-camo"){
							obj.scale.set(1.8, 1.8, 1.8);
							obj.position.set(5, 0, 0);
							obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/2);
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
	let playerAxesHelper = new THREE.AxesHelper(10);
	mesh.add(playerAxesHelper);
	
	scene.add(mesh);
	update();
	renderer.render(scene, camera);
}

function update(){
	requestAnimationFrame(update);
	controls.update();
	
	if(currModel && currModel.material.uniforms){
		// update uniform var in frag shader
		currModel.material.uniforms.u_time.value += 0.01;
	}
	
	renderer.render(scene, camera);
}

// model selection
document.getElementById('selectModel').addEventListener('change', (evt) => {
	scene.remove(scene.getObjectByName(currModel.name));
	currModelTexture = null;
	
	if(["whale-shark-camo"].indexOf(evt.target.value) > -1){
		getModel(`../shared_assets/${evt.target.value}.glb`, evt.target.value);
	}else if(evt.target.value === "scene1"){
		currModel = createSceneSquares();
		processMesh(currModel);
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
	// update shader for the jet model
	const vertexShader = `
		varying vec2 vUv;
		uniform float u_time;
	
		// http://www.neilmendoza.com/glsl-rotation-about-an-arbitrary-axis/
		mat4 getRotationMat(vec3 axis, float angle){
			float s = sin(angle);
			float c = cos(angle);
			float oc = 1.0 - c;
			
			return mat4(
				oc*axis.x*axis.x + c,        oc*axis.x*axis.y - axis.z*s, oc*axis.z*axis.x + axis.y*s, 0.0,
				oc*axis.x*axis.y + axis.z*s, oc*axis.y*axis.y + c,        oc*axis.y*axis.z + axis.x*s, 0.0, 
				oc*axis.x*axis.z - axis.y*s, oc*axis.y*axis.z + axis.x*s, oc*axis.z*axis.z + c,         0.0,
                0.0,                         0.0,                         0.0,                         1.0
			);
		}
	
		void main() {
			vUv = uv;
			
			mat4 rotY = getRotationMat(vec3(0, 1, 0), sin(0.3*u_time));
			
			gl_Position = projectionMatrix *
			              modelViewMatrix *
						  rotY *
						  vec4(position, 1.0);
		}
	`;
	
	const fragShader = `
		varying vec2 vUv;
		uniform sampler2D img;
		uniform float u_time;
		uniform vec2 u_resolution; // dimensions of renderer
		
		float interpolate(float val){
			return clamp(smoothstep(0.3, 1.0, val), 0.3, 1.0); // let lowest possible val be 0.3
		}
		
		void main() {
			vec2 pt = gl_FragCoord.xy/u_resolution.xy;
			
			vec4 txColor = texture2D(img, vUv);
			
			gl_FragColor = vec4(
				interpolate(txColor.r*abs(sin(u_time))), 
				interpolate(txColor.g*abs(sin(u_time))), 
				interpolate(txColor.b*abs(sin(u_time))), 
				1.0);
		}
	`;
	
	const uniforms = {
		u_time: {type: "f", value: 0},
		u_resolution: {type: "vec2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height)},
	};
	
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


function randomRange(min, max){
	return Math.random() * (max - min) + min;
}

// make a bunch of squares with shaders
function createSceneSquares(){
	const numSquares = 200;
	const vertexCount = numSquares * 4;
	
	const geometry = new THREE.BufferGeometry();
	
	const positions = [];
	const colors = [];
	const indices = [];
	
	const zRange = {'min': camera.position.z-180, 'max': 20}; // range for z position of squares
	const xRange = {'min': -120, 'max': 120};
	const yRange = {'min': -120, 'max': 120};
	const squareWidth = 5;
	const squareHeight = 5;
	
	for(let i = 0; i <= vertexCount - 4; i+= 4){
		// this is one of the vertices of a square
		const x1 = randomRange(xRange.min, xRange.max);
		const y1 = randomRange(yRange.min, yRange.max);
		const z1 = randomRange(zRange.min, zRange.max);
		
		// top-left vertex
		positions.push(x1);
		positions.push(y1);
		positions.push(z1);
		colors.push(Math.random()*255); //r
		colors.push(Math.random()*255); //g
		colors.push(Math.random()*255); //g
		colors.push(200); //a - make each square slightly transparent
		
		// since each square has 4 vertices, create the others here
		// top-right vertex
		positions.push(x1+squareWidth);
		positions.push(y1);
		positions.push(z1);
		colors.push(Math.random()*255);
		colors.push(Math.random()*255);
		colors.push(Math.random()*255);
		colors.push(200);
		
		// bottom-left vertex
		positions.push(x1);
		positions.push(y1-squareHeight);
		positions.push(z1);
		colors.push(Math.random()*255);
		colors.push(Math.random()*255);
		colors.push(Math.random()*255);
		colors.push(200);
		
		// bottom-right vertex
		positions.push(x1+squareWidth);
		positions.push(y1-squareHeight);
		positions.push(z1);
		colors.push(Math.random()*255);
		colors.push(Math.random()*255);
		colors.push(Math.random()*255);
		colors.push(200);
		
		// since we're making squares, we need 2 triangles. 
		// specify what vertices make up which triangles in the indices array
		// first triangle
		indices.push(i+2);
		indices.push(i+3);
		indices.push(i+1);
		
		// second triangle
		indices.push(i+1);
		indices.push(i);
		indices.push(i+2);
	}
	
	const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
	const colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
	colorAttribute.normalized = true; // normalize color values so the fall in range 0 to 1.
	
	geometry.setAttribute('position', positionAttribute);
	geometry.setAttribute('color', colorAttribute);
	geometry.setIndex(indices);
	
	const vertexShader = `
		uniform float u_time;
		
		attribute vec4 color;
		varying vec4 vColor;
		
		// https://thebookofshaders.com/10/
		float rand(vec2 pos){
			return fract(sin(dot(pos, vec2(12.9898,78.233)))*43758.5453123);
		}
		
		// http://www.neilmendoza.com/glsl-rotation-about-an-arbitrary-axis/
		mat4 getRotationMat(vec3 axis, float angle){
			float s = sin(angle);
			float c = cos(angle);
			float oc = 1.0 - c;
			
			return mat4(
				oc*axis.x*axis.x + c,        oc*axis.x*axis.y - axis.z*s, oc*axis.z*axis.x + axis.y*s, 0.0,
				oc*axis.x*axis.y + axis.z*s, oc*axis.y*axis.y + c,        oc*axis.y*axis.z + axis.x*s, 0.0, 
				oc*axis.x*axis.z - axis.y*s, oc*axis.y*axis.z + axis.x*s, oc*axis.z*axis.z + c,         0.0,
                0.0,                         0.0,                         0.0,                         1.0
			);
		}
	
		void main() {
			vColor = color;
			
			float randVal = rand(vec2(position.xy));
			
			mat4 rotZ = getRotationMat(vec3(0,0,1), randVal*cos(u_time)); // rotate about the z axis
			
			// rotate and move the squares along the z axis
			gl_Position = projectionMatrix * modelViewMatrix * rotZ * vec4(position.x, position.y, (1.+randVal+cos(u_time))*position.z*abs(cos(0.2*u_time)), 1.0);
		}
	`;
	
	const fragShader = `
		uniform sampler2D img;
		uniform float u_time;
		uniform vec2 u_resolution; // dimensions of renderer canvas
		varying vec4 vColor;
		
		void main() {
            gl_FragColor = vec4(
			vColor.r*abs(cos(u_time))*1.3, 
			vColor.g*abs(sin(u_time))*1.6, 
			vColor.b*abs(cos(u_time))*1.2,
			1.0);
		}
	`;
	
	const uniforms = {
		u_time: {type: "f", value: 0},
		u_resolution: {type: "vec2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height)},
	};
	
	const newShaderMaterial = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertexShader,
		fragmentShader: fragShader,
		side: THREE.DoubleSide,
		transparent: true,
	});
	
	const mesh = new THREE.Mesh(geometry, newShaderMaterial);
	mesh.name = "squareScene";
	
	return mesh;
}

// whale shark shader
function updateWhaleShark(){
		const vertexShader = `
		varying vec2 vUv;
		uniform float u_time;
	
		void main() {
			vUv = uv;
			
			gl_Position = projectionMatrix *
			              modelViewMatrix *
						  vec4(position, 1.0);
		}
	`;
	
	const fragShader = `
		varying vec2 vUv;
		uniform sampler2D img;
		uniform float u_time;
		uniform vec2 u_resolution; // dimensions of renderer
		
		float rand(vec2 pos){
			return fract(sin(dot(pos, vec2(12.9898,78.233)))*43758.5453123);
		}
		
		void main() {
			vec2 pt = gl_FragCoord.xy/u_resolution.xy;
			
			vec4 txColor = texture2D(img, vUv);
			
			// color only certain parts of the shark!
			if(txColor.r < 0.5 && txColor.g < 0.5 && txColor.b < 0.5){
				gl_FragColor = vec4(txColor.rgb, 1.0);
			}else{
				gl_FragColor = vec4(
					1.-txColor.r*abs(sin(0.2*u_time))*rand(pt), // rand(pt) adds some noise
					1.-txColor.g*abs(cos(u_time))*rand(pt),
					1.- txColor.b*abs(sin(0.1*u_time)), 
					1.0);
			}
		}
	`;
	
	const uniforms = {
		u_time: {type: "f", value: 0},
		u_resolution: {type: "vec2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height)},
	};
	
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
	if(currModel.name === "whale-shark-camo"){
		updateWhaleShark();
	}else{
		updateModel();
	}
});
