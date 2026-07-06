// https://sbcode.net/threejs/physics-cannonjs/
// https://github.com/schteppe/cannon.js/tree/master/tools/threejs

const container = document.getElementById('container');
//const keyboard = new THREEx.KeyboardState();

// set up mobile keyboard
document.getElementById('showKeyboard').addEventListener('click', () => {
  new JSKeyboard(document.getElementById('mobileKeyboard'));
});

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(-30, 16, 0);
camera.rotateY(-Math.PI / 2);
camera.rotateX(-Math.PI / 8);
const camRotation = new THREE.Quaternion();
camera.getWorldQuaternion(camRotation);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 70, -8);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);

const planeGeometry = new THREE.PlaneGeometry(60, 60);
const material = new THREE.MeshLambertMaterial({color: 0x088c9d});
const plane = new THREE.Mesh(planeGeometry, material);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
scene.add(plane);

const planeShape = new CANNON.Plane();
const groundMat = new CANNON.Material();
const planeBody = new CANNON.Body({material: groundMat, mass: 0}); // this plane extends infinitely
planeBody.addShape(planeShape);
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(planeBody);

const dominoCannonMat = new CANNON.Material();
const sphereMat = new CANNON.Material();

const ball = createSphere(0, 36, -1, 1);
const sphereMesh = ball.mesh;
const sphereBody = ball.body;
sphereBody.name = 'initialBall;1';

// use a variable to track objects in the path of the rube goldberg device that we're interested in having the camera focus on.
// use the cannon body of the mesh for tracking
let currObjectToFocusOn = sphereBody;

// rube goldberg things
const dominoes = [];

// specify contact between dominoes
const dominoContactMat = new CANNON.ContactMaterial(dominoCannonMat, dominoCannonMat, {friction: 0.2,  restitution: 0.1});
world.addContactMaterial(dominoContactMat)

// specify contact mat between sphere and domino
const dominoSphereContactMat = new CANNON.ContactMaterial(dominoCannonMat, sphereMat, {friction: 0.0,  restitution: 0.01});
world.addContactMaterial(dominoSphereContactMat);

function createSphere(x, y, z, radius=0.9){
  const sphereGeometry = new THREE.SphereGeometry(radius, 32, 16);
  const normalMaterial = new THREE.MeshPhongMaterial();
  const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
  sphereMesh.receiveShadow = true;
  sphereMesh.castShadow = true;
  sphereMesh.position.set(x, y, z);
  scene.add(sphereMesh);
  sphereMesh.name = 'sphere';

  const sphereShape = new CANNON.Sphere(radius);
  const sphereBody = new CANNON.Body({material: sphereMat, mass: 1.5});
  sphereBody.addShape(sphereShape);
  sphereBody.position.copy(sphereMesh.position);
  world.addBody(sphereBody);
  
  return {mesh: sphereMesh, body: sphereBody};
}

function createDomino(xPos, yPos, zPos, name){
  const width = 1.0;
  const height = 2.2;
  const depth = 0.3;
  
  const dominoGeometry = new THREE.BoxGeometry(width, height, depth);
  const dominoMat = new THREE.MeshPhongMaterial({color: 0xcccccc});
  const dominoMesh = new THREE.Mesh(dominoGeometry, dominoMat);
  dominoMesh.castShadow = true;
  dominoMesh.receiveShadow = true;
  dominoMesh.position.set(xPos, yPos, zPos);
  scene.add(dominoMesh);

  const dominoCannonShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
  const dominoCannonMat = new CANNON.Material();
  const dominoCannonBody = new CANNON.Body({material: dominoCannonMat, mass: 0.2});
  
  dominoCannonBody.name = name;
  
  dominoCannonBody.addEventListener('collide', (evt) => {
    if(evt.body.name){
      if(parseInt(evt.body.name.split(';')[1]) === parseInt(dominoCannonBody.name.split(';')[1]) - 1){
        currObjectToFocusOn = dominoCannonBody;
      }
    }
  });
  
  dominoCannonBody.position.copy(dominoMesh.position);
  dominoCannonBody.addShape(dominoCannonShape);
  world.addBody(dominoCannonBody);
  
  return {mesh: dominoMesh, cannonBody: dominoCannonBody};
}

// boxDim, cannonBoxDim = vector3 for width, height, depth
function createBox(boxDim, color, mass){
  const boxGeo = new THREE.BoxGeometry(boxDim.x, boxDim.y, boxDim.z);
  const boxMat = new THREE.MeshPhongMaterial({color});
  const boxMesh = new THREE.Mesh(boxGeo, boxMat);
  
  // divide dimensions by 2 because cannon.js uses half-extents
  const cannonBox = new CANNON.Box(new CANNON.Vec3(boxDim.x / 2, boxDim.y / 2, boxDim.z / 2));
  const cannonMat = new CANNON.Material();
  const cannonBody = new CANNON.Body({material: cannonMat, mass});
  cannonBody.addShape(cannonBox);
  
  return {mesh: boxMesh, cannonBody};
}

