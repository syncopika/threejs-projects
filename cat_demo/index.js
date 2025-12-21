// cat demo
const container = document.getElementById('container');

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);

// optional stuff
//const keyboard = new THREEx.KeyboardState();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* set up trackball control if needed
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 3.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
*/

// set up mobile keyboard
document.getElementById('showKeyboard').addEventListener('click', () => {
  new JSKeyboard(document.getElementById('mobileKeyboard'));
});

const loadingManager = new THREE.LoadingManager();
setupLoadingManager(loadingManager);

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

let moveToPosition = null;
renderer.domElement.addEventListener('mousedown', (evt) => {    
  mouse.x = (evt.offsetX / evt.target.width) * 2 - 1;
  mouse.y = -(evt.offsetY / evt.target.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
    
  const intersects = raycaster.intersectObject(scene, true); // make sure it's recursive
  
  if(intersects.length === 1){
    // TODO: make sure it's the plane object
    console.log('setting point to move to');
    moveToPosition = intersects[0].point;
    moveToPosMarker.position.copy(moveToPosition);
  }else{
    console.log("intersects length is not 1");
    return;
  }
  
  const selected = intersects.filter(x => console.log(x));
  if(selected.length > 0){
    const s = selected[0];
    console.log(s);
  }
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);
scene.add(camera);

const clock = new THREE.Clock();
let lastTime = clock.getElapsedTime();

//const spotLight = new THREE.SpotLight(0xffffff);
//spotLight.position.set(0, 45, 0);
//spotLight.castShadow = true;
//spotLight.shadow.mapSize.width = 4096;
//spotLight.shadow.mapSize.height = 4096;
//scene.add(spotLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 25, 10);
pointLight.castShadow = true;
//console.log(pointLight.shadow);
scene.add(pointLight);

const hemiLight = new THREE.HemisphereLight(0xaaaaaa);
hemiLight.position.set(0, 30, 0);
scene.add(hemiLight);

// add a plane
const planeGeometry = new THREE.PlaneGeometry(30, 30);
const texture = new THREE.TextureLoader().load('../models/grass2.jpg');
const terrainMat = new THREE.MeshPhongMaterial({map: texture});
//const planeMaterial = new THREE.MeshLambertMaterial({color: 0xdddddd}); //0x055C9D});
const plane = new THREE.Mesh(planeGeometry, terrainMat);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.translateZ(-0.66);
scene.add(plane);

const moveToPosMarkerGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
const moveToPosMarkerMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
const moveToPosMarker = new THREE.Mesh(moveToPosMarkerGeo, moveToPosMarkerMat);
scene.add(moveToPosMarker);

const loadedModels = [];

function AnimationHandler(mesh, animations){
  this.mixer = new THREE.AnimationMixer(mesh);
  this.anim = animations;
  this.currentAction = null;
  this.clock = new THREE.Clock();
  
  // chain some animations together, like transitioning from standing to sitting
  this.mixer.addEventListener('finished', (event) => {
    //console.log(event.action);
    if(event.action._clip.name === 'SitDown'){
      this.playClipName('SittingIdle', true);
    }
  });
  
  this.playClipName = function(name, loopRepeat, pauseBool){
    // stop the current clip
    if(this.currentAction) this.currentAction.stop();
    
    const clip = THREE.AnimationClip.findByName(this.anim, name);
    const action = this.mixer.clipAction(clip); // AnimationAction type
    action.loop = loopRepeat ? THREE.LoopPingPong : THREE.LoopOnce;
    
    if(name === 'Walk' || name === 'Eating'){
      action.timeScale = 0.8;
    }else{
      action.timeScale = 0.3;
    }
      
    this.currentAction = action;
        
    // stop at last frame
    if(pauseBool) action.clampWhenFinished = true;
        
    action.play();
    action.reset();
  };
}

let animationHandler = null;

function getModel(modelFilePath, name){
  return new Promise((resolve) => {
    loader.load(
      modelFilePath,
      function(gltf){
        if(name === 'cat'){
          animationHandler = new AnimationHandler(gltf.scene, gltf.animations);
          console.log(animationHandler);
        }
        gltf.scene.name = name;
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

loadedModels.push(getModel('../models/cat.gltf', 'cat'));
loadedModels.push(getModel('../models/cat-food-dish.gltf', 'food-dish'));
loadedModels.push(getModel('../models/cat-water-dish.gltf', 'water-dish'));

function createRing(radius){
  // https://stackoverflow.com/questions/69404468/circle-with-only-border-in-threejs
  const points = new THREE.BufferGeometry().setFromPoints(
    new THREE.Path().absarc(0, 0, radius, 0, Math.PI * 2).getSpacedPoints(25)
  );
  const lineMat = new THREE.LineBasicMaterial({});
  const ring = new THREE.Line(points, lineMat);
  ring.rotateY(Math.PI / 2);
  ring.position.x += 1.3;
  ring.position.y += 0.2;
  return ring;
}

function createBox(){
  const cubeGeometry = new THREE.BoxGeometry(0.7, 1.7, 0.7);
  const material = new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0});
  return new THREE.Mesh(cubeGeometry, material);
}

// TODO: fix forward vector on model in Blender?
function getCatForwardVector(){
  if(!theCat){
    return new THREE.Vector3();
  }
  
  const worldDir = new THREE.Vector3();
  theCat.getWorldDirection(worldDir);
  
  // too lazy to fix the forward on the model atm so we'll do it here
  worldDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2); // this is the forward vector for the cat
    
  return worldDir;
}

let cameraInFront = false;
function updateCameraPos(){
  if(!theCat){
    return;
  }
  
  // move camera behind cat
  const catForward = getCatForwardVector();

  // get position slightly behind cat
  catForward.multiplyScalar(6);
  catForward.y += 2.5;

  if(!cameraInFront){
    camera.position.set(
      theCat.position.x + catForward.x, 
      theCat.position.y + catForward.y, 
      theCat.position.z + catForward.z
    );
  }else{
    camera.position.set(
      theCat.position.x - catForward.x, 
      theCat.position.y + catForward.y, 
      theCat.position.z - catForward.z
    );  
  }
}

let theCat = null;
Promise.all(loadedModels).then((objects) => {
  objects.forEach((mesh) => {
      if(mesh.name === 'cat'){
        // mesh here is actually the whole scene containing the cat and its armature
        // scene -> armature -> bones + cat mesh (in that order)
        mesh.children[0].children[1].castShadow = true;
        
        // TODO: remove map texture from model in Blender - just do vertex coloring?
        mesh.children[0].children[1].material.map = null;
        mesh.children[0].children[1].material.color = new THREE.Color(0xcccccc);
        mesh.children[0].children[1].material.needsUpdate = true;
        
        // give the cat a green circle to indicate it's an active playable character?
        const ring = createRing(1.6);
        mesh.children[0].children[1].add(ring);
        
        theCat = mesh;
        console.log(mesh);
        scene.add(mesh);
        
        updateCameraPos();
        
        animationHandler.playClipName('Idle1.001', true);
        
        animate();
      }else if(mesh.name === 'food-dish'){
        const foodDish = mesh.children[0];
        foodDish.castShadow = true;
        foodDish.receiveShadow = true;
        
        // put the dish in a cube for easier raycast hit
        const box = createBox();
        box.add(foodDish);
        
        box.translateZ(5);
        box.translateX(10);
        box.translateY(-0.6);
        
        scene.add(box);
      }else if(mesh.name === 'water-dish'){
        const waterDish = mesh.children[0];
        waterDish.castShadow = true;
        waterDish.receiveShadow = true;
        
        // put the dish in a cube for easier raycast hit
        const box = createBox();
        box.add(waterDish);
        
        box.translateZ(7);
        box.translateX(10);
        box.translateY(-0.6);
        
        scene.add(box);
      }
  });
});

// TODO: need to keep track of state better
let isWalking = false;
let isEating = false;
let isSittingIdle = false;
let isNearFoodOrWater = false;

function moveCatToPosition(){
  const catMeshPos = new THREE.Vector3();
  theCat.children[0].children[1].getWorldPosition(catMeshPos); // the actual position of the cat mesh unfortunately is in local space since it's nested. we need world space
    
  const distToPos = catMeshPos.distanceTo(moveToPosition);
  if(distToPos < 1.0){ // TODO: this needs to be finetuned
    console.log("reached moveToPosition, done");
    console.log(moveToPosition);
    console.log(theCat.position);
    moveToPosition = null;
    if(isWalking){
      animationHandler.playClipName('Idle1.001', true); // loop this clip
      isWalking = false;
    }
  }else{
    // https://github.com/syncopika/threejs-projects/blob/master/battleships/index.js#L338
    // keep moving to moveToPosition
    // rotate to face position to move to if needed
    const posToMoveTo = catMeshPos.clone();
    const vecToPos = catMeshPos.sub(moveToPosition).normalize(); // order of vectors when subtracting matters! although I'm a bit confused why subtracting the position I want to go to from the cat's current position gets us the vector we want it seems?
    const catForward = getCatForwardVector().normalize();
    const angleToPos = catForward.angleTo(vecToPos);
    console.log(angleToPos);
    const crossProduct = catForward.cross(vecToPos);
    if(Math.abs(angleToPos) > 1){
      if(crossProduct.y < 0){
        theCat.rotateY(angleToPos);
      }else{
        theCat.rotateY(-angleToPos);
      }
    }
    
    // for debugging
    //console.log(moveToPosition);
    const origin = new THREE.Vector3(catMeshPos.x, 0, catMeshPos.z);
    const line = drawVector(origin, moveToPosition, 0xff0000);
    scene.add(line);
    
    // then move
    const newForward = getCatForwardVector();
    newForward.multiplyScalar(-0.02);
    theCat.position.add(newForward);
    
    if(!isWalking){
      animationHandler.playClipName('Walk', true);
      isWalking = true;
      isSittingIdle = false;
      isEating = false;
    }
    
    //updateCameraPos();
  }
}

function keydown(evt){
  moveToPosition = null; // if cat was moving to a position, cancel it
  if(evt.keyCode === 32){
    // spacebar
    if(!isWalking){
      // allow eating/drinking only if near food/water
      if(!isEating && isNearFoodOrWater){
        animationHandler.playClipName('Eating', false, true);
        isEating = true;
      }else{
        animationHandler.playClipName('SittingIdle', true);
        isEating = false;
      }
    }
  }else if(evt.keyCode === 87){
    //w key
    const vec = getCatForwardVector();
    vec.multiplyScalar(-0.2);
    theCat.position.add(vec);
    
    if(!isWalking){
      animationHandler.playClipName('Walk', true);
      isWalking = true;
      isSittingIdle = false;
      isEating = false;
    }
    
    updateCameraPos();
  }else if(evt.keyCode === 83){
    //s key
    const vec = getCatForwardVector();
    vec.multiplyScalar(0.2);
    theCat.position.add(vec);
    
    if(!isWalking){
      animationHandler.playClipName('Walk', true); // TODO: play in reverse?
      isWalking = true;
      isSittingIdle = false;
      isEating = false;
    }
    
    updateCameraPos();
  }else if(evt.keyCode === 65){
    // a key
    theCat.rotateY(.2);
    updateCameraPos();
  }else if(evt.keyCode === 68){
    // d key
    theCat.rotateY(-.2);
    updateCameraPos();
  }
}
document.addEventListener('keydown', keydown);

function keyup(evt){
  if(evt.keyCode === 32){
    // spacebar
  }else if(evt.keyCode === 87){
    //w key
    if(isWalking){
      animationHandler.playClipName('Idle1.001', true); // loop this clip
      isWalking = false;
    }
  }else if(evt.keyCode === 83){
    //s key
    if(isWalking){
      animationHandler.playClipName('Idle1', true);
      isWalking = false;
    }
  }else if(evt.keyCode === 65){
    // a key
  }else if(evt.keyCode === 68){
    // d key
  }else if(evt.keyCode === 16){
    // shift key
    cameraInFront = !cameraInFront;
    updateCameraPos();
  }
}
document.addEventListener('keyup', keyup);

document.getElementById('wireframe').addEventListener('change', (evt) => {
  if(theCat){
    theCat.children[0].children[1].material.wireframe = evt.target.checked;
  }
});

document.getElementById('shadow').addEventListener('change', (evt) => {
  if(theCat){
    renderer.shadowMap.enabled = evt.target.checked;
    renderer.shadowMap.needsUpdate = true;
    theCat.children[0].children[1].castShadow = evt.target.checked;
    plane.receiveShadow = evt.target.checked;
  }
});

document.getElementById('flatShading').addEventListener('change', (evt) => {
  if(theCat){
    theCat.children[0].children[1].material.flatShading = evt.target.checked;
    theCat.children[0].children[1].material.needsUpdate = true;
  }
});

function update(){
  // move stuff around, etc.
  if(animationHandler){
    const sec = animationHandler.clock.getDelta();
    animationHandler.mixer.update(sec);
  }
  
  if(theCat && moveToPosition){
    moveCatToPosition();
  }
  
  // raycast for detecting things
  if(theCat){
    const catMeshPos = new THREE.Vector3();
    theCat.children[0].children[1].getWorldPosition(catMeshPos); // the actual position of the cat mesh unfortunately is in local space since it's nested. we need world space
    catMeshPos.y = 0;
    
    // set catForward at some point ahead of the cat
    const catForward = getCatForwardVector();
    catForward.multiplyScalar(-2.2);
    catForward.add(catMeshPos);
    
    // drawing lines for debugging
    const origin = new THREE.Vector3(catMeshPos.x, 0, catMeshPos.z);
    const line = drawVector(origin, catForward, 0x0000ff);
    scene.add(line);
    
    const dir = getCatForwardVector();
    raycaster.set(catForward, dir);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if(intersects.length > 0){
      if(intersects[0].object.type == 'Line' || intersects[0].object.type == 'SkinnedMesh'){
        isNearFoodOrWater = false;
      }else if(intersects[0].object.type === 'Mesh' && intersects[0].distance >= 0.3 && intersects[0].distance < 0.5){
        console.log(intersects[0]);
        console.log(theCat);
        // should only be food or water currently
        isNearFoodOrWater = true;
      }else{
        isNearFoodOrWater = false;
      }
    }else{
      isNearFoodOrWater = false;
    }
    
    if(isNearFoodOrWater){
        const ring = theCat.children[0].children[1].children[0];
        ring.material.color.setHex(0x32cd32);
        ring.material.needsUpdate = true;
        theCat.children[0].children[1].material.transparent = true;
        theCat.children[0].children[1].material.opacity = 0.3;
    }else{
        const ring = theCat.children[0].children[1].children[0];
        ring.material.color.setHex(0xffffff);
        ring.material.needsUpdate = true;
        //console.log(theCat.children[0].children[1]);
        theCat.children[0].children[1].material.transparent = false;
    }
  }
}

function animate(){
  //controls.update(); // update trackball control
  requestAnimationFrame(animate);
  
  if(theCat){
    camera.lookAt(theCat.position);
  }
  
  if(animationHandler){
    const currTime = clock.getElapsedTime();
    if(currTime - lastTime > 10 && !isWalking && !isSittingIdle){
      animationHandler.playClipName('SitDown', false);
      lastTime = currTime;
      isSittingIdle = true;
    }
  }
  
  update();
  
  renderer.render(scene, camera);
}

animate();