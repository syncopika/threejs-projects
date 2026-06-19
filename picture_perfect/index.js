// picture_perfect
// exploring some basic photography mechanics in an first-person shooter sort of way
//
// check https://github.com/syncopika/threejs-projects/blob/master/fps/index.js
// for logic around moving between 1st and 3rd person camera + crosshairs

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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 70, -8);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// add a plane and a sphere
const planeGeometry = new THREE.PlaneGeometry(25, 25);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0x055C9D});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
scene.add(plane);

const sphereGeometry = new THREE.SphereGeometry(0.9, 32, 16);
const sphereMaterial = new THREE.MeshPhongMaterial({wireframe: true});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.receiveShadow = true;
sphere.castShadow = true;
sphere.position.x = 0;
sphere.position.y = 4;
sphere.position.z = 0;
scene.add(sphere);
sphere.name = "sphere";

const sphereForwardVector = new THREE.Vector3();
sphere.getWorldDirection(sphereForwardVector);

const lineMaterial = new THREE.LineBasicMaterial({color: 0x00ff00});
const linePoints = [];
linePoints.push(new THREE.Vector3(0, 0, 0));
linePoints.push(new THREE.Vector3(sphereForwardVector.x * 2, sphereForwardVector.y * 2, sphereForwardVector.z * 2));

const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
const line = new THREE.Line(lineGeometry, lineMaterial);
sphere.add(line);

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

function determineOrientation(subjectForwardVector){
  // for the purposes of this demo, the camera is always directed along the vector
  // (0, 0, -1) - negative z-axis/screen
  // TODO: we just need to compare the subject (sphere) forward vector with (0, 0, -1)
  // via dot product
  
}

function determineScreenPlace(){
  // TODO: determine where the subject is placed in the screen
  // https://github.com/syncopika/safari_snap/blob/master/Assets/scripts/Snapshot.cs#L64
}

function saveScreenshot(){
  // save renderer frame as image
}

function captureImage(){
  // TODO: capture image, e.g.
  // the state of the subject at the moment of photograph
  // forward vector, distance, etc.
  // also actually capture image pixels and store it somewhere
  const snapshot = {
    targetName: '',
    distanceAway: '',
    screenPlacement: '',
    orientation: '',
    subjectState: '',
    screenshot: '',
  };
  
  return snapshot;
}

function update(){
  // move stuff around, etc.
  sphere.rotateY(Math.PI / 250);
  sphere.translateX(2.3 * (Math.PI / 300));
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