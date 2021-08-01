const el = document.getElementById("container");
const fov = 60;
const defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const container = document.querySelector('#container');

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const loadingManager = new THREE.LoadingManager();
const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(el.clientWidth, el.clientHeight);	
container.appendChild(renderer.domElement);

const fontLoader = new THREE.FontLoader();

let keysEntered = "";
let currScreenText = null;
renderer.domElement.addEventListener('mousedown', (evt) => {
	mouse.x = (evt.offsetX / evt.target.width) * 2 - 1;
	mouse.y = -(evt.offsetY / evt.target.height) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	
	const intersects = raycaster.intersectObjects(scene.children, true); // make sure it's recursive
	//console.log(intersects);
	
	const gotBox = intersects.filter(x => x.object.name === "box1");
	
	// allow box pickup when in pick-up area
	if(gotBox.length === 1 && gotBox[0].point.y < 2.5){
		// do something with box
		console.log("picked up box");
		
		// reset action
		animationHandler.currentAction.stop();
	}
	
	// we want to pick up only raycasts that hit any of the black buttons on the right panel of the machine
	const targets = intersects.filter(x => x.object.name.indexOf("key") > 0); // each key is a cube so the ray will hit the front and back faces leaving us with 2 targets (but same object)
	
	if(targets.length > 0){
		const keyPressed = targets[0].object;
		
		switch(keyPressed.name){
			case "A-key":
				animationHandler.playClipName("A-key-press");
				break;
			case "B-key":
				animationHandler.playClipName("B-key-press");
				break;
			case "C-Key":
				animationHandler.playClipName("C-key-press");
				break;
			case "D-Key":
				animationHandler.playClipName("D-key-press");
				break;
			case "E-key":
				animationHandler.playClipName("E-key-press");
				break;
			case "1-key":
				animationHandler.playClipName("1-key-press");
				break;
			case "2-key":
				animationHandler.playClipName("2-key-press");
				break;
			case "3-key":
				animationHandler.playClipName("3-key-press");
				break;
		}
		
		keysEntered += keyPressed.name[0];
		
		// display keys entered as text on the display panel https://stackoverflow.com/questions/15248872/dynamically-create-2d-text-in-three-js
		displayTextOnScreen(keysEntered);
		
		if(keysEntered.length === 2){
			console.log("code " + keysEntered + " was entered!");
			// then check format. should be 1 letter followed by 1 number e.g. A1, A2 or A3 - use regex
			// match combination with corresponding coil in machine. call the animation for that
			// if A1 was entered, run the animation for dropping the box and depositing it in the drop area
			if(keysEntered === "A1"){
				animationHandler.playClipName("rotation", false);
				animationHandler.playClipName("box-drop-1", true);
			}
			
			if(currScreenText) setTimeout(() => {scene.remove(currScreenText)}, 1500); // reset display screen text after a delay
			keysEntered = "";
		}
	}
});

const camera = defaultCamera;
camera.position.set(1,5,5);

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


function AnimationHandler(mesh, animations){
	this.mixer = new THREE.AnimationMixer(mesh);
	this.anim = animations;
	this.currentAction = null;
	
	this.playClipName = function(name, pauseBool){
		const clip = THREE.AnimationClip.findByName(this.anim, name);
		const action = this.mixer.clipAction(clip);
		action.loop = THREE.LoopOnce;
		
		this.currentAction = action;
		
		// stop at last frame
		if(pauseBool) action.clampWhenFinished = true;
		
		action.play();
		action.reset();
	}
}

// // https://stackoverflow.com/questions/38368135/how-to-include-typeface-json-font-file-in-three-js
function displayTextOnScreen(textToDisplay){
	if(textFont){
		if(currScreenText) scene.remove(currScreenText);
		
		const geometry = new THREE.TextGeometry(textToDisplay, {
			size: 0.2,
			height: 0.01,
			curveSegments: 6,
			font: textFont,
		});
		
		const color = new THREE.Color();
		color.setRGB(0,0,0);
		
		const material = new THREE.MeshBasicMaterial({color});
		
		currScreenText = new THREE.Mesh(geometry, material);
		
		currScreenText.position.x = 1.8;
		currScreenText.position.y = 5.8;
		currScreenText.position.z = 1;
		
		scene.add(currScreenText);
	}
}

// add the vending machine
function getModel(modelFilePath, side, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			function(gltf){
				resolve({
					'scene': gltf.scene,
					'animations': gltf.animations,
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

let vendingMachine;
let keys;
let animationHandler;
let textFont;
getModel('vending-machine.gltf').then((data) => {
	const obj = data.scene;
	const anim = data.animations;
	
	// keep track of animations
	animationHandler = new AnimationHandler(obj, anim);
	
	// keep track of the buttons of the vending machine
	keys = obj.children.filter(x => x.name === "display")[0].children.filter(x => x.name.indexOf('key') > 0);
	
	// load font for displaying text
	fontLoader.load("helvetiker_bold.typeface.json", (tex) => {
		textFont = tex;
		
		// place vending machine
		obj.position.x += 1;
		obj.position.y += 0.5;
		obj.position.z -= 0.5;
		obj.rotation.y = Math.PI;
		obj.scale.x *= 5;
		obj.scale.y *= 5;
		obj.scale.z *= 5;
		
		vendingMachine = obj;
		scene.add(obj);
	});
});

/* function keydown(evt){
	if(evt.keyCode === 49){
	}
}
document.addEventListener("keydown", keydown); */


function update(){
	if(vendingMachine){
		let sec = clock.getDelta();
		let rotationAngle = (Math.PI / 2) * sec;
		//vendingMachine.rotateOnAxis(new THREE.Vector3(0,1,0), rotationAngle/4);
		
		animationHandler.mixer.update(sec);
	}
}

function animate(){
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	update();
}

animate();