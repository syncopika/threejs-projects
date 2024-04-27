const container = document.getElementById("container");
const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(1,5,5);

const keyboard = new THREEx.KeyboardState();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const loadingManager = new THREE.LoadingManager();
const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

const fontLoader = new THREE.FontLoader();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.add(camera);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 22, 3);
scene.add(pointLight);

const hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const clock = new THREE.Clock();

// neon glow effect stuff (Bloom effect)
const renderScene = new THREE.RenderPass(scene, camera);
const effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
effectFXAA.uniforms['resolution'].value.set(1/container.clientWidth, 1/container.clientHeight);

const copyShader = new THREE.ShaderPass(THREE.CopyShader);
copyShader.renderToScreen = true;

const bloomPass = new THREE.UnrealBloomPass(
  new THREE.Vector2(container.clientWidth, container.clientHeight),
  0.7,//0.25, // bloom strength
  0,//0.1, // bloom radius
  0.6, // bloom threshold
);

const composer = new THREE.EffectComposer(renderer);
composer.setSize(container.clientWidth, container.clientHeight);
composer.addPass(renderScene);
composer.addPass(effectFXAA);
composer.addPass(bloomPass);
composer.addPass(copyShader);


let keysEntered = "";
let currScreenText = null;
let vendingMachine;
let vendingMachineColor;
let vendingMachineNoColor;
let keys;
let animationHandler;
let animationHandlerColor;
let animationHandlerNoColor;
let textFont;
let rotateMachine = false;
let bloomOn = false;
let colorOn = false;

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
            
      if(currScreenText) setTimeout(() => {vendingMachine.remove(currScreenText);}, 1500); // reset display screen text after a delay
      keysEntered = "";
    }
  }
});


document.getElementById("rotate").addEventListener("click", (evt) => {
  rotateMachine = !rotateMachine;
  if(rotateMachine){
    evt.target.textContent = "stop rotation";
  }else{
    evt.target.textContent = "rotate";
  }
});

document.getElementById("toggleBloom").addEventListener("click", (evt) => {
  bloomOn = !bloomOn;
  if(bloomOn){
    evt.target.textContent = "bloom off";
  }else{
    evt.target.textContent = "bloom on";
  }
});

document.getElementById("switchMachine").addEventListener("click", (evt) => {
  if(colorOn){
    if(bloomOn){
      document.getElementById("toggleBloom").click();
    }
    showRegularVendingMachine();
    evt.target.textContent = "show color";
  }else{
    showNeonVendingMachine();
    evt.target.textContent = "no color";
  }
  colorOn = !colorOn;
});

function showRegularVendingMachine(){
  scene.remove(vendingMachine);
  scene.background = new THREE.Color(0xffffff);
  scene.add(vendingMachineNoColor);
  vendingMachine = vendingMachineNoColor;
  animationHandler = animationHandlerNoColor;
}

function showNeonVendingMachine(){
  scene.remove(vendingMachine);
  scene.background = new THREE.Color(0x000000);
  scene.add(vendingMachineColor);
  vendingMachine = vendingMachineColor;
  animationHandler = animationHandlerColor;
}


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
  };
}

// // https://stackoverflow.com/questions/38368135/how-to-include-typeface-json-font-file-in-three-js
function displayTextOnScreen(textToDisplay){
  if(textFont){
    if(currScreenText) vendingMachine.remove(currScreenText);
        
    const geometry = new THREE.TextGeometry(textToDisplay, {
      size: 0.05,
      height: 0.005,
      curveSegments: 6,
      font: textFont,
    });
        
    const color = new THREE.Color();
    color.setRGB(0,0,0);
        
    const material = new THREE.MeshBasicMaterial({color});
        
    currScreenText = new THREE.Mesh(geometry, material);
        
    vendingMachine.add(currScreenText);
        
    currScreenText.scale.x = -1; // characters are getting mirrored when clicking the vending machine buttons but this seems to help
    // got the idea here: https://stackoverflow.com/questions/25909107/threejs-texture-reversed
    currScreenText.position.x = -0.18;
    currScreenText.position.y = 1.1;
    currScreenText.position.z = -0.105;
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

function setVendingMachine(obj){
  obj.position.x += 1;
  obj.position.y += 0.5;
  obj.position.z -= 0.5;
  obj.rotation.y = Math.PI;
  obj.scale.x *= 5;
  obj.scale.y *= 5;
  obj.scale.z *= 5;
}

getModel('../models/vending-machine.gltf').then(data => {
  vendingMachineNoColor = data.scene;
  animationHandlerNoColor = new AnimationHandler(vendingMachineNoColor, data.animations);
  animationHandler = animationHandlerNoColor;
    
  // keep track of the buttons of the vending machine
  keys = data.scene.children.filter(x => x.name === "display")[0].children.filter(x => x.name.indexOf('key') > 0);
    
  // load font for displaying text
  fontLoader.load("helvetiker_bold.typeface.json", (tex) => {
    textFont = tex;
        
    setVendingMachine(vendingMachineNoColor);
        
    vendingMachine = vendingMachineNoColor;
    scene.add(vendingMachineNoColor);
        
    // load in the regular vending machine
    // wish I could just change the texture of the neon one but
    // kinda complicated atm since the machine is in parts
    getModel('../models/vending-machine-color.gltf').then(data => {
      const obj = data.scene;
            
      vendingMachineColor = obj;
      animationHandlerColor = new AnimationHandler(obj, data.animations);
    
      setVendingMachine(obj);
    });
  });
});

// add keyboard key bindings if you want
/* function keydown(evt){
    if(evt.keyCode === 49){
    }
}
document.addEventListener("keydown", keydown); 
*/

// allow zoom-in/zoom-out with mouse clickwheel
function zoom(event){
  event.preventDefault(); // prevent screen scroll
  camera.position.z += event.deltaY * 0.01;
}
renderer.domElement.onwheel = zoom;

function update(){
  if(vendingMachine){
    const sec = clock.getDelta();
    const rotationAngle = (Math.PI / 2) * sec;
        
    if(rotateMachine){
      vendingMachine.rotateOnAxis(new THREE.Vector3(0,1,0), rotationAngle/4);
    }
        
    animationHandler.mixer.update(sec);
  }
}

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  if(bloomOn) composer.render();
  update();
}

animate();