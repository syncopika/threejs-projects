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
  
  const selected = intersects.filter(x => x.object.name === 'ground');
  if(selected.length === 1){
    console.log('setting point to move to');
    moveToPosition = selected[0].point;
    moveToPosMarker.position.copy(moveToPosition);
    moveToPosMarker.visible = true;
    setTimeout(() => {moveToPosMarker.visible = false}, 2000);
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
plane.name = 'ground';
scene.add(plane);

const moveToPosMarkerGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
const moveToPosMarkerMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
const moveToPosMarker = new THREE.Mesh(moveToPosMarkerGeo, moveToPosMarkerMat);
moveToPosMarker.visible = false;
scene.add(moveToPosMarker);

// cannon.js world
// used for easy collision detection/physics
// atm specifically for handling the cat reaching for the mug on the table
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const loadedModels = [];

function AnimationHandler(mesh, animations){
  this.mixer = new THREE.AnimationMixer(mesh);
  this.anim = animations;
  this.currentAction = null;
  this.clock = new THREE.Clock();
  
  // chain some animations together, like transitioning from standing to sitting
  this.mixer.addEventListener('finished', (event) => {
    //console.log(event.action);
    if(event.action._clip.name === 'SitDown' || 
      event.action._clip.name === 'Beg' ||
      event.action._clip.name === 'Stretching' ||
      event.action._clip.name === 'Reach2'){
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
    }else if(name === 'Beg' || name === 'Stretching' || name === 'Reach2'){
      action.timeScale = 1.0;
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
loadedModels.push(getModel('../models/table_and_mug.gltf', 'table_and_mug'));

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

function updateCameraPosLerp(factor){
  const catForward = getCatForwardVector();

  // get position slightly behind cat
  catForward.multiplyScalar(6);
  catForward.y += 2.5;

  let cameraDestPos;
  if(!cameraInFront){
    cameraDestPos = new THREE.Vector3(
      theCat.position.x + catForward.x, 
      theCat.position.y + catForward.y, 
      theCat.position.z + catForward.z
    );
  }else{
    cameraDestPos = new THREE.Vector3(
      theCat.position.x - catForward.x, 
      theCat.position.y + catForward.y, 
      theCat.position.z - catForward.z
    );  
  }
  
  camera.position.lerp(cameraDestPos, factor);
}

function getRightPawBone(mesh){
  if(mesh === null){
    return null;
  }
  if(mesh.name === 'Bone008'){
    return mesh;
  }
  if(mesh.children){
    for(let child of mesh.children){
      if(child.type === 'Bone' || child.name === 'Armature'){
        //console.log(`checking ${child.name}...`);
        const result = getRightPawBone(child);
        if(result){
          return result;
        }
      }
    }
  }
  return null;
}

let collisionInProgress = false;
function checkCollisions(){
  // we need to check if the cat's right paw has made contact with the mug on the table
  if(rightPaw && mugMesh){
    const rightPawWorldPos = new THREE.Vector3();
    const mugWorldPos = new THREE.Vector3();
    
    rightPaw.getWorldPosition(rightPawWorldPos);
    mugMesh.getWorldPosition(mugWorldPos);
    
    if(rightPawWorldPos.distanceTo(mugWorldPos) < 0.2 && !collisionInProgress){
      console.log('collision detected!');
      collisionInProgress = true;
      // add impulse to mug's cannon.js box
      const delta = new THREE.Vector3();
      delta.subVectors(rightPaw.position, mugMesh.position);
      //delta.normalize();
      delta.multiplyScalar(50);
      mugCollisionSphere.applyImpulse(new CANNON.Vec3(delta.x, delta.y, delta.z), mugCollisionSphere.position);
    }
  }
}

let theCat = null;
let rightPaw = null;
let mugMesh = null;
let mugCollisionSphere = null;
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
        
        // look for right paw bone (Bone008)
        // attach an invisible box to it that we can use for collision purposes
        const rightPawBone = getRightPawBone(mesh);
        if(rightPawBone){
          console.log('found right paw bone');
          rightPaw = rightPawBone;
          /*
          // I don't think we need this?
          const cubeGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
          const material = new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.0});
          const collisionBox = new THREE.Mesh(cubeGeometry, material);
          rightPawCollisionBox = collisionBox;
          rightPawBone.add(collisionBox);
          */
        }
        
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
      }else if(mesh.name === 'table_and_mug'){
        console.log(mesh);
        mesh.children.forEach(c => {
          c.castShadow = true;
          
          if(c.name === 'Cylinder011'){
            console.log('got mug');
            // this is the mug - setup the needed cannon.js resources for the mug
            // so we can apply impulse to it
            const sphereShape = new CANNON.Sphere(1.0);
            const sphereMat = new CANNON.Material();
            const sphereBody = new CANNON.Body({material: sphereMat, mass: 0.1});
            
            sphereBody.addShape(sphereShape);
            sphereBody.position.x = c.position.x;
            sphereBody.position.y = c.position.y;
            sphereBody.position.z = c.position.z;
            
            world.addBody(sphereBody);
            
            mugCollisionSphere = sphereBody;
            mugMesh = c;
          }
        });
        
        mesh.translateX(10);
        mesh.translateZ(-5);
        scene.add(mesh);
      }
  });
});

// TODO: need to keep track of state better
let isWalking = false;
let isEating = false;
let isSittingIdle = false;
let isNearFoodOrWater = false;

