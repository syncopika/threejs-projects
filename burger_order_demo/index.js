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

let rotate = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 0, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
//scene.add(spotLight);

const pointLight = new THREE.PointLight(0xffffff, 4, 0);
pointLight.position.set(0, 10, 30);
pointLight.castShadow = true;
scene.add(pointLight);

const hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 0, 0);
//scene.add(hemiLight);

function getModel(modelFilePath, name){
  return new Promise((resolve) => {
    loader.load(
      modelFilePath,
      function(gltf){
        gltf.scene.name = name;
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
loadedModels.push(getModel('../models/burger.gltf', 'burger'));
loadedModels.push(getModel('../models/fries.gltf', 'fries'));
loadedModels.push(getModel('../models/drink.gltf', 'drink'));
loadedModels.push(getModel('../models/tray.gltf', 'tray'));

let burger = null;
let fries = null;
let drink = null;
let tray = null;

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
    if(mesh.name === 'burger'){
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
      console.log(burgerComponents);
    }else if(mesh.name === 'fries'){
      fries = mesh;
      fries.rotateY(Math.PI);
    }else if(mesh.name === 'drink'){
      drink = mesh;
    }else if(mesh.name === 'tray'){
      tray = mesh;
    }
  });
});

// TODO: use speech
/*
order ideas
prompt: What would you like to order?
options: burger, fries, drink, meal

prompt: (if meal) what size would you like your meal?
options: small, normal, large  -> small = 0.7 scale, normal = 1.0 scale, large = 1.5 scale

prompt: (if meal or burger) how would you like your burger?
options: normal, no bread, no lettuce, no cheese, no tomatoes, no onions, extra cheese, extra lettuce, extra tomatoes, extra onions
*/
function receiveOrder(){}

function assembleBurgerAccordingToOrder(){
  const numPatty = 1;
  const numCheese = 2;
  const numTomato = 2;
  const numOnion = 1;
  const numLettuce = 2;
  const numBuns = 1;
  
  const components = {
    bunBottom: {mesh: burgerComponents.bunBottom, count: numBuns, thickness: 0.23, offset: 0},
    patty: {mesh: burgerComponents.patty, count: numPatty, thickness: 0.15, offset: 0},
    lettuce: {mesh: burgerComponents.lettuce, count: numLettuce, thickness: 0.01, offset: 0},
    cheese: {mesh: burgerComponents.cheese, count: numCheese, thickness: 0.04, offset: 0},
    tomato: {mesh: burgerComponents.tomato, count: numTomato, thickness: 0.01, offset: 0},
    onion: {mesh: burgerComponents.onion, count: numOnion, thickness: 0.01, offset: 0},
    bunTop: {mesh: burgerComponents.bunTop, count: numBuns, thickness: 0.2, offset: 0.25},
  };
  
  const newBurger = new THREE.Group();
  
  let currY = 0;
  for(let component in components){
    const mesh = components[component].mesh;
    const count = components[component].count;
    const meshPos = mesh.position;
    const thickness = components[component].thickness;
    const offset = components[component].offset;
    
    for(let i = 0; i < count; i++){
      const meshCopy = mesh.clone();
      meshCopy.position.set(meshPos.x, currY + offset, meshPos.z); 
      meshCopy.rotateY(Math.random() * 3);
      newBurger.add(meshCopy);
      currY += thickness;
    }
  }
  
  newBurger.translateY(0.1);
  
  console.log(newBurger);
  
  return newBurger;
}

function adjustMeshSize(mesh, size){
  //console.log('size: ' + size);
  if(size === 'small'){
    mesh.scale.set(0.7, 0.7, 0.7);
  }else if(size === 'normal'){
    mesh.scale.set(1.0, 1.0, 1.0);
  }else{
    mesh.scale.set(1.5, 1.5, 1.5);
  }
}

// TODO: depending on what's order, figure out placement of things
// if only one item ordered, place in middle of tray
function assembleOrder(order, size){
  // make a new group
  const orderGroup = new THREE.Group();
  
  // add a tray
  orderGroup.add(tray.clone());
  
  // optional: add drink
  if(order.includes('drink') || order.includes('meal')){
    const drinkMesh = drink.clone();
    orderGroup.add(drinkMesh);
    drinkMesh.translateX(1.8);
    drinkMesh.translateY(0.08);
    adjustMeshSize(drinkMesh, size);
  }
  
  // optional: add fries
  if(order.includes('fries') || order.includes('meal')){
    const friesMesh = fries.clone();
    orderGroup.add(friesMesh);
    friesMesh.translateX(1.8);
    adjustMeshSize(friesMesh, size);
  }
  
  // optional: add burger
  if(order.includes('burger') || order.includes('meal')){
    const burger = assembleBurgerAccordingToOrder();
    adjustMeshSize(burger, size);
    orderGroup.add(burger);
  }
  
  orderGroup.translateY(3.2);
  orderGroup.translateZ(5);
  
  // clear the scene first
  scene.children.forEach(c => {
    if(c.type === 'Group'){
      scene.remove(c);
    }
  });
  
  scene.add(orderGroup);
}

// TODO: have order be read back + prompts be read by synthetic voice?
const prompt1 = 'hello, what would you like to order? your options are: burger, fries, drink, meal';
const prompt2 = 'what size would you like that in? your options are: small, normal or large';
const prompt3 = 'your order is ready. enjoy and have a nice day! :D';

function orderWithVoice(){
  console.log('ordering with voice');
  
  const orderLog = document.getElementById('orderLog');
  
  let currPromptNum = 1;
  let order = '';
  let orderSize = 'normal';
  
  function addToOrderLog(string, bold){
    const newp = document.createElement('p');
    newp.style.fontFamily = 'arial';
    if(bold){
      newp.style.fontWeight = 'bold';
    }
    newp.textContent = string;
    orderLog.appendChild(newp);
  }
  
  function clearOrderLog(){
    while(orderLog.children.length > 0){
      for(let child of orderLog.children){
        //console.log('removing child');
        child.parentNode.removeChild(child);
      }
    }
  }
  
  clearOrderLog();
 
  currPromptNum = 1;
  addToOrderLog(prompt1, true);
  
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  recognition.onresult = (evt) => {
    console.log(evt);
    
    const textDisplay = document.getElementById('textDisplay');
    while(textDisplay.firstChild){
      textDisplay.removeChild(textDisplay.firstChild);
    }
    
    let detectedSpeechSoFar = '';
    const results = evt.results;
    console.log(results);
    
    if(results.length > 0){
      const detectedSpeech = results[currPromptNum-1][0].transcript;
      const confidence = results[currPromptNum-1][0].confidence;
      
      const newText = document.createElement('p');
      newText.textContent = `result: ${detectedSpeech}, confidence: ${confidence}`;  
      textDisplay.appendChild(newText);
      
      if(currPromptNum === 1){
        order = detectedSpeech.toLowerCase().trim();
        currPromptNum++;
        addToOrderLog(`you've requested: ${order}`);
        addToOrderLog(prompt2, true);
      }else if(currPromptNum === 2){
        const requestedSize = detectedSpeech;
        if(detectedSpeech.includes('small')){
          orderSize = 'small';
        }else if(detectedSpeech.includes('large')){
          orderSize = 'large';
        }
        
        addToOrderLog(`you've ordered ${order}, ${orderSize} sized. your order should be ready soon!`);
        
        // create order
        assembleOrder(order, orderSize);
        
        // we're done
        addToOrderLog(prompt3, true);
        
        recognition.stop();
      }else if(currPromptNum === 3){
        // TODO: ask about burger customizations
      }
    };
  };
  
  recognition.onspeechend = () => {
    console.log('stopping recognition');
    document.getElementById('speechDetectionStatus').textContent = 'no longer accepting audio for recognition';
    recognition.stop();
  };
  
  recognition.onnomatch = (evt) => {
    console.log('no match');
  };
  
  recognition.onerror = (evt) => {
    console.log('error: ' + evt.error);
  };
  
  recognition.start();
}

function orderWithoutVoice(){
  // prompt for order
  const orderPrompt = prompt('hello, what would you like to order? your options are: burger, fries, drink, meal');
  
  if(orderPrompt){
    let size = 'normal';
    if(orderPrompt.includes('meal')){
      const sizePrompt = prompt('and what size would you like? your options are: small, normal, large');
      if(sizePrompt) size = sizePrompt;
    }
    
    assembleOrder(orderPrompt, size);
  }
  
  alert('your order is ready. enjoy and have a nice day!');
}

// this is just for simple testing with speech recognition
function test(){
  const recognition = new SpeechRecognition();
  recognition.continuous = false; // true
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  recognition.start();
  
  recognition.onresult = (evt) => {
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
  
  recognition.onspeechend = () => {
    console.log('stopping recognition');
    document.getElementById('speechDetectionStatus').textContent = 'no longer accepting audio for recognition';
    //recognition.stop();
  };
  
  recognition.onnomatch = (evt) => {
    console.log('no match');
  };
  
  recognition.onerror = (evt) => {
    console.log('error: ' + evt.error);
  };
}
//document.getElementById('test').addEventListener('click', () => test());

document.getElementById('test2').addEventListener('click', () => assembleOrder('meal', 'normal'));

document.getElementById('rotate').addEventListener('click', () => rotate = !rotate);

document.getElementById('orderWithoutVoice').addEventListener('click', () => orderWithoutVoice());

document.getElementById('orderWithVoice').addEventListener('click', () => orderWithVoice());

function update(){
  // move stuff around, etc.
  if(scene && rotate){
    scene.children.forEach(c => {
      if(c.type === 'Group'){
        c.rotateY(Math.PI / 200);
      }
    });
  }
}

function animate(){
  //controls.update(); // update trackball control
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}

animate();