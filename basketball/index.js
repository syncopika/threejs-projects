// https://sbcode.net/threejs/physics-cannonjs/

const container = document.getElementById("container");
const keyboard = new THREEx.KeyboardState();

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 4, 10);
camera.rotateX(-Math.PI/8);

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

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(2, 10, 2);
pointLight.castShadow = true;
scene.add(pointLight);

//const hemiLight = new THREE.HemisphereLight(0xffffff);
//hemiLight.position.set(0, 10, 0);
//scene.add(hemiLight);

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const planeGeometry = new THREE.PlaneGeometry(25, 25);
const material = new THREE.MeshBasicMaterial({color: 0x055C9D, side: THREE.DoubleSide});
const plane = new THREE.Mesh(planeGeometry, material);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
scene.add(plane);
const planeShape = new CANNON.Plane();
const groundMat = new CANNON.Material();
const planeBody = new CANNON.Body({material: groundMat, mass: 0});
planeBody.addShape(planeShape);
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(planeBody);

const sphereGeometry = new THREE.SphereGeometry();
const normalMaterial = new THREE.MeshNormalMaterial();
const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
sphereMesh.position.x = 0;
sphereMesh.position.y = 4;
sphereMesh.castShadow = true;
scene.add(sphereMesh);

// based on these CANNON shapes and bodies which abide by physics,
// we can move the actual three.js meshes correspondingly
const sphereShape = new CANNON.Sphere(1);
const sphereMat = new CANNON.Material();
const sphereBody = new CANNON.Body({material: sphereMat, mass: 0.5});
sphereBody.addShape(sphereShape);
sphereBody.position.x = sphereMesh.position.x;
sphereBody.position.y = sphereMesh.position.y;
sphereBody.position.z = sphereMesh.position.z;
world.addBody(sphereBody);

// make the sphere bounce a bit
// https://github.com/pmndrs/cannon-es/blob/master/examples/bounce.html
// https://github.com/schteppe/cannon.js/issues/444
const contactMat = new CANNON.ContactMaterial(groundMat, sphereMat, {friction: 0.0,  restitution: 0.7});
world.addContactMaterial(contactMat);

const clock = new THREE.Clock();
let delta;

function update(){
    // listen for keyboard events
    
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


function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    update();
}

animate();