function moveCatToPosition(deltaTime){
  const catMeshPos = new THREE.Vector3();
  theCat.children[0].children[1].getWorldPosition(catMeshPos); // the actual position of the cat mesh unfortunately is in local space since it's nested. we need world space
    
  const distToPos = catMeshPos.distanceTo(moveToPosition);
  if(distToPos < 1.0){ // TODO: this needs to be finetuned?
    console.log("reached moveToPosition, done");
    //console.log(moveToPosition);
    //console.log(theCat.position);
    moveToPosition = null;
    if(isWalking){
      animationHandler.playClipName('Idle1.001', true); // loop this clip
      isWalking = false;
    }
  }else{
    // https://github.com/syncopika/threejs-projects/blob/master/battleships/index.js#L338
    // keep moving to moveToPosition
    // rotate to face position to move to if needed
    
    const posToMoveTo = moveToPosition.clone();
    posToMoveTo.y = 0;
    theCat.lookAt(posToMoveTo);
    
    // rotate another 90 deg since the inherent forward vector of the cat model is through its side lol -__-
    theCat.rotateY(-Math.PI / 2);
    
    // below was me trying to manually figure out the rotation of the cat model towards the point to move to
    // but ended up being kinda hard and the cat model kept rotating :/ (but it kinda worked). something to revisit though perhaps.
    // using lookAt is much easier :)
    /*
    const posToMoveTo = catMeshPos.clone();
    const vecToPos = catMeshPos.sub(moveToPosition).normalize(); // order of vectors when subtracting matters! although I'm a bit confused why subtracting the position I want to go to from the cat's current position gets us the vector we want it seems?
    const catForward = getCatForwardVector();
    const angleToPos = catForward.angleTo(vecToPos);
    console.log(angleToPos);
    const crossProduct = catForward.cross(vecToPos);
    if(Math.abs(angleToPos) > 1.0){
      if(crossProduct.y < 0){
        theCat.rotateY(angleToPos);
      }else{
        theCat.rotateY(-angleToPos);
      }
    }*/
    
    // for debugging
    //console.log(moveToPosition);
    //const origin = new THREE.Vector3(catMeshPos.x, 0, catMeshPos.z);
    //const line = drawVector(origin, moveToPosition, 0xff0000);
    //scene.add(line);
    
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
    
    updateCameraPosLerp(deltaTime);
  }
}

function keydown(evt){
  if(evt.keyCode !== 16){
    // if not shift key
    moveToPosition = null; // if cat was moving to a position, cancel it
  }
  
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
  }else if(evt.keyCode === 66){
    // b key
    animationHandler.playClipName('Beg', false);
  }else if(evt.keyCode === 80){
    // p key
    animationHandler.playClipName('Stretching', false);
  }else if(evt.keyCode === 82){
    // r key
    animationHandler.playClipName('Reach2', false);
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
    const deltaTime = clock.getDelta();
    moveCatToPosition(deltaTime * 10.0);
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
    //const origin = new THREE.Vector3(catMeshPos.x, 0, catMeshPos.z);
    //const line = drawVector(origin, catForward, 0x0000ff);
    //scene.add(line);
    
    const dir = getCatForwardVector();
    raycaster.set(catForward, dir);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if(intersects.length > 0){
      if(intersects[0].object.type == 'Line' || intersects[0].object.type == 'SkinnedMesh'){
        isNearFoodOrWater = false;
      }else if(intersects[0].object.type === 'Mesh' && intersects[0].distance >= 0.3 && intersects[0].distance < 0.5){
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
  
  // here's something neat! see what happens when update() is called after the
  // if-statement below. I think this is because there's a bit of conflict
  // when calling clock.getDelta() and clock.getElapsedTime(). 
  // calling getDelta() first before getElapsedTime() seems to get me pretty close to what I want. tricky! :D
  // see also: https://github.com/mrdoob/three.js/issues/5696
  //
  // and I found this kinda helpful in making sense of getDelta() and its effect on any perceived slowness
  // https://discourse.threejs.org/t/too-slow-animation/2379/7
  update();
  
  if(animationHandler){
    const currTime = clock.getElapsedTime();
    if(currTime - lastTime > 10 && !isWalking && !isSittingIdle){
      animationHandler.playClipName('SitDown', false);
      lastTime = currTime;
      isSittingIdle = true;
    }
  }
  
  // cannon.js stuff
  // TODO: frame rate seems way slow with the physics?
  const delta = Math.min(clock.getDelta(), 0.1);
  world.step(delta);
  
  checkCollisions();
  
  // update mug mesh position + rotation (important when collision happens)
  // based on the cannon.js collision sphere we added for the mug
  if(mugMesh && mugCollisionSphere){
    if(mugCollisionSphere.position.y > -0.5){
      mugMesh.position.set(
        mugCollisionSphere.position.x, 
        mugCollisionSphere.position.y, 
        mugCollisionSphere.position.z
      );
      
      mugMesh.quaternion.set(
        mugCollisionSphere.quaternion.x,
        mugCollisionSphere.quaternion.y,
        mugCollisionSphere.quaternion.z,
        mugCollisionSphere.quaternion.w,
      );
    }else{
      mugCollisionSphere.velocity = new CANNON.Vec3(0, 0, 0);
    }
  }
  
  renderer.render(scene, camera);
}

animate();