function placeAndRotateMesh(mesh, cannonBody, pos, rotAxis, rotAngle, scene, world){
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  if(pos){
    mesh.position.copy(pos);
  }
  
  if(rotAxis && rotAngle){
    mesh.rotateOnAxis(rotAxis, rotAngle);
  }
  
  cannonBody.position.copy(mesh.position);
  cannonBody.quaternion.copy(mesh.quaternion);
  
  scene.add(mesh);
  world.add(cannonBody);
}

// make a platform for the dominoes
const dominoPlatform1MeshDim = new THREE.Vector3(1.4, 8.0, 0.2);
const dominoPlatform1 = createBox(dominoPlatform1MeshDim, 0x00ffcc, 0.0);
placeAndRotateMesh(dominoPlatform1.mesh, dominoPlatform1.cannonBody, new THREE.Vector3(0, 5.0, 0), new THREE.Vector3(1, 0, 0), Math.PI / 2, scene, world);

// ramps for the initial ball to roll down
const platform2MeshDim = new THREE.Vector3(1.4, 12, 0.2);
const platform2 = createBox(platform2MeshDim, 0x00ffcc, 0.0);
placeAndRotateMesh(platform2.mesh, platform2.cannonBody, new THREE.Vector3(0, 11.5, 10), new THREE.Vector3(1, 0, 0), Math.PI / 4, scene, world);

const platform3MeshDim = new THREE.Vector3(1.4, 12, 0.2);
const platform3 = createBox(platform3MeshDim, 0xccffcc, 0.0);
placeAndRotateMesh(platform3.mesh, platform3.cannonBody, new THREE.Vector3(0, 20, 3), new THREE.Vector3(1, 0, 0), -Math.PI / 3.5, scene, world);

const numDominoes = 4;
const zSeparation = 0.9;
let startZ = 3.2;
for(let i = 0; i < numDominoes; i++){
  const newDomino = createDomino(0, 6.3, startZ, `domino;${2+i}`);
  dominoes.push(newDomino);
  startZ -= zSeparation;
}

// add torus to catch ball
const torusGeometry = new THREE.TorusGeometry(0.90, 0.1, 25, 100);
const torusMaterial = new THREE.MeshBasicMaterial({color: 0xffa500, wireframe: true});
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
torus.receiveShadow = true;
torus.castShadow = true;
torus.rotateX(-Math.PI / 2);
torus.position.set(0, 1.0, 6);
scene.add(torus);
  
// set up rigidbody for torus
const indices = torus.geometry.faces.map(face => [face.a, face.b, face.c]).reduce((x, acc) => acc.concat(x), []);
const vertices = torus.geometry.vertices.map(vert => [vert.x, vert.y, vert.z]).reduce((x, acc) => acc.concat(x), []);
  
const torusShape = new CANNON.Trimesh(vertices, indices);
const torusMat = new CANNON.Material();
const torusBody = new CANNON.Body({material: torusMat, mass: 0});
torusBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
torusBody.position.copy(torus.position);
torusBody.addShape(torusShape);
world.addBody(torusBody);

// seesaw-type thing on the platform

// cylinder
const cylinderGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 32);
const cylinderMat = new THREE.MeshBasicMaterial({color: 0xeeeeee});
const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
cylinderMesh.position.set(0, 8.5, -1.2);
cylinderMesh.rotateZ(Math.PI / 2);
scene.add(cylinderMesh);

const cylinderCannonShape = new CANNON.Cylinder(0.3, 0.3, 3, 32);

// https://github.com/schteppe/cannon.js/issues/58
// need to adjust cannon cylinder so it aligns with three.js cylinder because they're oriented differently
const quat = new CANNON.Quaternion();
quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
const trans = new CANNON.Vec3(0, 0, 0);
cylinderCannonShape.transformAllPoints(trans, quat);

const cylinderCannonMat = new CANNON.Material();
const cylinderCannonBody = new CANNON.Body({material: cylinderCannonMat, mass: 0.6});

cylinderCannonBody.quaternion.copy(cylinderMesh.quaternion);
cylinderCannonBody.position.copy(cylinderMesh.position);

cylinderCannonBody.addShape(cylinderCannonShape);
world.addBody(cylinderCannonBody);

// plank
const plankGeo = new THREE.BoxGeometry(1.8, 0.02, 2.8);
const plankMat = new THREE.MeshPhongMaterial({color: 0xffff00});
const plankMesh = new THREE.Mesh(plankGeo, plankMat);
plankMesh.castShadow = true;
plankMesh.receiveShadow = true;
plankMesh.position.set(0, 8.7, -2);
plankMesh.rotateX(145 * (Math.PI / 180)); // 145 deg
scene.add(plankMesh);

