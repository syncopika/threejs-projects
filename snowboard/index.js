// snowboarding
import { AnimationController } from './AnimationController.js';

const container = document.getElementById("container");

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 2000);
camera.position.set(0, 4, 10);
const mouse = new THREE.Vector2();
const keyboard = new THREEx.KeyboardState();

const loadingManager = new THREE.LoadingManager();
setupLoadingManager(loadingManager);

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

// set up mobile keyboard
document.getElementById('showKeyboard').addEventListener('click', () => {
  new JSKeyboard(document.getElementById('mobileKeyboard'));
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 300, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

//const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.08);
//scene.add(hemiLight);

const planeGeometry = new THREE.PlaneGeometry(100, 300);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0xfffafa});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.name = 'plane';
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
scene.add(plane);

const clock = new THREE.Clock();
const moveClock = new THREE.Clock(); // this clock is specifically for non-vertical movement control

const raycaster = new THREE.Raycaster();

const loadedModels = [];
let animationController;
let animationMixer = null;
let animationClips = null;

let playerMesh = null;
let boardMesh = null;

let isMoving = false;
let isJumping = false;
let isStillInAir = false;
let time = 0;
let originalPlayerY = 0;
let initialJumpHeight = 0; // y-pos of player when jump starts
let currJumpHeight = 0;    // amount of jump height based on curr time and sin wave after jumping 
const jumpMaxY = 2.0;

