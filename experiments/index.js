
const el = document.getElementById("container");
const fov = 60;
const defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const container = document.querySelector('#container');
const raycaster = new THREE.Raycaster();
const loadingManager = new THREE.LoadingManager();
let animationController;

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(el.clientWidth, el.clientHeight);    
container.appendChild(renderer.domElement);

const camera = defaultCamera;
camera.position.set(0,5,15);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);    
scene.add(camera);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 30, 0);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 2;
pointLight.shadow.camera.far = 100;
pointLight.shadow.camera.fov = 70;
scene.add(pointLight);

/*
const hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);
*/

const clock = new THREE.Clock();
let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;

// create some 'terrain'
const texture = new THREE.TextureLoader().load('texture.png');
const terrainMat = new THREE.MeshPhongMaterial({color: 0xcccddd, specular: 0x009900, shininess: 3, shading: THREE.FlatShading});//new THREE.MeshBasicMaterial({map: texture});
const terrain = new THREE.PlaneGeometry(200, 200, 1);
const plane = new THREE.Mesh(terrain, terrainMat);
plane.position.set(0, -1, 0);
plane.rotateX((3*Math.PI)/2);
plane.receiveShadow = true;
scene.add(plane);

// create the player cube 
const cubeGeometry = new THREE.BoxGeometry(5,5,5);
const material = new THREE.MeshBasicMaterial({color: 0x0000ff});
material.wireframe = true;
const thePlayer = new THREE.Mesh(cubeGeometry, material);
thePlayer.castShadow = true;

const cube2g = new THREE.BoxGeometry(2,2,2);
const mat = new THREE.MeshBasicMaterial({color: 0xff0000});
const cube = new THREE.Mesh(cube2g, mat);
cube.castShadow = true;

thePlayer.add(cube);
cube.position.set(0, 3, 0);

thePlayer.position.set(0, 2, 0);
scene.add(thePlayer);

let bgAxesHelper;

const playerAxesHelper = new THREE.AxesHelper(5);
const playerGroupAxesHelper = new THREE.AxesHelper(5);
const playerCameraAxesHelper = new THREE.AxesHelper(5);

thePlayer.add(playerAxesHelper);
cube.add(playerGroupAxesHelper);

let firstPersonViewOn = false;


function keydown(evt){
  if(evt.keyCode === 49){
    // toggle first-person view
    firstPersonViewOn = !firstPersonViewOn;
    // make sure camera is in the head position
    // and that the camera is parented to the character mesh
    // so that it can rotate with the mesh
    if(firstPersonViewOn){
      thePlayer.add(camera);
            
      //thePlayer.add(cube);
      //cube.position.set(0, 2, 0);
            
      //camera.position.copy(thePlayer.head.position);
      //camera.rotation.copy(thePlayer.rotation);
      camera.rotation.set(0, Math.PI, 0);
      camera.position.set(0, 2, 0);
    }else{
      scene.add(camera);
      //scene.add(cube);
    }
  }
}

document.addEventListener("keydown", keydown);


function update(){
  sec = clock.getDelta();
  moveDistance = 8 * sec;
  rotationAngle = (Math.PI / 2) * sec;
  let changeCameraView = false;
    
  if(keyboard.pressed("z")){
    changeCameraView = true;
  }
    
  if(keyboard.pressed("W")){
    // moving forwards
    thePlayer.translateZ(moveDistance);
        
  }else if(keyboard.pressed("S")){
    // moving backwards
    thePlayer.translateZ(-moveDistance);
  }
    
  if(keyboard.pressed("J")){
    // for jumping
  }
    
  if(keyboard.pressed("A")){
    const axis = new THREE.Vector3(0, 1, 0);
    thePlayer.rotateOnAxis(axis, rotationAngle);
  }
    
  if(keyboard.pressed("D")){
    const axis = new THREE.Vector3(0, 1, 0);
    thePlayer.rotateOnAxis(axis, -rotationAngle);
  }
    
  let relCameraOffset;
    
  if(firstPersonViewOn){
    const newPos = new THREE.Vector3();
    newPos.copy(thePlayer.position);
    newPos.z += 1;
    newPos.y -= 0.5;
    relCameraOffset = newPos;
    //camera.rotation.copy(thePlayer.rotation);
  }else if(!changeCameraView){
    relCameraOffset = new THREE.Vector3(0, 3, -15);
  }else{
    relCameraOffset = new THREE.Vector3(0, 3, 15);
  }
    
  if(!firstPersonViewOn){
    const cameraOffset = relCameraOffset.applyMatrix4(thePlayer.matrixWorld);
    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;
  }
    
  if(!firstPersonViewOn) camera.lookAt(thePlayer.position);

}

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}

animate();
