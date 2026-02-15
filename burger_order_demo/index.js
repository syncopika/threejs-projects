// burger order demo
// TODO: add fries, onion rings?, drink
// make a nicer UI or screen thingy to take user's order? :D

const container = document.getElementById('container');

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 4, 10);

// optional stuff
//const keyboard = new THREEx.KeyboardState();
//const raycaster = new THREE.Raycaster();
//const mouse = new THREE.Vector2();
//const clock = new THREE.Clock();

const loadingManager = new THREE.LoadingManager();
setupLoadingManager(loadingManager);

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

/* set up trackball control if needed
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 3.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
*/

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 0, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
//scene.add(spotLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 10, 20);
pointLight.castShadow = true;
scene.add(pointLight);

const hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 0, 0);
//scene.add(hemiLight);

function getModel(modelFilePath){
  return new Promise((resolve) => {
    loader.load(
      modelFilePath,
      function(gltf){
        resolve(gltf.scene);
      },
      // called while loading is progressing
      function(xhr){
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      // called when loading has errors
      function(error){
        console.log('An error happened');
        console.log(error);
      }
    );
  });
}

const loadedModels = [];
loadedModels.push(getModel('../models/burger.gltf'));

let burger = null;

const burgerComponents = {
  'patty': null,
  'cheese': null,
  'lettuce': null,
  'tomato': null,
  'onion': null,
  'bunTop': null,
  'bunBottom': null,
};

Promise.all(loadedModels).then((objects) => {
  objects.forEach((mesh) => {
    //console.log(mesh);
    burger = mesh;
    mesh.children.forEach(c => {
      //console.log(c);
      if(c.name === 'Plane003'){
        burgerComponents.lettuce = c;
      }else if(c.name === 'Cylinder010'){
        burgerComponents.bunTop = c;
      }else if(c.name === 'Cylinder012'){
        burgerComponents.onion = c;
      }else if(c.name === 'Cylinder013'){
        burgerComponents.tomato = c;
      }else if(c.name === 'Cube058'){
        burgerComponents.cheese = c;
      }else if(c.name === 'Cube056'){
        burgerComponents.patty = c;
      }else{
        burgerComponents.bunBottom = c;
      }
    });
    mesh.translateY(3);
    mesh.translateZ(5);
    scene.add(mesh);
    console.log(burgerComponents);
  });
});

// TODO: have an object keep track of burger order and components
// TODO: use speech
function receiveOrder(){
}

// TODO: based on order, create the burger and put it in the scene
function assembleBurgerAccordingToOrder(){
}


// this is just for simple testing with speech recognition
function test(){
  const recognition = new SpeechRecognition();
  recognition.continuous = false; // true
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  recognition.start();
  
  recognition.onresult = function(evt){
    console.log(evt);
    
    const textDisplay = document.getElementById('textDisplay');
    while(textDisplay.firstChild){
      textDisplay.removeChild(textDisplay.firstChild);
    }
    
    let detectedSpeechSoFar = '';
    const results = evt.results;
    for(let result of results){
      const detectedSpeech = result[0].transcript;
      const confidence = result[0].confidence;
      const newText = document.createElement('p');
      newText.textContent = `result: ${detectedSpeech}, confidence: ${confidence}`;
      
      textDisplay.appendChild(newText);
      
      if(newText.textContent.toLowerCase().includes('burger')){
        // if speech included 'burger', add a new burger to the scene
        console.log('adding a new burger because it was requested');
        if(burger){
          const newBurger = burger.clone(true);
          scene.add(newBurger);
          newBurger.rotation.x = Math.random() * 2 * Math.PI;
          newBurger.rotation.y = Math.random() * 2 * Math.PI;
          newBurger.rotation.z = Math.random() * 2 * Math.PI;
          
          newBurger.position.x = -10 + (Math.random() * 10);
          newBurger.position.y = -10 + (Math.random() * 10);
          newBurger.position.z = -20 + (Math.random() * -20);
        }
      }
    };
  };
  
  recognition.onspeechend = function(){
    console.log('stopping recognition');
    document.getElementById('speechDetectionStatus').textContent = 'no longer accepting audio for recognition';
    //recognition.stop();
  };
  
  recognition.onnomatch = function(evt){
    console.log('no match');
  };
  
  recognition.onerror = function(evt){
    console.log('error: ' + evt.error);
  };
}
document.getElementById('test').addEventListener('click', () => test());

function update(){
  // move stuff around, etc.
  if(burger) burger.rotateY(Math.PI / 200);
}

function keydown(evt){
  if(evt.keyCode === 32){
    // spacebar
  }else if(evt.keyCode === 49){
    //1 key
  }else if(evt.keyCode === 50){
    //2 key
  }else if(evt.keyCode === 82){
    // r key
  }
}
document.addEventListener('keydown', keydown);


function animate(){
  //controls.update(); // update trackball control
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}

animate();