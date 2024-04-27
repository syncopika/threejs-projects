// playing with curves
import { Flow } from '../libs/CurveModifier.js';

function getModel(modelFilePath){
  return new Promise((resolve, reject) => {
    loader.load(
      modelFilePath,
      function(gltf){
        gltf.scene.traverse((child) => {
          if(child.type === "Mesh"){
            resolve(child);
          }
        });
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

function generateHelixCurvePoints(numLoops, radius, separationConstant){
  const points = [];
  const numPointsPerLoop = 20;
  const angleSlice = (2*Math.PI)/numPointsPerLoop; // in radians
    
  let currAngle = 0;
  for(let i = 0; i < numLoops; i++){
    for(let j = 0; j < numPointsPerLoop; j++){
      // note we're assuming the z axis in/out of the page and x and y form a vertical plane relative to the camera
      const y = radius * Math.cos(currAngle);
      const z = radius * Math.sin(currAngle);
      const x = separationConstant * currAngle;
            
      points.push(new THREE.Vector3(x, y, z));
            
      currAngle += angleSlice;
    }
  }
    
  return points;
}

function generateImmelmannTurn(){
  const points = [
    // first create a straight line
    new THREE.Vector3(-13, 2, -4),
    new THREE.Vector3(-8, 2, -4),
    new THREE.Vector3(0, 2, -4.1),
    new THREE.Vector3(6, 2, -4.5),
    
    // then a vertical curve
    new THREE.Vector3(9.3, 4, -4),
    new THREE.Vector3(11, 9, -4),
    new THREE.Vector3(9.4, 13, -4),
    new THREE.Vector3(5.8, 14.9, -4),
        
    // level off
    new THREE.Vector3(0, 15.6, -4),
    new THREE.Vector3(-6, 15.7, -4),
    new THREE.Vector3(-11, 15.8, -4),  
    new THREE.Vector3(-13, 15.8, -4),          
  ];
    
  return new THREE.CatmullRomCurve3(points);
}

function setupCurveAndGetLine(curve, closed=false){
  curve.closed = closed;

  const points = curve.getPoints(60);
  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({color: 0x00ffff})
  );
    
  return line;
}

const container = document.getElementById("container");
//const keyboard = new THREEx.KeyboardState();

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
const initialCameraRotation = camera.rotation.clone();
camera.position.set(0, 4, 19);

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

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(2, 10, 2);
pointLight.castShadow = true;
scene.add(pointLight);

const clock = new THREE.Clock();

// add a plane
const planeGeometry = new THREE.PlaneGeometry(25, 25);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0x055C9D});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
scene.add(plane);


// add a curve
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(5, 3, -4),
  new THREE.Vector3(5, 4.2, 8),
  new THREE.Vector3(-5, 3, 8),
  new THREE.Vector3(-5, 4.4, -4)
]);

// more curves
const helix = generateHelixCurvePoints(3, 3.2, 1.5);
helix.forEach(v => {
  // translate curve
  v.x -= 13;
  v.y += 6.8;
  v.z -= 5.5;
});
const barrelRollCurve = new THREE.CatmullRomCurve3(helix);

const helix2 = generateHelixCurvePoints(3, 0.1, 1.8);
helix2.forEach(v => {
  v.x -= 16.5;
  v.y += 6.8;
  v.z -= 1.5;
});
const aileronRollCurve = new THREE.CatmullRomCurve3(helix2);

const vertLoop = new THREE.CatmullRomCurve3([
  new THREE.Vector3(15, 2, -5),
  new THREE.Vector3(8, 2, -5),
  new THREE.Vector3(2, 4, -5),
  new THREE.Vector3(-3, 7, -5),
  new THREE.Vector3(-5, 11, -5),
  new THREE.Vector3(-3, 15, -5),
  new THREE.Vector3(1, 14.6, -4),
  new THREE.Vector3(4, 10.2, -4),
  new THREE.Vector3(2, 5.1, -3),
  new THREE.Vector3(-5, 3, -2),
  new THREE.Vector3(-10, 2.4, -2),
  new THREE.Vector3(-15, 2, -2)
]);


const immelmannTurn = generateImmelmannTurn();


const curveOptions = [
  {
    curve,
    line: setupCurveAndGetLine(curve, true),
  },
  {
    curve: barrelRollCurve,
    line: setupCurveAndGetLine(barrelRollCurve, false),
  },
  {
    curve: aileronRollCurve,
    line: setupCurveAndGetLine(aileronRollCurve, false),
  },
  {
    curve: vertLoop,
    line: setupCurveAndGetLine(vertLoop, false),
  },
  {
    curve: immelmannTurn,
    line: setupCurveAndGetLine(immelmannTurn, false),
  }
];

let currCurve = curveOptions[0];
scene.add(currCurve.line);


