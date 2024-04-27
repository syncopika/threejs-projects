// https://sbcode.net/threejs/physics-cannonjs/
// https://github.com/schteppe/cannon.js/tree/master/tools/threejs

const container = document.getElementById("container");
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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const loadingManager = new THREE.LoadingManager();
setupLoadingManager(loadingManager);

const loader = new THREE.GLTFLoader(loadingManager);

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

const sphereGeometry = new THREE.SphereGeometry(0.6, 32, 16);
const normalMaterial = new THREE.MeshPhongMaterial();
const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
sphereMesh.receiveShadow = true;
sphereMesh.castShadow = true;
sphereMesh.position.x = 0;
sphereMesh.position.y = 4;
sphereMesh.position.z = 7;
scene.add(sphereMesh);

// based on these CANNON shapes and bodies which abide by physics,
// we can move the actual three.js meshes correspondingly
const sphereShape = new CANNON.Sphere(0.7);
const sphereMat = new CANNON.Material();
const sphereBody = new CANNON.Body({material: sphereMat, mass: 0.8});
sphereBody.addShape(sphereShape);
sphereBody.position.x = sphereMesh.position.x;
sphereBody.position.y = sphereMesh.position.y;
sphereBody.position.z = sphereMesh.position.z;
world.addBody(sphereBody);

// make the sphere bounce a bit. smaller restitution = less bounce
// https://github.com/pmndrs/cannon-es/blob/master/examples/bounce.html
// https://github.com/schteppe/cannon.js/issues/444
const contactMat = new CANNON.ContactMaterial(groundMat, sphereMat, {friction: 0.0,  restitution: 0.5});
world.addContactMaterial(contactMat);

const cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);

// for basketball
// - to simplify things, make the hoop a torus
// - backboard can just be a regular rectangular plane
// - how about fabric/cloth w/ ammo for the net?
createBasketballHoop();

const clock = new THREE.Clock();
let delta;

function update(){
  // move the stuff
  delta = Math.min(clock.getDelta(), 0.1);
  world.step(delta);
    
  sphereMesh.position.set(sphereBody.position.x, sphereBody.position.y, sphereBody.position.z);
  sphereMesh.quaternion.set(
    sphereBody.quaternion.x,
    sphereBody.quaternion.y,
    sphereBody.quaternion.z,
    sphereBody.quaternion.w,
  );
}

function keydown(evt){
  if(evt.keyCode === 32){
    // spacebar
    // remember that gravity is -9.8! this affects the suitable amount for the y-axis to use.
    sphereBody.applyImpulse(new CANNON.Vec3(0, 0.8, -0.5), sphereBody.position);
  }else if(evt.keyCode === 49){
    //1 key
    camera.position.set(0, 4, 10);
    camera.setRotationFromQuaternion(camRotation);
  }else if(evt.keyCode === 50){
    //2 key
    camera.position.set(0, 15, -8);
    camera.rotateX(Math.PI*(3/2));
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
document.addEventListener("keydown", keydown);

function createBasketballHoop(){
  // backboard
  // https://github.com/schteppe/cannon.js/issues/403
  const planeGeometry = new THREE.BoxGeometry(5, 3, 0.3);
  const material = new THREE.MeshLambertMaterial({color: 0xffffff});
  const plane = new THREE.Mesh(planeGeometry, material);
  plane.receiveShadow = true;
  plane.castShadow = true;
  plane.position.x = 0;
  plane.position.y = 4;
  plane.position.z = -9;
  scene.add(plane);
    
  // !? https://stackoverflow.com/questions/26183492/cannonjs-and-three-js-one-unit-off
  const planeShape = new CANNON.Box(new CANNON.Vec3(2.5, 1.5, 0.15));
  const backboardMat = new CANNON.Material();
  const planeBody = new CANNON.Body({material: backboardMat, mass: 0});
  // make sure the body is positioned where the mesh is.
  planeBody.position.x = plane.position.x;
  planeBody.position.y = plane.position.y;
  planeBody.position.z = plane.position.z;
  planeBody.addShape(planeShape);
  world.addBody(planeBody);
    
  const contactMat = new CANNON.ContactMaterial(backboardMat, sphereMat, {friction: 0.0,  restitution: 0.5});
  world.addContactMaterial(contactMat);
    
  // the hoop
  const hoopGeometry = new THREE.TorusGeometry(0.90, 0.1, 15, 100);
  const hoopMaterial = new THREE.MeshBasicMaterial({color: 0xffa500, wireframe: true});
  const hoop = new THREE.Mesh(hoopGeometry, hoopMaterial);
  hoop.receiveShadow = true;
  hoop.castShadow = true;
  hoop.rotateX(-Math.PI/2);
  hoop.position.x = 0;
  hoop.position.y = 3.6;
  hoop.position.z = -8;
  scene.add(hoop);
    
  // set up rigidbody for hoop
  //console.log(hoop.geometry);
  const indices = hoop.geometry.faces.map(face => [face.a, face.b, face.c]).reduce((x, acc) => acc.concat(x), []);
  const vertices = hoop.geometry.vertices.map(vert => [vert.x, vert.y, vert.z]).reduce((x, acc) => acc.concat(x), []);
    
  const hoopShape = new CANNON.Trimesh(vertices, indices);
  const hoopMat = new CANNON.Material();
  const hoopBody = new CANNON.Body({material: hoopMat, mass: 0});
  hoopBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
  hoopBody.position.x = hoop.position.x;
  hoopBody.position.y = hoop.position.y;
  hoopBody.position.z = hoop.position.z;
  hoopBody.addShape(hoopShape);
  world.addBody(hoopBody);
    
  const hoopContactMat = new CANNON.ContactMaterial(hoopMat, sphereMat, {friction: 0.0,  restitution: 0.1});
  world.addContactMaterial(hoopContactMat);
    
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