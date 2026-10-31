// card animations demo
const container = document.getElementById('container');

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 10, 0);
camera.rotateX(-Math.PI / 2);

// optional stuff
//const keyboard = new THREEx.KeyboardState();
//const raycaster = new THREE.Raycaster();
//const mouse = new THREE.Vector2();
//const clock = new THREE.Clock();

/* set up trackball control if needed
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 3.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
*/

const loadingManager = new THREE.LoadingManager();
setupLoadingManager(loadingManager);

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 70, -8);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

//const pointLight = new THREE.PointLight(0xffffff, 1, 0);
//pointLight.position.set(2, 10, 2);
//pointLight.castShadow = true;
//scene.add(pointLight);

//const hemiLight = new THREE.HemisphereLight(0xffffff);
//hemiLight.position.set(0, 10, 0);
//scene.add(hemiLight);

// add a plane and a sphere
const planeGeometry = new THREE.PlaneGeometry(25, 25);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0x05727a});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
scene.add(plane);

const sphereGeometry = new THREE.SphereGeometry(0.9, 32, 16);
const sphereMaterial = new THREE.MeshPhongMaterial();
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.receiveShadow = true;
sphere.castShadow = true;
sphere.position.x = 0;
sphere.position.y = 4;
sphere.position.z = 0;
//scene.add(sphere);

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

const cardDeck = [];
const deckCount = 8;

// load the card model
let cardModel;
getModel('../models/card-template.gltf', 'card').then(obj => {
  cardModel = obj.children[0]; // obj is the scene that holds the actual card mesh
  console.log(cardModel);
  
  // make a deck
  let startYPos = -1;
  for(let i = 1; i < deckCount; i++){
    const newCard = cardModel.clone();
    scene.add(newCard);
    newCard.castShadow = true;
    newCard.rotateZ(-Math.PI / 2);
    newCard.translateY(startYPos);
    newCard.translateX(3);
    cardDeck.push(newCard);
    startYPos -= 0.1; // yes, we're subtracting and it's weird lol. TODO: I need figure out how to set things up more sensibly so rotations and translations are more intuitive.
  }
});

function update(){
  // move stuff around, etc.
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