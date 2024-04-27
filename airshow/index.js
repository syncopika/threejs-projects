// airshow!
// relies on some functions defined in utils.js in ../libs
// also Ronen Ness' partykals.js in ../libs

// https://github.com/donmccurdy/three-gltf-viewer/blob/master/src/viewer.js
const container = document.getElementById("container");
const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.1, 5000);
const keyboard = new THREEx.KeyboardState();
const raycaster = new THREE.Raycaster();
const loadingManager = new THREE.LoadingManager();

/* const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom); */

// set up mobile keyboard
document.getElementById('showKeyboard').addEventListener('click', () => {
  new JSKeyboard(document.getElementById('mobileKeyboard'));
});

setupLoadingManager(loadingManager);
const loader = new THREE.GLTFLoader(loadingManager);
const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
//renderer.shadowMap.enabled = true;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

//https://threejs.org/docs/#examples/en/controls/OrbitControls
// or this?: https://github.com/mrdoob/three.js/blob/dev/examples/jsm/controls/TrackballControls.js
//const controls = new OrbitControls(defaultCamera, renderer.domElement);

const scene = new THREE.Scene(); 
scene.add(camera);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
hemiLight.position.set(0, 300, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(0, 100, -55);
scene.add(dirLight);

const clock = new THREE.Clock();
const loadedModels = [];
const aircraftOptions = {};

let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;
let thePlayer = null;

// need to keep some state 
const state = {
  'mode': 'static', // other options include: static, takeoff, flying, landing. taxi is for moving on the ground
  'speed': 0.0,
  'altitude': 0.0,
  'smokeOn': true,
  'isMoving': false, // when 'w' key is pressed, this is true.
  'originalPosition': {
    'position': null,
    'rotation': null,
    'aircraftPosition': null,
    'aircraftRotation': null
  },
  'particleSystems': []
};

function setUpSkyBox(){
    
}

function updateStateHtml(state){
  const altitude = document.getElementById('altitude');
  const speed = document.getElementById('speed');
  const status = document.getElementById('status');
  altitude.textContent = `current altitude: ${state['altitude']}`;
  speed.textContent = `current speed: ${state['speed']}`;
  status.textContent = `current state: ${state['mode']}`;
}

function resetPosition(state, player){
  player.position.copy(state['originalPosition']['position']);
  player.rotation.copy(state['originalPosition']['rotation']);
  player.children[0].position.copy(state['originalPosition']['aircraftPosition']);
  player.children[0].rotation.copy(state['originalPosition']['aircraftRotation']);
}

function resetState(state){
  state['mode'] = 'static';
  state['speed'] = 0.0;
  state['altitude'] = 0.0;
  state['isMoving'] = false;
    
  state.particleSystems.forEach((pSystem) => {
    pSystem.removeSelf();
  });
}

function engineFlameParticles(state, obj){
  // using partykals.js: https://github.com/RonenNess/partykals
  // create a set of particles for each engine
  for(let i = 0; i < 2; i++){
    const pSystem = new Partykals.ParticlesSystem({
      container: obj,
      particles: {
        startAlpha: 1,
        endAlpha: 0,
        startSize: 2.5,
        endSize: 4,
        ttl: 5,
        velocity: new Partykals.Randomizers.SphereRandomizer(3),
        velocityBonus: new THREE.Vector3(0, 10, -60),
        colorize: true,
        startColor: new Partykals.Randomizers.ColorsRandomizer(new THREE.Color(0.3, 0.2, 0), new THREE.Color(0.3, 0.4, 0.3)),
        endColor: new THREE.Color(0, 0, 0),
        blending: "additive",
        worldPosition: false,
      },
      system: {
        particlesCount: 100,
        scale: 400,
        emitters: new Partykals.Emitter({
          onInterval: new Partykals.Randomizers.MinMaxRandomizer(0, 5),
          interval: new Partykals.Randomizers.MinMaxRandomizer(0, 0.25),
        }),
        depthWrite: false,
        speed: 1.5
      }
    });
    state.particleSystems.push(pSystem);
  }
}

// for incrementing the speed when accelerating on takeoff
function getSpeed(timeDelta){
  return Math.exp(timeDelta);
}

function getModel(modelFilePath, type, name){
  return new Promise((resolve, reject) => {
    loader.load(
      modelFilePath,
      function(gltf){
        gltf.scene.traverse((child) => {
          if(child.type === "Mesh"){
                    
            const material = child.material;
            const geometry = child.geometry;
            const obj = new THREE.Mesh(geometry, material);
                        
            if(name === "bg"){
            }
                        
            if(type === "player"){
              obj.scale.x = 0.98;
              obj.scale.y = 0.98;
              obj.scale.z = 0.98;
              obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
            }
            obj.type = type;
            obj.name = name;
            processMesh(obj);
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

loadedModels.push(getModel('../models/f-18.glb', 'player', 'f18'));
loadedModels.push(getModel('../models/f-16.gltf', 'player', 'f16'));
loadedModels.push(getModel('../models/f-35.gltf', 'player', 'f35'));
loadedModels.push(getModel('../models/airbase.gltf', 'airbase', 'bg'));

function processMesh(mesh){
  if(mesh.type === "player"){
    const meshName = mesh.name;
        
    // the local axis of the imported mesh is a bit weird and not consistent with the world axis. so, to fix that,
    // put it in a group object and just control the group object! the mesh is also just oriented properly initially when placed in the group.
    const playerAxesHelper = new THREE.AxesHelper(10);
    mesh.add(playerAxesHelper);
        
    const group = new THREE.Group();
    group.add(mesh);
    const playerGroupAxesHelper = new THREE.AxesHelper(8);
    group.add(playerGroupAxesHelper);
        
    mesh = group;
    mesh.position.set(-15, 1, -40);
    mesh.originalColor = mesh.children[0].material; // this should only be temporary

    // alternate materials used for the sub depending on condition 
    const hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
    mesh.hitMaterial = hitMaterial;
    mesh.originalMaterial = mesh.children[0].material;
        
    aircraftOptions[meshName] = mesh;
        
    if(meshName === "f18"){
      thePlayer = mesh;
            
      // save current position and rotation of the group and the aircraft mesh itself
      const originalPositionGroup = new THREE.Vector3();
      const originalPositionAircraft = new THREE.Vector3();
      const originalRotationGroup = new THREE.Euler();
      const originalRotationAircraft = new THREE.Euler();
            
      originalPositionGroup.copy(thePlayer.position);
      originalRotationGroup.copy(thePlayer.rotation);
      originalPositionAircraft.copy(thePlayer.children[0].position);
      originalRotationAircraft.copy(thePlayer.children[0].rotation);
            
      //console.log(originalRotationAircraft);
      //console.log(originalRotationGroup);
            
      state['originalPosition']['position'] = originalPositionGroup;
      state['originalPosition']['rotation'] = originalRotationGroup;
      state['originalPosition']['aircraftPosition'] = originalPositionAircraft;
      state['originalPosition']['aircraftRotation'] = originalRotationAircraft;
            
      scene.add(thePlayer);
      animate();
    }
  }else{
    //mesh.castShadow = true;
    //mesh.receiveShadow = true;
    scene.add(mesh);
  }
  renderer.render(scene, camera);
}

/*
    add event listener for certain key presses that need to be 
    evaluated just once (i.e. if we tried to listen to them in the update function,
    since that function may run more then once a second, a key press might be registered
    multiple times, which makes it unreliable)
*/
document.addEventListener("keydown", (evt) => {
  if(evt.keyCode === 20){
    // caps lock
    console.log("mode changed!");
    if(state['mode'] === 'taxi'){
      state['mode'] = 'takeoff';
      state['phase'] = 1;
      //console.log("mode changed to takeoff!");
      engineFlameParticles(state, thePlayer.children[0]); // set up particles for engine
    }else if(state['mode'] === 'flying'){
            
      // something for landing?
      console.log("mode changed to landing!");
      state['mode'] = 'landing';

      // reset rotation
      const forwardZ = getForward(thePlayer.children[0]).z;

      // THE Z ROTATIONS of the actual aircraft mesh and the group object it's in are opposite to each other
      if(forwardZ < 0){
        thePlayer.rotation.z = 0.0;
        thePlayer.rotation.x = 0.0;
        thePlayer.children[0].rotation.z = -Math.PI;
        thePlayer.children[0].rotation.x = -Math.PI;
      }else{
        thePlayer.rotation.z = -Math.PI;
        thePlayer.rotation.x = -Math.PI;
        thePlayer.children[0].rotation.z = Math.PI;
        thePlayer.children[0].rotation.x = Math.PI;
      }
            
    }else if(state['mode'] === 'landing'){
      // go back to takeoff -> flying
      state['mode'] = 'takeoff';
    }
  }
    
  // handle switching between aircraft choices
  let selected = null;
  if(evt.keyCode === 49){
    // 1 key
    //console.log("you're a f-18 now");
    selected = aircraftOptions['f18'];
  }else if(evt.keyCode === 50){
    // 2 key
    //console.log("you're a f-16 now");
    selected = aircraftOptions['f16'];
  }else if(evt.keyCode === 51){
    // 3 key
    //console.log("you're a f-35 now");
    selected = aircraftOptions['f35'];
  }
    
  if(selected){
    selected.position.copy(thePlayer.position);
    selected.rotation.copy(thePlayer.rotation);

    scene.remove(thePlayer);
    scene.add(selected);
        
    thePlayer = selected;
  }
});

document.addEventListener("keyup", (evt) => {
  if(evt.keyCode === 87){
    // 'w' key
    if(state['mode'] !== 'landing'){
      state['isMoving'] = false;
      if(state['mode'] === 'flying'){
        state['start'] = Date.now();
        state['mode'] = 'falling';
      }
    }
  }else if(evt.keyCode === 80){
    // 'p' key to toggle smoke
    state['smokeOn'] = !state['smokeOn'];
  }else if(evt.keyCode === 88){
    // x key - toggle wireframe of plane
    thePlayer.children[0].material.wireframe = !thePlayer.children[0].material.wireframe;
  }
});


function update(){
  sec = clock.getDelta();
  rotationAngle = (Math.PI / 2) * sec;
  let changeCameraView = false;
    
  // update altitude 
  state['altitude'] = thePlayer.position.y;
  updateStateHtml(state);
    
  if(keyboard.pressed("shift")){
    changeCameraView = true;
  }
    
  if(keyboard.pressed("W")){
    // note that this gets called several times with one key press!
    // I think it's because update() in requestAnimationFrames gets called quite a few times per second
    state['isMoving'] = true;
        
    // engine particles 
    if((state['mode'] === 'takeoff' || state['mode'] === 'flying') && state['smokeOn']){
      state.particleSystems.forEach((pSystem) => {
        pSystem.addTo(thePlayer.children[0]);
        pSystem.update();
      });
    }else{
      // don't show any particles
      state.particleSystems.forEach((pSystem) => {
        pSystem.removeSelf();
      });
    }
        
    if(state['mode'] === 'static'){
      state['mode'] = 'taxi';
      //console.log("starting to taxi...");
    }
    
    if(state['mode'] === 'takeoff' && state['phase']){
      state['phase'] = 0;
      state['start'] = Date.now();
      //console.log("starting takeoff...");
    }
        
    if(state['mode'] === 'takeoff' || state['mode'] === 'falling'){
      // if takeoff, accelerate to a certain point. also allow user to accelerate/regain movement again if falling.
      const now = Date.now();
      const deltaTime = now - state['start'];
            
      if(state['mode'] === 'falling'){
        state['mode'] === 'takeoff';
      }
            
      if(moveDistance < 1.8){
        const currSpeed = getSpeed(deltaTime/1000);
        moveDistance = 15 * currSpeed * sec;
      }else{
        // check altitude
        if(state['altitude'] > 5.0){
          //console.log("ok i'm flying");
          state['mode'] = 'flying';
        }
      }
    }else if(state['mode'] === 'taxi'){
      moveDistance = 15 * sec;
      //console.log("taxiing...");
    }
        
    if(state['mode'] === 'landing'){
      //console.log("landing!");
      if(state['altitude'] > 0.0){
        thePlayer.translateY(-0.3);
        moveDistance = 1.2;
      }else{
        console.log("touchdown");
        thePlayer.position.y = 0.0;
        resetState(state);
      }
    }
        
    state['speed'] = moveDistance;
    thePlayer.translateZ(-moveDistance);
        
  }else if(state['mode'] === 'falling'){
    // handle deceleration
    if(moveDistance > 0.10){
      const deltaTime = Date.now() - state['start'];
      const currSpeed = getSpeed(-deltaTime/1000);
      moveDistance = 20 * currSpeed * sec;
      //console.log("decelerating...");
            
      if(moveDistance < 0.0){
        moveDistance = 0.0;
      }
            
      thePlayer.translateZ(-moveDistance*2);
    }else{
      moveDistance = 0.0;
    }
        
    if(state['altitude'] > -1.0){
      const deltaTime = Date.now() - state['start'];
      const currSpeed = getSpeed(deltaTime/1000);
      const fallSpeed = 30 * currSpeed * sec;
      thePlayer.translateY(-fallSpeed*3); // -0.9
    }
        
    state['speed'] = moveDistance;
        
    // start over at original position
    if(state['altitude'] < 1.0){
      // since thePlayer is actually a group, we need to reset the position + rotation of the group 
      // and the actual aircraft mesh, which is a child of the group.
      resetPosition(state, thePlayer);
            
      // reset state params like altitude, speed, mode
      resetState(state);
    }
  }else if(state['mode'] === 'landing'){
    console.log("landing!");
    if(state['altitude'] > 0.0){
      // gradually get closer to the ground. plane should be aligned with ground ideally
      thePlayer.translateY(-0.3);
      thePlayer.translateZ(-1.2);
    }else{
      thePlayer.position.y = 0.0;
      resetState(state);
    }
  }
    
  if(keyboard.pressed("S") && state['mode'] === 'taxi'){
    thePlayer.translateZ(moveDistance);
  }
    
  if(keyboard.pressed("A") && state['mode'] !== 'landing'){
    const axis = new THREE.Vector3(0, 1, 0);
    thePlayer.rotateOnAxis(axis, rotationAngle);
  }
    
  if(keyboard.pressed("D") && state['mode'] !== 'landing'){
    const axis = new THREE.Vector3(0, 1, 0);
    thePlayer.rotateOnAxis(axis, -rotationAngle);
  }
    
  if(keyboard.pressed("Q") && thePlayer.position.y > 6.0 && state['mode'] !== 'landing'){
    // https://stackoverflow.com/questions/28848863/threejs-how-to-rotate-around-objects-own-center-instead-of-world-center
    // notice we're not rotating about the group mesh, but the child 
    // mesh of the group, which is actually the jet mesh!
    // if you try to move in all sorts of directions, after a while
    // the camera gets off center and axes seem to get messed up :/
    const axis = new THREE.Vector3(0, 0, 1);
    thePlayer.children[0].rotateOnAxis(axis, -rotationAngle);
  }
    
  if(keyboard.pressed("E") && thePlayer.position.y > 6.0 && state['mode'] !== 'landing'){
    const axis = new THREE.Vector3(0, 0, 1);
    thePlayer.children[0].rotateOnAxis(axis, rotationAngle);
  }
    
  // check altitude
  if(keyboard.pressed("up") && moveDistance >= 1.8 && state['mode'] !== 'landing'){
    // rotate up (note that we're rotating on the mesh's axis. its axes might be configured weird)
    // the forward vector for the mesh might be backwards and perpendicular to the front of the sub
    // up arrow key
    const axis = new THREE.Vector3(1, 0, 0);
    thePlayer.rotateOnAxis(axis, rotationAngle);
  }
    
  // check altitude
  if(keyboard.pressed("down") && moveDistance >= 1.8 && state['mode'] !== 'landing'){
    // down arrow key
    // CLAMP ANGLE?
    const axis = new THREE.Vector3(1, 0, 0);
    thePlayer.rotateOnAxis(axis, -rotationAngle);
  }
    
  // check for collision
  const hasCollision = checkCollision(thePlayer.children[0], raycaster, scene);
  if(hasCollision || thePlayer.position.y < -1.0){
    console.log("collision!");
    thePlayer.children[0].material = thePlayer.hitMaterial;
        
    // crash - reset everything 
    resetPosition(state, thePlayer);
    resetState(state);
  }else{
    thePlayer.children[0].material = thePlayer.originalMaterial;
  }
    
  // how about first-person view?
  let relCameraOffset;
  if(!changeCameraView){
    relCameraOffset = new THREE.Vector3(0, 8, 25);
  }else{
    relCameraOffset = new THREE.Vector3(0, 8, -25);
  }
    
  const cameraOffset = relCameraOffset.applyMatrix4(thePlayer.matrixWorld);
  camera.position.x = cameraOffset.x;
  camera.position.y = cameraOffset.y;
  camera.position.z = cameraOffset.z;
  camera.lookAt(thePlayer.position);
    
}

function animate(){
  //stats.begin();
  //stats.end();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}