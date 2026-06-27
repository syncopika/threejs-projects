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
camera.position.set(0, 4, 10);
camera.rotateX(-Math.PI/10);
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

const planeGeometry = new THREE.PlaneGeometry(25, 25);
const material = new THREE.MeshLambertMaterial({color: 0x055C9D});
const plane = new THREE.Mesh(planeGeometry, material);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
scene.add(plane);
const planeShape = new CANNON.Plane();
const groundMat = new CANNON.Material();
const planeBody = new CANNON.Body({material: groundMat, mass: 0}); // this plane extends infinitely
planeBody.addShape(planeShape);
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI/2);
world.addBody(planeBody);

const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 16);
const normalMaterial = new THREE.MeshPhongMaterial();
const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
sphereMesh.receiveShadow = true;
sphereMesh.castShadow = true;
sphereMesh.position.set(0, 16, 8);
scene.add(sphereMesh);

// based on these CANNON shapes and bodies which abide by physics,
// we can move the actual three.js meshes correspondingly
const sphereShape = new CANNON.Sphere(0.6);
const sphereMat = new CANNON.Material();
const sphereBody = new CANNON.Body({material: sphereMat, mass: 1.5});
sphereBody.addShape(sphereShape);
sphereBody.position.copy(sphereMesh.position);
world.addBody(sphereBody);

// make the sphere bounce a bit. smaller restitution = less bounce
// https://github.com/pmndrs/cannon-es/blob/master/examples/bounce.html
// https://github.com/schteppe/cannon.js/issues/444
const contactMat = new CANNON.ContactMaterial(groundMat, sphereMat, {friction: 0.0,  restitution: 0.5});
world.addContactMaterial(contactMat);

// rube goldberg things
const dominoes = [];

function createDomino(xPos, yPos, zPos){
  const dominoGeometry = new THREE.BoxGeometry(1.0, 2.2, 0.3);
  const dominoMat = new THREE.MeshPhongMaterial({color: 0xcccccc});
  const dominoMesh = new THREE.Mesh(dominoGeometry, dominoMat);
  dominoMesh.castShadow = true;
  dominoMesh.receiveShadow = true;
  dominoMesh.position.set(xPos, yPos, zPos);
  scene.add(dominoMesh);

  const dominoCannonShape = new CANNON.Box(new CANNON.Vec3(0.7, 1.2, 0.2));
  const dominoCannonMat = new CANNON.Material();
  const dominoCannonBody = new CANNON.Body({material: dominoCannonMat, mass: 0.1});
  dominoCannonBody.position.copy(dominoMesh.position);
  dominoCannonBody.addShape(dominoCannonShape);
  world.addBody(dominoCannonBody);
  
  const dominoContactMat = new CANNON.ContactMaterial(dominoCannonMat, sphereMat, {friction: 0.0,  restitution: 0.5});
  world.addContactMaterial(dominoContactMat);
  
  return {
    mesh: dominoMesh,
    cannonBody: dominoCannonBody,
  };
}

// make a platform for the dominoes
const platGeo = new THREE.BoxGeometry(1.4, 7.3, 0.2);
const platMat = new THREE.MeshPhongMaterial({color: 0x00ffcc});
const platMesh = new THREE.Mesh(platGeo, platMat);
platMesh.castShadow = true;
platMesh.receiveShadow = true;
platMesh.position.set(0, 5.0, 0);
platMesh.rotateX(Math.PI / 2);
scene.add(platMesh);

const platCannonShape = new CANNON.Box(new CANNON.Vec3(1.4, 3.6, 0.2));
const platCannonMat = new CANNON.Material();
const platCannonBody = new CANNON.Body({material: platCannonMat, mass: 0.0});
platCannonBody.position.copy(platMesh.position);
platCannonBody.quaternion.copy(platMesh.quaternion);
platCannonBody.addShape(platCannonShape);
world.addBody(platCannonBody);


const numDominoes = 5;
const zSeparation = 1.6;
let startZ = 3.2;
for(let i = 0; i < numDominoes; i++){
  const newDomino = createDomino(0, 7.5, startZ);
  dominoes.push(newDomino);
  startZ -= zSeparation;
}


const platGeo2 = new THREE.BoxGeometry(1.4, 7.3, 0.2);
const platMat2 = new THREE.MeshPhongMaterial({color: 0x00ffcc});
const platMesh2 = new THREE.Mesh(platGeo2, platMat2);
platMesh2.castShadow = true;
platMesh2.receiveShadow = true;
platMesh2.position.set(0, 8.5, 6.5);
platMesh2.rotateX(Math.PI / 4);
scene.add(platMesh2);
const platCannonShape2 = new CANNON.Box(new CANNON.Vec3(1.4, 3.6, 0.2));
const platCannonMat2 = new CANNON.Material();
const platCannonBody2 = new CANNON.Body({material: platCannonMat2, mass: 0.0});
platCannonBody2.position.copy(platMesh2.position);
platCannonBody2.quaternion.copy(platMesh2.quaternion);
platCannonBody2.addShape(platCannonShape2);
world.addBody(platCannonBody2);

