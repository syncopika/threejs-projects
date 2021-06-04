let currModel = null;

function getModel(modelFilePath, type, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			async function(gltf){
				gltf.scene.traverse((child) => {
					if(child.type === "Mesh"){
						currModel = child;
						
						// get the embedded texture and display in canvas
						const texture = child.material.map.image;
						const canvas = document.getElementById('liveryCanvas');
						canvas.width = texture.width;
						canvas.height = texture.height;
						canvas.getContext('2d').drawImage(texture, 0, 0);
						
						let material = child.material;
						let geometry = child.geometry;
						let obj = new THREE.Mesh(geometry, material);
						
						if(name === "bg"){
						}
						
						if(type === "player"){
							//obj.scale.x = 1;
							//obj.scale.y = 1;
							//obj.scale.z = 1;
							obj.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI/4);
						}
						obj.type = type;
						obj.name = name;
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
	if(mesh.type === "player"){
		let meshName = mesh.name;
		
		// the local axis of the imported mesh is a bit weird and not consistent with the world axis. so, to fix that,
		// put it in a group object and just control the group object! the mesh is also just oriented properly initially when placed in the group.
		let playerAxesHelper = new THREE.AxesHelper(10);
		mesh.add(playerAxesHelper);
		
		mesh.position.set(0, 0, -10);
		scene.add(mesh);
		update();
	}
	renderer.render(scene, camera);
}

function update(){
	requestAnimationFrame(update);
	renderer.render(scene, camera);
}

function invertColor(pixels){
	let d = pixels.data;
	let r, g, b;
	for(let i = 0; i < d.length; i += 4){
		r = d[i];
		g = d[i + 1];
		b = d[i + 2];
		d[i] = 255 - r;
		d[i + 1] = 255 - g;
		d[i + 2] = 255 - b;
	}
	return pixels;
}
document.getElementById('invertColor').addEventListener('click', (evt) => {
	const canvas = document.getElementById('liveryCanvas');
	const ctx = canvas.getContext('2d');
	const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const inverted = invertColor(pixelData);
	ctx.putImageData(inverted, 0, 0);
});

function mosaicFilter(pixels){
	let d = pixels.data;
	let copy = new Uint8ClampedArray(d);
	
	// get dimensions 
	let width = pixels.width;
	let height = pixels.height;
	
	// change sampling size here. lower for higher detail preservation, higher for less detail (because larger chunks)
	let chunkWidth = 10;
	let chunkHeight = 10;

	for(let i = 0; i < width; i += chunkWidth){
		for(let j = 0; j < height; j += chunkHeight){
			// multiply by width because all the image data is in a single array and a row is dependent on width
			let r = copy[4 * i + 4 * j * width];
			let g = copy[4 * i + 4 * j * width + 1];
			let b = copy[4 * i + 4 * j * width + 2];
			// now for all the other pixels in this chunk, set them to this color 
			for(let k = i; k < i + chunkWidth; k++){
				for(let l = j; l < j + chunkHeight; l++){
					d[4 * k + 4 * l * width] = r;
					d[4 * k + 4 * l * width + 1] = g;
					d[4 * k + 4 * l * width + 2] = b;
				}
			}
		}
	}
	
	return pixels;
}
document.getElementById('mosaic').addEventListener('click', (evt) => {
	const canvas = document.getElementById('liveryCanvas');
	const ctx = canvas.getContext('2d');
	const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const mosaic = mosaicFilter(pixelData);
	ctx.putImageData(mosaic, 0, 0);
});


function updateModel(){
	// get image from canvas
	const imageUrl = document.getElementById('liveryCanvas').toDataURL();
	
	// create new texture from it
	const newTexture = textureLoader.load(imageUrl);
	
	// update model with new texture
	const oldTexture = currModel.material.map;
	//console.log(currModel.material);
	//console.log(oldTexture);
	newTexture.flipY = false;
	currModel.material.map = newTexture;
	//currModel.material.needsUpdate = true;
	//oldTexture.dispose();
}
document.getElementById('updateModel').addEventListener('click', (evt) => {
	updateModel();
});

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

camera.position.set(0, 10, 8);
camera.rotateOnAxis(new THREE.Vector3(1,0,0), -Math.PI/8);
scene.add(camera);

// https://discourse.threejs.org/t/solved-glb-model-is-very-dark/6258
let hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
hemiLight.position.set(0, 200, 0);
scene.add(hemiLight);

let dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( 0, 100, -10);
scene.add( dirLight );

getModel('models/f-16.gltf', 'player', 'f16');
update();
