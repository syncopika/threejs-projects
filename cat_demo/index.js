// cat demo
const container = document.getElementById('container');

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);

// optional stuff
//const keyboard = new THREEx.KeyboardState();
//const raycaster = new THREE.Raycaster();
//const mouse = new THREE.Vector2();

/* set up trackball control if needed
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 3.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
*/

const loadingManager = new THREE.LoadingManager();
setupLoadingManager(loadingManager);

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(camera);

const clock = new THREE.Clock();
let lastTime = clock.getElapsedTime();

/*
const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 80, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);
*/

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 25, 0);
pointLight.castShadow = true;
scene.add(pointLight);

//const hemiLight = new THREE.HemisphereLight(0xffffff);
//hemiLight.position.set(0, 10, 0);
//scene.add(hemiLight);

// add a plane
const planeGeometry = new THREE.PlaneGeometry(30, 30);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0xdddddd}); //0x055C9D});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.translateZ(-0.63);
scene.add(plane);

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
  // move camera behind cat
  const catForward = getCatForwardVector();

  // get position slightly behind cat
  catForward.multiplyScalar(6);
  catForward.y += 4;

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
        // https://stackoverflow.com/questions/69404468/circle-with-only-border-in-threejs
        const points = new THREE.BufferGeometry().setFromPoints(
          new THREE.Path().absarc(0, 0, 1.6, 0, Math.PI * 2).getSpacedPoints(25)
        );
        const lineMat = new THREE.LineBasicMaterial({color: 0x32cd32});
        const ring = new THREE.Line(points, lineMat);
        ring.rotateY(Math.PI / 2);
        ring.position.x += 1.3;
        mesh.children[0].children[1].add(ring);
        
        theCat = mesh;
        console.log(mesh);
        scene.add(mesh);
        
        updateCameraPos();
        
        animationHandler.playClipName('Idle1.001', true);
        
        animate();
      }else if(mesh.name === 'food-dish'){
        scene.add(mesh);
        mesh.children[0].castShadow = true;
        mesh.children[0].receiveShadow = true;
        mesh.translateZ(5);
        mesh.translateX(10);
        mesh.translateY(-0.6);
      }else if(mesh.name === 'water-dish'){
        scene.add(mesh);
        mesh.children[0].castShadow = true;
        mesh.children[0].receiveShadow = true;
        mesh.translateZ(7);
        mesh.translateX(10);
        mesh.translateY(-0.6);
      }
  });
});

// TODO: need to keep track of state better
let isWalking = false;
let isEating = false;
let isSittingIdle = false;
function keydown(evt){
  if(evt.keyCode === 32){
    // spacebar
    if(!isWalking){
      // allow eating/drinking
      if(!isEating){
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
  }else if(evt.keyCode === 16){
    // shift key
    cameraInFront = !cameraInFront;
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

/*
document.getElementById('flatShading').addEventListener('change', (evt) => {
  if(theCat){
    // TODO: not currently working?? need to check normals in Blender maybe (might need to invert normals)
    theCat.children[0].children[1].material.flatShading = evt.target.checked;
  }
});*/

function update(){
  // move stuff around, etc.
  if(animationHandler){
    const sec = animationHandler.clock.getDelta();
    animationHandler.mixer.update(sec);
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