const flow = null;
let model = null;
let t = 0;
let pause = false;

// add the object that will follow the curve
getModel("../models/f5tiger.gltf").then((modelData) => {
  //modelData.scale.x *= 1;
  //modelData.scale.y *= 1;
  //modelData.scale.z *= 1;
    
  modelData.castShadow = true;
    
  const modelAxesHelper = new THREE.AxesHelper(10);
  modelData.add(modelAxesHelper);
  model = modelData;
  scene.add(model);
    
  // currently just setting up the curve and using it solely to get some
  // positioning and rotation info, which I then apply manually to the model
  // I want to move seems to work well.
  //
  // passing the model to Flow() doesn't seem to get the model to move along the curve :/
  // something to investigate later?
  //flow = new Flow();
  //flow.updateCurve(0, curve);
  //scene.add(flow.object3D);
});

/*
flow = new Flow(sphere);
flow.updateCurve(0, curve);
scene.add(flow.object3D);
*/

let speed = 0.0018;
let slerpFactor = 0;
function update(){
  if(pause) return;
    
  //if(flow) flow.moveAlongCurve(0.003);
    
  if(model){
    t += speed;
        
    if(t > 1){
      t = 0;
      slerpFactor = 0;
    }
        
    // move the model to the next position
    model.position.copy(currCurve.curve.getPoint(t));
        
    // rotate the model based on tangent to curve
    const tangent = currCurve.curve.getTangent(t).normalize();
    model.quaternion.setFromUnitVectors(new THREE.Vector3(-1, 0, 0), tangent);
    
    // pretty hacky but not really sure of a better
    // way to handle when I want the model rotated a certain way
    if(currCurve != curveOptions[0]){
      model.rotateX(Math.PI/2);
    }
        
    if(currCurve == curveOptions[4]){
      model.rotateX(Math.PI);
      if(model.position.y > 15){
        // get the quaternion we want to rotate towards
        // this is where the plane levels off so I think the quaternion should approx be consistent
        // all the way through the end so when we take the inverse, we should always get the same resulting
        // end quaternion we want to rotate towards
        const rot = model.quaternion.clone();
        rot.inverse();
                
        model.quaternion.slerp(rot, slerpFactor);
        slerpFactor += 0.015;
      }
    }
  }
        
}

function keydown(evt){
  if(evt.keyCode === 49){
    // 1
    camera.position.set(0, 4, 19);
    camera.setRotationFromEuler(initialCameraRotation);
  }else if(evt.keyCode === 50){
    // 2
    camera.position.set(18, 4, 0);
    camera.setRotationFromEuler(initialCameraRotation);
    camera.rotateY(Math.PI/2);
  }else if(evt.keyCode === 51){
    // 3
    camera.position.set(-18, 4, 0);
    camera.setRotationFromEuler(initialCameraRotation);
    camera.rotateY(-Math.PI/2);
  }else if(evt.keyCode === 52){
    // 4
    camera.position.set(0, 4, -19);
    camera.setRotationFromEuler(initialCameraRotation);
    camera.rotateY(Math.PI);
  }else if(evt.keyCode === 53){
    // 5
    camera.position.set(0, 25, 0);
    camera.setRotationFromEuler(initialCameraRotation);
    camera.rotateX(-Math.PI/2);
  }
}
document.addEventListener("keydown", keydown);


function animate(){
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

document.getElementById('pause').addEventListener('click', (evt) => {
  if(!pause){
    evt.target.textContent = 'resume';
  }else{
    evt.target.textContent = 'pause';
  }
  pause = !pause;
});

document.getElementById('toggleCurve').addEventListener('click', (evt) => {
  if(evt.target.textContent === "show curve"){
    currCurve.line.material.opacity = 1;
    currCurve.line.material.transparent = false;
    evt.target.textContent = "hide curve";
  }else{
    evt.target.textContent = "show curve";
    currCurve.line.material.opacity = 0;
    currCurve.line.material.transparent = true;
        
  }
});

document.getElementById('selectCurve').addEventListener('change', (evt) => {
  const curveName = evt.target.value;
    
  scene.remove(currCurve.line);
    
  if(curveName === "curved lateral loop"){
    currCurve = curveOptions[0];
  }else if(curveName === "aileron roll"){
    currCurve = curveOptions[2];
  }else if(curveName === "barrel roll"){
    currCurve = curveOptions[1];
  }else if(curveName === "vertical loop"){
    currCurve = curveOptions[3];
  }else if(curveName === "Immelmann Turn"){
    currCurve = curveOptions[4];
  }
    
  scene.add(currCurve.line);
});

document.getElementById('speedSlider').addEventListener('input', (evt) => {
  //console.log(evt.target.value);
  speed = parseFloat(evt.target.value);
});

animate();
