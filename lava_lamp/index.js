// lava lamp
// borrowed some code from https://threejs.org/examples/webgl_marchingcubes.html
import { MarchingCubes } from '../libs/MarchingCubes.js';

const container = document.getElementById("container");

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 5, 8);

const loadingManager = new THREE.LoadingManager();
setupLoadingManager(loadingManager);

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 0.7;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbbbbaa);
scene.add(camera);

const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 1.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 50, -10);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const spotLight2 = new THREE.SpotLight(0xffffff, 0.6);
spotLight2.position.set(15, -1, 20);
spotLight2.castShadow = true;
spotLight2.shadow.mapSize.width = 1024;
spotLight2.shadow.mapSize.height = 1024;
scene.add(spotLight2);

const clock = new THREE.Clock();
let time = 0;

// marching cubes stuff
const resolution = 28; // how smooth do you want the blobs
let effect = null;
let wall = null;
let stand = null;
let lampModel = null;
const lavaColor = 0x39ff14;

const material = new THREE.MeshPhongMaterial({color: lavaColor});
//material.wireframe = true;

function getModel(modelFilePath, name){
  return new Promise((resolve, reject) => {
    loader.load(
      modelFilePath,
      function(gltf){
        resolve(gltf.scene);
      },
      // called while loading is progressing
      function(xhr){
        console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
      },
      // called when loading has errors
      function(error){
        console.log('An error happened');
        console.log(error);
      }
    );
  });
}
getModel("../models/lava-lamp.gltf", "lavalamp").then(obj => {
  lampModel = obj;
    
  lampModel.children[1].castShadow = true;
  const lampStructure = lampModel.children[0];
  lampStructure.castShadow = true;
  //lampStructure.material.wireframe = true;
  lampStructure.material.metalness = 0.3;
    
  scene.add(lampModel);
  lampModel.position.set(0, -4, 0);
  lampModel.scale.set(1.5, 1.5, 1.5);
    
  // add the lamp lightbulb
  const lightbulb = new THREE.PointLight(0xffffff, 1.6);
  lampModel.add(lightbulb);
  lightbulb.translateY(3);
  lightbulb.distance = 7.0;
    
  // add the lava
  effect = new MarchingCubes(resolution, material, true, true, 100000);
  lampModel.add(effect);
  effect.translateY(2.9);
  effect.scale.set(0.54, 1.2, 0.54);
  effect.enableUvs = false;
  effect.enableColors = false;
    
  // add circular plane for the base of the blobs
  const planeGeometry = new THREE.CircleGeometry(0.7, 32);
  const planeMaterial = new THREE.MeshPhongMaterial({color: lavaColor});
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.name = 'blobBase';
  lampModel.add(plane);
  plane.translateY(1.95);
  plane.rotateX(-Math.PI / 2);

  lampModel.rotateX(-Math.PI / 8);
    
  // add a table
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshPhongMaterial({color: 0xcccccc});
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.rotation.set(lampModel.rotation.x, lampModel.rotation.y, lampModel.rotation.z);
  cube.position.set(lampModel.position.x, lampModel.position.y - 1.74, lampModel.position.z + 0.8);
  cube.scale.set(4, 4, 4);
  cube.receiveShadow = true;
  stand = cube;
  scene.add(cube);
    
  // add a wall
  const wallGeometry = new THREE.BoxGeometry(4, 4, 0.05);
  const wallMaterial = new THREE.MeshPhongMaterial({color: 0xdddddd});
  wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.rotation.set(lampModel.rotation.x, lampModel.rotation.y, lampModel.rotation.z);
  wall.rotateY(Math.PI / 6);
  wall.position.set(lampModel.position.x - 12, lampModel.position.y + 3, lampModel.position.z - 16);
  wall.scale.set(4, 6, 4);
  wall.receiveShadow = true;
  scene.add(wall);
    
  //console.log(lampModel);
});

// this controls content of marching cubes voxel field
function updateCubes(object, time, numblobs, floor){
  object.reset();
    
  const subtract = 12;
  const strength = 1.8 / ((Math.sqrt(numblobs) - 1) / 4 + 1);

  for(let i = 0; i < numblobs; i ++ ){
    const ballx = Math.sin(i + 1.26 * time * (1.03 + 0.5 * Math.cos(0.21 * i))) * 0.27 + 0.5;
    const bally = Math.abs(Math.cos( i + 1.12 * time * Math.cos(1.22 + 0.1424 * i))) * 0.77; // dip into the floor
    const ballz = Math.cos(i + 1.32 * time * 0.1 * Math.sin((0.92 + 0.53 * i))) * 0.27 + 0.5;
    object.addBall(ballx, bally, ballz, strength, subtract);
  }

  if(floor) object.addPlaneY(1, 6);

  object.update();
}

function update(){
  const delta = clock.getDelta();

  time += delta * 1.0 * 0.5;

  // marching cubes
  if(effect) updateCubes(effect, time, 7, true);
      
  if(lampModel) lampModel.rotateY(delta / 5);
      
  // update trackball
  controls.update();
}

document.getElementById('toggleWall').addEventListener('change', () => {
  wall.visible = !wall.visible;
});

document.getElementById('toggleStand').addEventListener('change', () => {
  stand.visible = !stand.visible;
});

document.getElementById('colorPickerInput').addEventListener('change', evt => {
  material.color = new THREE.Color(evt.target.value);
  lampModel.children.filter(child => child.name === 'blobBase')[0].material.color = new THREE.Color(evt.target.value);
});

document.getElementById('toggleWireframe').addEventListener('change', () => {
  material.wireframe = !material.wireframe;
});

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}

animate();