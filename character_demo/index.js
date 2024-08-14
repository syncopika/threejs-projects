import { AnimationController } from "../libs/AnimationController.js";

const container = document.getElementById("container");
const fov = 60;
const defaultCamera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const raycaster = new THREE.Raycaster();
const loadingManager = new THREE.LoadingManager();

/* const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
 */

setupLoadingManager(loadingManager);

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

// set up mobile keyboard
document.getElementById("showKeyboard").addEventListener("click", () => {
  new JSKeyboard(document.getElementById("mobileKeyboard"));
});

const camera = defaultCamera;
camera.position.set(0,5,20);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);    
scene.add(camera);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 20, -25);
pointLight.castShadow = true;
scene.add(pointLight);

const hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const clock = new THREE.Clock();
let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;

let animationController;
const loadedModels = [];
let animationMixer = null;
let animationClips = null;
let currAction = null;

let neckMarker = null;

function getModel(modelFilePath, side, name){
  return new Promise((resolve, reject) => {
    loader.load(
      modelFilePath,
      function(gltf){
        if(gltf.animations.length > 0 && name === "p1"){
          const clips = {};
          gltf.animations.forEach((action) => {
            let name = action.name.replace("1", "").toLowerCase();
            name = name.substring(0, name.length);
            
            // from libs/utils.js
            removeUnneededAnimationTracks(action);
            
            clips[name] = action;
          });
          animationClips = clips;
        }
        
        // if a scene has multiple meshes you want (like for the m4 carbine),
        // do the traversal and attach the magazine mesh as a child or something to the m4 mesh.
        // then resolve the thing outside the traverse.
        const carbine = [];
        gltf.scene.traverse((child) => {
          if(child.type === "Mesh" || child.type === "SkinnedMesh"){
            const obj = child;

            if(name === "obj"){
              obj.scale.x = child.scale.x * 1.1;
              obj.scale.y = child.scale.y * 1.1;
              obj.scale.z = child.scale.z * 1.1;
              carbine.push(obj);
            }else{
              if(child.type === "SkinnedMesh"){
                obj.add(child.skeleton.bones[0]); // add pelvis to mesh as a child
                            
                if(name !== "obj"){
                  obj.scale.x *= .3;
                  obj.scale.y *= .3;
                  obj.scale.z *= .3;
                }
              }
                            
              if(name === "bg"){
                obj.scale.x = child.scale.x * 10;
                obj.scale.y = child.scale.y * 10;
                obj.scale.z = child.scale.z * 10;
              }
                            
              obj.name = name;
                            
              resolve(obj); // this will return only one mesh. if you expect a scene to yield multiple meshes, this will fail.
            }
          }
        });
                
        // for the carbine (or really any scene with multiple meshes)
        if(name === "obj"){
          const m4carbine = carbine[0];
          m4carbine.add(m4carbine.skeleton.bones[0]);
          m4carbine.name = name;
                    
          const magazine = carbine[1];
          m4carbine.magazine = magazine;
          m4carbine.skeleton.bones[1].add(magazine); // add magazine to the mag bone

          m4carbine.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/2);
          m4carbine.rotateOnAxis(new THREE.Vector3(0,0,-1), Math.PI/2);

          resolve(m4carbine);
        }
      },
      // called while loading is progressing
      function(xhr){
        console.log( (xhr.loaded / xhr.total * 100) + "% loaded" );
      },
      // called when loading has errors
      function(error){
        console.log("An error happened");
        console.log(error);
      }
    );
  });
}

// https://threejs.org/docs/#api/en/textures/Texture
loadedModels.push(getModel("../models/oceanfloor.glb", "none", "bg"));
loadedModels.push(getModel("../models/humanoid-rig.gltf", "player", "p1"));
loadedModels.push(getModel("../models/m4carbine-final.gltf", "tool", "obj"));

let thePlayer = null;
let tool = null;
let terrain = null;
let firstPersonViewOn = false;
let sideViewOn = false;