const plankCannonShape = new CANNON.Box(new CANNON.Vec3(0.9, 0.01, 1.4));
const plankCannonMat = new CANNON.Material();
const plankCannonBody = new CANNON.Body({material: plankCannonMat, mass: 0.2});

plankCannonBody.position.copy(plankMesh.position);
plankCannonBody.quaternion.copy(plankMesh.quaternion);
plankCannonBody.addShape(plankCannonShape);
world.addBody(plankCannonBody);

// cube on plank
const cubeGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
const cubeMat = new THREE.MeshPhongMaterial({color: 0xff00ff});
const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
cubeMesh.castShadow = true;
cubeMesh.receiveShadow = true;
cubeMesh.position.set(0, 9.1, -3);
scene.add(cubeMesh);

const cubeCannonShape = new CANNON.Box(new CANNON.Vec3(0.6, 0.6, 0.6));
const cubeCannonMat = new CANNON.Material();
const cubeCannonBody = new CANNON.Body({material: cubeCannonMat, mass: 0.1});
cubeCannonBody.position.copy(cubeMesh.position);
cubeCannonBody.quaternion.copy(cubeMesh.quaternion);
cubeCannonBody.addShape(cubeCannonShape);
world.addBody(cubeCannonBody);

cubeCannonBody.name = `cube;${numDominoes+2}`;

cubeCannonBody.addEventListener('collide', (evt) => {
  //console.log(evt.body);
  // this is kinda weird but since the last domino to fall never touches the cube we're interested in following with the camera,
  // we have to detect when the last domino was hit via it's sequence id (when the last domino is hit, it should be currObjectToFocusOn).
  if(parseInt(currObjectToFocusOn.name.split(';')[1]) === parseInt(cubeCannonBody.name.split(';')[1]) - 1){
    currObjectToFocusOn = cubeCannonBody;
  }
});

// end seesaw thingy

/*
const ball2 = createSphere(0, 7, -2.2, 0.4);
const sphereMesh2 = ball2.mesh;
const sphereBody2 = ball2.body;
sphereBody2.addEventListener('collide', () => {
  currObjectToFocusOn = sphereMesh2;
});
*/

const clock = new THREE.Clock();
let delta;

function update(){
  if(currObjectToFocusOn){
    //console.log(currObjectToFocusOn.name);
  }
  
  //camera.position.set(camera.position.x, currObjectToFocusOn.position.y, camera.position.z);
  camera.lookAt(new THREE.Vector3(currObjectToFocusOn.position.x, currObjectToFocusOn.position.y, currObjectToFocusOn.position.z));
  
  // move the stuff
  let clockDelta = clock.getDelta();
  delta = Math.min(clockDelta, 0.1);
  world.step(delta);

  // TODO: hoping to have platform3 be kinda wobbly for fun by rotating it slightly about the x axis back and forth
  //platform3.cannonBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.sin(clock.getElapsedTime()));
  
  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);
  
  dominoes.forEach(d => {
    const body = d.cannonBody;
    d.mesh.position.copy(body.position);
    d.mesh.quaternion.copy(body.quaternion);
  });
  
  cylinderMesh.position.copy(cylinderCannonBody.position);
  cylinderMesh.quaternion.copy(cylinderCannonBody.quaternion);
  
  plankMesh.position.copy(plankCannonBody.position);
  plankMesh.quaternion.copy(plankCannonBody.quaternion);
  
  cubeMesh.position.copy(cubeCannonBody.position);
  cubeMesh.quaternion.copy(cubeCannonBody.quaternion);
  
  platform3.mesh.position.copy(platform3.cannonBody.position);
  platform3.mesh.quaternion.copy(platform3.cannonBody.quaternion);
  
  //sphereMesh2.position.copy(sphereBody2.position);
  //sphereMesh2.quaternion.copy(sphereBody2.quaternion);
}

function keydown(evt){
  if(evt.keyCode === 32){
    // spacebar
    // remember that gravity is -9.8! this affects the suitable amount for the y-axis to use.
    sphereBody.applyImpulse(new CANNON.Vec3(0, 0.8, -0.5 * 3), sphereBody.position);
  }
  /*else if(evt.keyCode === 82){
    // r key
    sphereBody.position.x = 0;
    sphereBody.position.y = 4;
    sphereBody.position.z = 7;
    sphereBody.velocity = new CANNON.Vec3(0, 0, 0);
    camera.position.set(0, 4, 10);
    camera.setRotationFromQuaternion(camRotation);
  }
  */
}
document.addEventListener('keydown', keydown);

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
  cannonDebugRenderer.update();
}

animate();