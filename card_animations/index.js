// card animations demo
const container = document.getElementById('container');

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 0, 0);

// optional stuff
//const keyboard = new THREEx.KeyboardState();
//const raycaster = new THREE.Raycaster();
//const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

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
spotLight.position.set(0, 16, 10);
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

// add a plane
const planeGeometry = new THREE.PlaneGeometry(25, 25);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0x05727a});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 0, -10);
plane.receiveShadow = true;
plane.castShadow = true;
//scene.add(plane);

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

// https://github.com/syncopika/card-game-animations/blob/main/Assets/scripts/CardScript.cs
class Card {
  constructor(mesh, startPos){
    this.cardMesh = mesh; // threejs object3d
    this.isMoving = false;
    this.speed = 8.0;
    this.arcHeight = 0.7;
    this.zRotationAngle = 0; // in radians
    this.startPosition = startPos; // vector3
    this.endPosition = null; // vector3
    this.endRotation = (new THREE.Quaternion()).setFromEuler(new THREE.Euler(0, Math.PI, 0)); // 180 deg (so card is turned faced down at the end)
    this.doFlip = true;
  }
  
  move(){
    const obj = this.cardMesh;
    const startPosition = this.startPosition;
    const endPosition = this.endPosition;
    const arcHeight = this.arcHeight;
    const doFlip = this.doFlip;
    const speed = this.speed;
    
    if(this.isMoving){
      if(obj.position.x < endPosition.x){
        const xDist = Math.abs(endPosition.x - startPosition.x);
        const yDist = Math.abs(endPosition.y - startPosition.y);
        
        // lerp each axis separately
        const nextX = (new THREE.Vector3(obj.position.x, 0, 0)).lerp(new THREE.Vector3(endPosition.x, 0, 0), speed * clock.getDelta()).x; // TODO: probably can just do a scalar lerp here lol
        const nextY = (new THREE.Vector3(0, obj.position.y, 0)).lerp(new THREE.Vector3(0, endPosition.y, 0), speed * clock.getDelta() * (yDist / xDist)).y;
        const baseZ = lerpScalar(obj.position.z, endPosition.z, (nextX - startPosition.x) / xDist); // from lib/utils.js
        const arc = arcHeight * (nextX - startPosition.x) * (nextX - endPosition.x) / (-0.25 * xDist * xDist);
        
        //console.log(`nextX: ${nextX}, nextY: ${nextY}, baseZ: ${baseZ}, arc: ${arc}`);
      
        obj.position.set(nextX, nextY, baseZ + arc);
        
        const xDistCovered = Math.abs(obj.position.x - startPosition.x);
        const endRot = doFlip ? this.endRotation : (new THREE.Quaternion()).setFromEuler(new THREE.Euler(0, 0, (this.zRotationAngle * 180 / Math.PI)));
        const endQuaternion = (new THREE.Quaternion()).slerp(endRot, xDistCovered / xDist);
        
        obj.quaternion.copy(endQuaternion);
      }else{
        obj.position.set(endPosition.x, endPosition.y, endPosition.z);
        this.isMoving = false;
      }
    }
  }
};

let deckIsMoving = false;

const cardDeck = [];
const deckCount = 8;

// load the card model
let cardModel;
getModel('../models/card-template.gltf', 'card').then(obj => {
  cardModel = obj.children[0]; // obj is the scene that holds the actual card mesh
  console.log(cardModel);
  
  // make a deck
  let startZPos = -10;
  for(let i = 0; i < deckCount; i++){
    const newCardMesh = cardModel.clone();
    
    const newPos = new THREE.Vector3(-5, 0, startZPos);
    scene.add(newCardMesh);
    newCardMesh.position.copy(newPos);
    newCardMesh.castShadow = true;
    newCardMesh.rotateX(Math.PI / 2);
    
    const newCard = new Card(newCardMesh, newPos);
    cardDeck.push(newCard);
    
    const axesHelper = new THREE.AxesHelper(2);
    //newCardMesh.add(axesHelper);
    
    startZPos += 0.1;
  }
  
  // https://github.com/syncopika/card-game-animations/blob/main/Assets/scripts/CardAnimations.cs
  // TODO: support different card placements
  // this is just for testing things
  for(let i = deckCount - 1; i >= 0; i--){
    const newEndPos = new THREE.Vector3(5, 0, cardDeck[deckCount - 1 - i].cardMesh.position.z);
    cardDeck[i].endPosition = newEndPos;
  }
  
  //console.log(cardDeck);
});

function update(){
  if(deckIsMoving){
    if(cardDeck.some(c => c.isMoving)){
      cardDeck.forEach(c => c.move());
    }else{
      // reset
      deckIsMoving = false;
      console.log('done moving deck!');
      //cardDeck.forEach(c => c.cardMesh.position.copy(c.startPosition));
    }
  }
  
  //cardDeck.forEach(c => c.cardMesh.rotateY(Math.PI / 300));
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

document.getElementById('flipCards').addEventListener('click', () => {
  if(!deckIsMoving){
    cardDeck.forEach(c => c.cardMesh.position.copy(c.startPosition)); // reset
    console.log('moving deck!');
    deckIsMoving = true;
    cardDeck.forEach(c => c.isMoving = true);
  }
});