Promise.all(loadedModels).then((objects) => {
  objects.forEach((mesh) => {
    if(mesh.name === "bg"){
      mesh.position.set(0, 0, 0);
      mesh.receiveShadow = true;
      terrain = mesh;
    }else if(mesh.name === "npc"){
      // npcs?
    }else if(mesh.name === "obj"){
      // tools that can be equipped
      mesh.castShadow = true;
      tool = mesh;
      tool.visible = false;
    }else{
      mesh.castShadow = true;
      thePlayer = mesh;

      // add a 3d object (cube) to serve as a marker for the 
      // location of the head of the mesh. we"ll use this to 
      // create a vertical ray towards the ground
      // this ray can tell us the current height.
      // if the height is < the height of our character,
      // we know that we"re on an uphill part of the terrain 
      // and can adjust our character accordingly
      // similarly, if the height is > the character height, we"re going downhill
      const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
      const head = new THREE.Mesh(cubeGeometry, material);
      
      const neck = mesh.skeleton.bones.find(x => x.name === "Neck");
      
      const cubeGeometry2 = new THREE.BoxGeometry(2.2, 2.2, 2.2);
      const material2 = new THREE.MeshBasicMaterial({color: 0x0000ff});
      neckMarker = new THREE.Mesh(cubeGeometry2, material2);
      neck.add(neckMarker);
      //neckMarker.material.wireframe = true;
      neckMarker.material.transparent = true;
      neckMarker.material.opacity = 0.0;
      
      mesh.neck = neck;
      
      mesh.add(head);
      mesh.head = head;
      head.position.set(0, 4, 0);
            
      animationMixer = new THREE.AnimationMixer(mesh);
      animationController = new AnimationController(thePlayer, animationMixer, animationClips, clock);
      animationController.changeState("normal"); // set normal state by default for animations. see animation_state_map.json
      
      mesh.position.set(0, 2.8, -10);
      mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI);
      mesh.originalColor = mesh.material;
            
      // alternate materials used for the sub depending on condition 
      const hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
      mesh.hitMaterial = hitMaterial;
      mesh.originalMaterial = mesh.material;
            
      // add hand bone to equip tool with as a child of the player mesh
      for(const bone of thePlayer.skeleton.bones){
        if(bone.name === "HandR001"){ // lol why is it like this??
          thePlayer.hand = bone; // set an arbitrary new property to access the hand bone
          break;
        }
      }

      animate();
    }
    scene.add(mesh);
    renderer.render(scene, camera);
  });
});

// checkTerrainHeight comes from utils.js in /lib
function adjustVerticalHeightBasedOnTerrain(thePlayer, raycaster, scene){
  // for now I"m hardcoding the expected height at level terrain 
  const baseline = 2.75;
  const head = getCenter(thePlayer.head);
  const verticalDirection = checkTerrainHeight(head, raycaster, terrain, document.getElementById("height"));
    
  if(verticalDirection < 2.74){
    // go uphill so increase y
    const deltaY = baseline - verticalDirection;
    thePlayer.position.y += deltaY;
  }else if(verticalDirection > 2.76){
    // go downhil so decrease y
    const deltaY = verticalDirection - baseline;
    thePlayer.position.y -= deltaY;
  }
}

function moveBasedOnAction(controller, thePlayer, speed, reverse){
  const action = controller.bottomAnimation.name;
  if(action && (action.includes("walk") || action.includes("run"))){
    if(action.includes("run")){
      speed += 0.12;
    }
    if(reverse){
      thePlayer.translateZ(-speed);
    }else{
      thePlayer.translateZ(speed);
    }
  }
}