// seesaw-type thing

// cylinder
const cylinderGeo = new THREE.CylinderGeometry(0.1, 0.3, 3, 32);
const cylinderMat = new THREE.MeshBasicMaterial({color: 0xeeeeee});
const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
cylinderMesh.position.set(0, 2.1, -4);
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
const plankGeo = new THREE.BoxGeometry(1.5, 0.02, 3.5);
const plankMat = new THREE.MeshPhongMaterial({color: 0xffff00});
const plankMesh = new THREE.Mesh(plankGeo, plankMat);
plankMesh.castShadow = true;
plankMesh.receiveShadow = true;
plankMesh.position.set(0, 2.3, -5);
plankMesh.rotateX(145 * (Math.PI / 180)); // 145 deg
scene.add(plankMesh);

const plankCannonShape = new CANNON.Box(new CANNON.Vec3(1.0, 0.02, 1.9));
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
cubeMesh.position.set(0, 3.0, -6);
scene.add(cubeMesh);

const cubeCannonShape = new CANNON.Box(new CANNON.Vec3(0.8, 0.8, 0.8));
const cubeCannonMat = new CANNON.Material();
const cubeCannonBody = new CANNON.Body({material: cubeCannonMat, mass: 0.03});
cubeCannonBody.position.copy(cubeMesh.position);
cubeCannonBody.quaternion.copy(cubeMesh.quaternion);
cubeCannonBody.addShape(cubeCannonShape);
world.addBody(cubeCannonBody);

//const plankContactMat = new CANNON.ContactMaterial(plankCannonMat, dominoCannonMat, {friction: 0.0,  restitution: 0.5});
//world.addContactMaterial(plankContactMat);

const clock = new THREE.Clock();
let delta;

function update(){
  // move the stuff
  delta = Math.min(clock.getDelta(), 0.1);
  world.step(delta);
    
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
}

function keydown(evt){
  if(evt.keyCode === 32){
    // spacebar
    // remember that gravity is -9.8! this affects the suitable amount for the y-axis to use.
    sphereBody.applyImpulse(new CANNON.Vec3(0, 0.8, -0.5 * 3), sphereBody.position);
  }else if(evt.keyCode === 49){
    //1 key
    camera.position.set(0, 4, 10);
    camera.setRotationFromQuaternion(camRotation);
  }else if(evt.keyCode === 50){
    //2 key
    camera.rotateY(Math.PI / -2);
    camera.rotateX(Math.PI / -3);
    camera.position.set(-10, 15, -8);
  }else if(evt.keyCode === 82){
    // r key
    sphereBody.position.x = 0;
    sphereBody.position.y = 4;
    sphereBody.position.z = 7;
    sphereBody.velocity = new CANNON.Vec3(0, 0, 0);
    camera.position.set(0, 4, 10);
    camera.setRotationFromQuaternion(camRotation);
  }
}
document.addEventListener('keydown', keydown);

function createPole(){  
  // the pole
  const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 7, 20); // radius top, radius bottom, height, radial segments
  const poleMaterial = new THREE.MeshBasicMaterial({color: 0xdddddd, wireframe: true});
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.receiveShadow = true;
  pole.position.x = 0;
  pole.position.y = 0;
  pole.position.z = -9.2;
  scene.add(pole);
    
  const poleIndices = pole.geometry.faces.map(face => [face.a, face.b, face.c]).reduce((x, acc) => acc.concat(x), []);
  const poleVertices = pole.geometry.vertices.map(vert => [vert.x, vert.y, vert.z]).reduce((x, acc) => acc.concat(x), []);
  const poleShape = new CANNON.Trimesh(poleVertices, poleIndices);
  const poleMat = new CANNON.Material();
  const poleBody = new CANNON.Body({material: poleMat, mass: 0});
  poleBody.position.x = pole.position.x;
  poleBody.position.y = pole.position.y;
  poleBody.position.z = pole.position.z;
  poleBody.addShape(poleShape);
  world.addBody(poleBody);
    
  const poleContactMat = new CANNON.ContactMaterial(poleMat, sphereMat, {friction: 0.0,  restitution: 0.1});
  world.addContactMaterial(poleContactMat);
}


function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
  cannonDebugRenderer.update();
}

animate();