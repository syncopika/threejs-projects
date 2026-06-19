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
const raycaster = new THREE.Raycaster();
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

const maxSnapshots = 5;
let remainingSnapshots = maxSnapshots;
updateSnapshotCountUI(remainingSnapshots);

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

function getForwardVector(mesh){
  const meshForwardVector = new THREE.Vector3();
  mesh.getWorldDirection(meshForwardVector);
  return meshForwardVector;
}

// https://github.com/syncopika/safari_snap/blob/master/Assets/scripts/Snapshot.cs#L46
function determineOrientation(target){
  // for the purposes of this demo, the camera is always directed along the vector
  // (0, 0, -1) - negative z-axis/screen
  // TODO: we just need to compare the subject (sphere) forward vector with (0, 0, -1) via dot product
  const currTargetForward = getForwardVector(target);
  const cameraForward = new THREE.Vector3(0, 0, -1);
  const dotProduct = cameraForward.dot(currTargetForward);
  return dotProduct;  
}

function determineDistance(target){
  const dist = camera.position.distanceTo(target.position);
  return dist;
}

function determineScreenPlace(){
  // TODO: determine where the subject is placed in the screen
  // https://github.com/syncopika/safari_snap/blob/master/Assets/scripts/Snapshot.cs#L64
}

function saveScreenshot(){
  // save renderer frame as image
}

function updateSnapshotCountUI(remaining){
  document.getElementById('snapshotCounter').textContent = `${remaining} snapshots remaining`;
}

// https://github.com/syncopika/safari_snap/blob/master/Assets/scripts/CameraScript.cs#L40
function captureImage(){
  if(remainingSnapshots === 0){
    console.log('out of snapshots');
    return;
  }else{
    remainingSnapshots--;
    updateSnapshotCountUI(remainingSnapshots);
  }
  
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
  
  raycaster.set(camera.position, new THREE.Vector3(0, 0, -1));
  const intersections = raycaster.intersectObjects(scene.children, true);
  const targets = intersections.filter(i => i.object.type === 'Mesh');
  
  if(targets.length === 0){
    console.log('no hits!');
    return null;
  }
  
  // just take the first hit
  const hit = targets[0].object;
  console.log(hit);
  
  const targetName = hit.name;
  snapshot.targetName = targetName;
  
  // get distance of target
  // TODO: need to take into account camera field-of-view
  snapshot.distanceAway = determineDistance(hit);
  
  // get orientation of target
  snapshot.orientation = determineOrientation(hit);
  
  return snapshot;
}

function analyzeSnapshot(){
}

function updateSnapshotResults(snapshot){
  const container = document.getElementById('snapshotResults');
  
  const newResult = document.createElement('div');
  newResult.style.borderBottom = '1px solid #ccc';
  
  const name = document.createElement('p');
  name.textContent = `name: ${snapshot.targetName}`;
  
  const dist = document.createElement('p');
  dist.textContent = `distance away: ${snapshot.distanceAway}`;
  
  const orientation = document.createElement('p');
  orientation.textContent = `orientation: ${snapshot.orientation}`;
  
  newResult.appendChild(name);
  newResult.appendChild(dist);
  newResult.appendChild(orientation);
  
  container.appendChild(newResult);
}

function update(){
  // move stuff around, etc.
  sphere.rotateY(Math.PI / 250);
  sphere.translateX(2.3 * (Math.PI / 300));
}

function keydown(evt){
  if(evt.keyCode === 32){
    // spacebar
    console.log('capturing photo!');
    
    // TODO: simulate a quick camera flash
    setTimeout(() => {
      // change back to normal
    }, 500);
    
    const photo = captureImage();
    console.log(photo);
    
    // TODO: analyze snapshot and show results in UI
    
    if(photo) updateSnapshotResults(photo);
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