function keydown(evt){
  if(evt.code === "ShiftLeft"){
    // toggle between walk and run while moving
    if(currAction === "walk"){
      currAction = "run";
      animationController.setUpdateTimeDivisor(.12);
      animationController.changeAction("run-arms", "top");
      animationController.changeAction("run-legs", "bottom");
    }
  }else if(evt.code === "KeyG"){
    // for toggling weapon/tool equip
    // https://stackoverflow.com/questions/19031198/three-js-attaching-object-to-bone
    // https://stackoverflow.com/questions/54270675/three-js-parenting-mesh-to-bone
    const handBone = thePlayer.hand;
    if(handBone.children.length === 0){
      handBone.add(tool);
      // also register the tool in the animationcontroller so we can hide it at the 
      // right time when de-equipping
      // yeah, doing it this way is still kinda weird. :/
      animationController.addObject(tool);
    }
        
    // adjust location of tool 
    tool.position.set(0, 0.2, -0.3); // the coordinate system is a bit out of whack for the weapon...
        
    // the weapon-draw/hide animation should lead directly to the corresponding idle animation
    // since I have the event listener for a "finished" action set up
    let timeScale = 1;
        
    if(animationController.currState === "normal"){
      tool.visible = true;
      animationController.changeState("equip"); // equip weapon
    }else{
      animationController.changeState("normal"); // go back to normal state
      timeScale = -1; // need to play equip animation backwards to put away weapon
    }
    
    currAction = "drawgun";
    animationController.setUpdateTimeDivisor(.20);
    animationController.changeAction("drawgun", "top", timeScale);
  }else if(evt.code === "Digit1"){
    // toggle first-person view
    firstPersonViewOn = !firstPersonViewOn;
    sideViewOn = false;
        
    // make sure camera is in the head position
    // and that the camera is parented to the character mesh
    // so that it can rotate with the mesh
    if(firstPersonViewOn){
      neckMarker.add(camera);
      camera.position.copy(thePlayer.head.position);
      camera.position.z -= 1.5;
      camera.position.y -= 1.2;
      camera.rotation.set(0, Math.PI, 0);
    }else{
      scene.add(camera);
    }
  }else if(evt.code === "Digit2"){
    // toggle side view
    firstPersonViewOn = false;
    sideViewOn = !sideViewOn;
  }
}

function keyup(evt){
  if(evt.code === "ShiftLeft"){
    if(currAction === "run"){
      currAction = "walk";
      animationController.setUpdateTimeDivisor(.12);
      animationController.changeAction("walk-arms", "top");
      animationController.changeAction("walk-legs", "bottom");
    }
  }
}

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);


function update(){
  sec = clock.getDelta();
  moveDistance = 8 * sec;
  rotationAngle = (Math.PI / 2) * sec;
  let changeCameraView = false;
    
  if(keyboard.pressed("z")){
    changeCameraView = true;
  }
    
  if(keyboard.pressed("w")){
    // moving forwards
    if(currAction !== "run"){
      currAction = "walk";
      animationController.setUpdateTimeDivisor(.10);
      animationController.changeAction("walk-legs", "bottom");
    }
    moveBasedOnAction(animationController, thePlayer, moveDistance, false);   
  }else if(keyboard.pressed("s")){
    // moving backwards
    if(currAction !== "run"){
      currAction = "walk";
      animationController.setUpdateTimeDivisor(.10);
      animationController.changeAction("walk-legs", "bottom", -1);
    }
    moveBasedOnAction(animationController, thePlayer, moveDistance, true);
  }else if(!keyboard.pressed("w") && !keyboard.pressed("s")){
    // for idle pose
    if(currAction !== "drawgun"){
      currAction = "idle";
      animationController.setUpdateTimeDivisor(.50);
      animationController.changeAction("idle-arms", "top");
      animationController.changeAction("idle-legs", "bottom");
    }
  }
    
  if(keyboard.pressed("a")){
    thePlayer.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationAngle);
  }
    
  if(keyboard.pressed("d")){
    thePlayer.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotationAngle);
  }
  
  if(keyboard.pressed("q")){
    animationController.changeAction("leftlean", "top");
  }else if(keyboard.pressed("e")){
    animationController.changeAction("rightlean", "top");
  }
    
  adjustVerticalHeightBasedOnTerrain(thePlayer, raycaster, scene);
    
  // keep the current animation running
  animationController.update();
    
  let relCameraOffset;
    
  if(sideViewOn){
    relCameraOffset = new THREE.Vector3(-10, 3, 0);
  }else if(!changeCameraView){
    relCameraOffset = new THREE.Vector3(0, 3, -15);
  }else{
    relCameraOffset = new THREE.Vector3(0, 3, 15);
  }
  
  if(!firstPersonViewOn){
    const cameraOffset = relCameraOffset.applyMatrix4(thePlayer.matrixWorld);
    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;
  }
  
  if(!firstPersonViewOn) camera.lookAt(thePlayer.position);
}

function animate(){
  //stats.begin();
  //stats.end();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}