function getModel(modelFilePath, side, name){
  return new Promise((resolve, reject) => {
    loader.load(
      modelFilePath,
      function(gltf){
        if(gltf.animations.length > 0 && name === "p1"){
          const clips = {};
          gltf.animations.forEach((action) => {
            let name = action['name'].toLowerCase();
            name = name.substring(0, name.length);
            clips[name] = action;
          });
          animationClips = clips;
          console.log(animationClips);
        }
                
        gltf.scene.traverse((child) => {
          if(child.type === "Mesh" || child.type === "SkinnedMesh"){
            const obj = child;
            obj.name = name;

            if(name === "obj"){
              boardMesh = obj;
              boardMesh.castShadow = true;
              resolve(obj);
            }else{
              if(child.type === "SkinnedMesh"){
                obj.add(child.skeleton.bones[0]); // seems like this is necessary to get the whole player mesh to show
                //console.log(child.skeleton.bones);
                obj.boardAttachmentBone = child.skeleton.bones[14];
                playerMesh = obj;
                playerMesh.castShadow = true;
              }
                            
              resolve(obj); // this will return only one mesh. if you expect a scene to yield multiple meshes, this will fail.
            }
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

loadedModels.push(getModel('../models/snowboarder.gltf', 'player', 'p1'));
loadedModels.push(getModel('../models/snowboard.gltf', 'tool', 'obj'));
loadedModels.push(getModel('../models/pine-tree.gltf', 'obj', 'tree'));
loadedModels.push(getModel('../models/hill.gltf', 'obj', 'hill'));
loadedModels.push(getModel('../models/rock.gltf', 'obj', 'rock'));
loadedModels.push(getModel('../models/cloud.gltf', 'obj', 'cloud'));

const clouds = [];

Promise.all(loadedModels).then(objects => {
  objects.forEach(mesh => {
    if(mesh.name === 'p1'){
      mesh.translateY(1.75);
      mesh.rotateY(Math.PI);
      scene.add(mesh);
            
      originalPlayerY = mesh.position.y;
      //console.log("originalPlayerY: " + originalPlayerY);
            
      animationMixer = new THREE.AnimationMixer(mesh);
      animationController = new AnimationController(mesh, animationMixer, animationClips, clock);
      animationController.changeState('normal');
    }
        
    if(mesh.name === 'tree'){
      const numTrees = 12;
      for(let i = 0; i < numTrees; i++){
        const newTree = mesh.clone();
        const sign = Math.random() > .5 ? -1 : 1;
        newTree.position.set(Math.random() * 40 * sign, 10, Math.random() * -120);
        newTree.scale.set(1.5, 2.5, 1.5);
        newTree.castShadow = true;
        scene.add(newTree);
                
        const light = new THREE.PointLight(0xffffff, 10, 20);
        newTree.add(light);
        light.translateY(5);
      }
    }
        
    if(mesh.name === 'cloud'){
      const numClouds = 5;
      for(let i = 0; i < numClouds; i++){
        const newCloud = mesh.clone();
                
        // emissive will make the cloud completely white
        newCloud.material = new THREE.MeshLambertMaterial({color: 0xffffff, emissive: 0xffffff});
                
        const sign = Math.random() > .5 ? -1 : 1;
        newCloud.position.set(Math.random() * 100 * sign, 70, sign * 180 * Math.random());
        newCloud.scale.set(0.6, 0.6, 0.6);
        newCloud.rotateY(Math.random() * sign);
        newCloud.castShadow = true;
        scene.add(newCloud);
                
        clouds.push(newCloud);
      }
    }
        
    if(mesh.name === 'rock'){
      const numRocks = 12;
      for(let i = 0; i < numRocks; i++){
        const newRock = mesh.clone();
        newRock.material = new THREE.MeshLambertMaterial({color: 0xecdabe});
                
        const sign = Math.random() > .5 ? -1 : 1;
        newRock.position.set(Math.random() * 35 * sign, -0.7, Math.random() * -90);
        newRock.rotateY(Math.random() * sign);
                
        newRock.scale.set(1 + Math.random(), 2 + Math.random(), 1.5);
                
        newRock.castShadow = true;
        scene.add(newRock);
      }
    }
        
    if(mesh.name === 'hill'){
      for(let i = 0; i < 2; i++){
        const newHill = mesh.clone();
        if(i === 0){
          newHill.position.set(-5, 0, -20);
          const newMat = newHill.material.clone();
          newMat.wireframe = true;
          newHill.material = newMat;
        }

        if(i == 1){
          newHill.position.set(5, 0, -80);
        }

        // make the hills a sandy color
        //newHill.material.color.setHex(0xe7ca50);

        newHill.scale.set(20, 20, 20);
        scene.add(newHill);
      }
    }
        
  });
    
  playerMesh.scale.set(0.5, 0.5, 0.5);
  playerMesh.boardAttachmentBone.add(boardMesh);
    
  boardMesh.rotateZ(Math.PI / 2);
  boardMesh.translateY(-0.2);
  boardMesh.translateZ(-0.75);
  boardMesh.rotateX(-Math.PI / 20);
});

function keydown(evt){
  if(evt.code === 'Space'){
    animationController.changeAction('braking');
    animationController.setUpdateTimeDivisor(.52);
  }
    
  if(evt.code === 'KeyJ'){
    if(!isJumping){
      animationController.changeAction('jump');
      animationController.setUpdateTimeDivisor(.50);
            
      initialJumpHeight = playerMesh.position.y;
            
      // add a slight delay before jump so animation runs first
      setTimeout(() => {
        isJumping = true;
      }, 200);
    }
  }
    
  if(evt.code === 'KeyG'){
    if(isJumping || isStillInAir){
      animationController.changeAction('grab');
    }
  }
    
  if(evt.code === 'KeyT'){
    if(isJumping || isStillInAir){
      animationController.changeAction('tailgrab');
    }
  }
}

function keyup(evt){
  if(evt.code === 'Space'){
    animationController.changeAction('idle');
    animationController.setUpdateTimeDivisor(.52);
  }
  if(evt.code === 'KeyA'){
    animationController.changeAction('idle');
  }
  if(evt.code === 'KeyD'){
    animationController.changeAction('idle');
  }
  if(evt.code === 'KeyW'){
    animationController.changeAction('idle');
  }
  if(evt.code === 'KeyG' || evt.code === 'KeyT'){
    animationController.changeAction('moving');
  }
}

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);


function doRaycast(playerMesh, raycaster){
  // aim ray downwards but above the player
  const raycastStart = new THREE.Vector3(playerMesh.position.x, playerMesh.position.y + 20, playerMesh.position.z + 2.0);
  raycaster.set(raycastStart, new THREE.Vector3(0, -1, 0));
    
  const intersects = raycaster.intersectObjects(scene.children, true);
    
  for(let i = 0; i < intersects.length; i++){
    if(intersects[i].object.name === 'hill' || intersects[i].object.name === 'plane' || intersects[i].object.name === 'rock'){
      const currPos = intersects[i].point; // point where the raycast hit
            
      // check if player is still in the air after jumping + making the full arc (like when jumping off the top of a big hill)
      // if yes, we manually decrease their y position TODO: can we make this look nicer? like follow a more realistic curve
      isStillInAir = isStillJumping(playerMesh, raycaster);
            
      let nextY;
      if(isJumping){
        nextY = initialJumpHeight + currJumpHeight + currPos.y;
      }else if(isStillInAir){
        nextY = playerMesh.position.y - 0.3;
      }else{
        nextY = originalPlayerY + currPos.y;
      }

      /*
            console.log("curr pos");
            console.log(playerMesh.position);

            console.log("next vector");
            console.log(nextVec);
            */
            
      // only rotate if moving and not in flight
      if(keyboard.pressed("W") && !isJumping && !isStillInAir){
        const nextVec = new THREE.Vector3(currPos.x - playerMesh.position.x, nextY - playerMesh.position.y, currPos.z - playerMesh.position.z);
        nextVec.normalize();
                
        const forward = new THREE.Vector3(0, 0, 1);
                
        const angleTo = forward.angleTo(nextVec);
            
        const crossProductLength = forward.cross(nextVec);
                
        if(crossProductLength.x > 0){
          playerMesh.rotateX(angleTo);
        }else{
          playerMesh.rotateX(-angleTo);
        }
      }
            
      playerMesh.position.y = nextY;
            
      break; // only handle hill or plane, whichever comes first based on raycast
    }
  }
}

function isStillJumping(playerMesh, raycaster){
  const raycastStart = new THREE.Vector3(playerMesh.position.x, playerMesh.position.y + 20, playerMesh.position.z);
  raycaster.set(raycastStart, new THREE.Vector3(0, -1, 0));
    
  const intersects = raycaster.intersectObjects(scene.children, true);
    
  for(let i = 0; i < intersects.length; i++){
    if(intersects[i].object.name === 'hill' || intersects[i].object.name === 'plane'){
      const hitPos = intersects[i].point;
      if(playerMesh.position.distanceTo(hitPos) > 3){
        // TODO: 3 works well but not sure how to dynamically know?
        return true;
      }
      break;
    }
  }
  return false;
}

function update(){
  const delta = clock.getDelta();
  moveClock.getDelta(); // start moveClock
    
  if(playerMesh && !keyboard.pressed("shift")){
    const relCameraOffset = new THREE.Vector3(0, 2, -10);

    const cameraOffset = relCameraOffset.applyMatrix4(playerMesh.matrixWorld);
    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;

    camera.lookAt(playerMesh.position);
  }else if(keyboard.pressed("shift")){
    const relCameraOffset = new THREE.Vector3(0, 2, 10);

    const cameraOffset = relCameraOffset.applyMatrix4(playerMesh.matrixWorld);
    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;

    camera.lookAt(playerMesh.position);
  }
    
  if(keyboard.pressed("A")){
    animationController.changeAction('turnleft');
    playerMesh.rotateY(Math.PI / 40);
  }
    
  if(keyboard.pressed("D")){
    animationController.changeAction('turnright');
    playerMesh.rotateY(-Math.PI / 40);
  }
    
  if(keyboard.pressed("W")){
    if(animationController.currAction === '' || animationController.currAction === 'idle') animationController.changeAction('moving');
        
    if(!isMoving){
      moveClock.start();
      isMoving = true;
    }
        
    if(isMoving){
      if(Math.sin(moveClock.elapsedTime) > 0.9){
        moveClock.stop();
      }
          
      if(animationController.currAction === 'braking'){
        playerMesh.translateZ(0.1);
      }else{
        playerMesh.translateZ(Math.sin(moveClock.elapsedTime) / 5);
      }
    }
  }
    
  if(playerMesh) doRaycast(playerMesh, raycaster);
    
  if(isJumping){
    // https://discussions.unity.com/t/bouncing-ball-without-physics-gravity/9973
    if(time < 1.0){
      time += delta;
      currJumpHeight = jumpMaxY * Math.sin(time * Math.PI);
    }else{
      time = 0;
      animationController.changeAction('moving');
      console.log("jump ended");
            
      isJumping = false;
    }
  }
    
  // https://discourse.threejs.org/t/animations-looks-different-and-wrong-when-i-play-them-on-three-js/55410/2
  if(animationController) animationController.update(delta);
    
  // move clouds
  clouds.forEach(c => {
    if(c.position.x < -100){
      c.position.x = 100;
    }
        
    if(c.position.z < -100){
      c.position.z = 100;
    }
        
    if(c.position.x > 100){
      c.position.x = -100;
    }
        
    if(c.position.z > 100){
      c.position.z = -100;
    }
        
    // TODO: add some shader to make the vertices constantly shift around like real clouds?
    // allow them to morph shape
        
    const fwd = getForward(c);
    fwd.multiplyScalar(0.03);
    c.position.add(fwd);
  });
    
  // when user stops pressing w, reset clock
  // so player will incrementally speed up again on next w press
  if(isMoving && !keyboard.pressed("W")){
    moveClock.stop(); // reset
    isMoving = false;
  }
}

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}

animate();