const container = document.getElementById("container");

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 4, 8);
camera.rotateX(-Math.PI/5);

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
pointLight.position.set(0, 3, 0);
pointLight.castShadow = true;
scene.add(pointLight);

const hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 10, 0);
scene.add(hemiLight);

const clock = new THREE.Clock();

const loadedModels = [];
let animationMixerRightHand = null;
let animationMixerLeftHand = null;
let animationClips = null;

let rightHand;
let leftHand;
let plate;
let sponge;
let spongeAttached = false;
let plateAttached = false;

// for cleaning the plate
let lastSpongePos = null;
let durationSoFar = 0;
const durationTillClean = 1; // 1 sec. it takes 1 sec to decrease dirtiness
let dirtiness = 3;

function getModel(modelFilePath, side, name){
  return new Promise((resolve, reject) => {
    loader.load(
      modelFilePath,
      function(gltf){
        if(name === "rightHand" && gltf.animations.length > 0){
          const clips = {};
          gltf.animations.forEach((action) => {
            let name = action['name'].toLowerCase();
            name = name.substring(0, name.length);
            clips[name] = action;
          });
          animationClips = clips;
        }
                
        gltf.scene.traverse((child) => {
          //console.log(child);
          if(child.type === "Mesh" || child.type === "SkinnedMesh"){
            const obj = child;
            if(child.type === "Mesh"){
              //console.log(obj);
            }
            if(name === "rightHand" && child.type === "SkinnedMesh"){
              obj.add(child.skeleton.bones[0]); // this step is important for getting the mesh to show up properly!
            }else if(name === "leftHand" && child.type === "SkinnedMesh"){
              obj.add(child.skeleton.bones[0]);
            }
                        
            obj.name = name;
                        
            resolve(obj); // this will return only one mesh. if you expect a scene to yield multiple meshes, this will fail.
          }
        });
                
        // for the dishes
        if(name === "obj"){
        }
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

loadedModels.push(getModel('../models/hand-edit.gltf', '', 'rightHand'));
loadedModels.push(getModel('../models/hand-edit.gltf', '', 'leftHand'));
loadedModels.push(getModel('../models/plate.gltf', '', 'plate'));
loadedModels.push(getModel('../models/sponge.gltf', '', 'sponge'));

Promise.all(loadedModels).then((objects) => {
  objects.forEach((mesh) => {
    if(mesh.name === "bg"){
      mesh.position.set(0, 0, 0);
      mesh.receiveShadow = true;
    }else if(mesh.name === "plate"){
      // objs that can be equipped
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(-2, -5, 0);
      mesh.scale.x *= 8;
      mesh.scale.y *= 8;
      mesh.scale.z *= 8;;
      plate = mesh;
    }else if(mesh.name === "sponge"){
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(3, -5, 0);
      mesh.scale.x *= 8;
      mesh.scale.y *= 8;
      mesh.scale.z *= 8;   
      sponge = mesh;
    }else if(mesh.name === "rightHand"){
      mesh.castShadow = true;
      rightHand = mesh;
      rightHand.translateX(4);
      rightHand.translateY(-2);
      rightHand.rotateX(-Math.PI/3);
      rightHand.rotateY((3*Math.PI)/2);
            
      //const rightAxesHelper = new THREE.AxesHelper(4);
      //rightHand.add(rightAxesHelper);
            
      animationMixerRightHand = new THREE.AnimationMixer(rightHand);
      const action = animationMixerRightHand.clipAction(animationClips["idle"]);
      console.log(animationMixerRightHand);
            
      for(const bone of rightHand.skeleton.bones){
        if(bone.name === "Bone"){
          rightHand.hand = bone;
          break;
        }
      }
            
      action.play();
            
      animate();
            
    }else if(mesh.name === "leftHand"){
      mesh.castShadow = true;
      leftHand = mesh;
      leftHand.applyMatrix4(new THREE.Matrix4().makeScale(1,1,-1));
      leftHand.translateX(4);
      leftHand.translateY(-2);
      leftHand.rotateX(Math.PI/3);
      leftHand.rotateY((3*Math.PI)/2);
            
      //const leftAxesHelper = new THREE.AxesHelper(4);
      //leftHand.add(leftAxesHelper);
            
      animationMixerLeftHand = new THREE.AnimationMixer(leftHand);
      const action = animationMixerLeftHand.clipAction(animationClips["hold2"]);
            
      // add hand bone to equip tool with as a child of the player mesh
      for(const bone of leftHand.skeleton.bones){
        if(bone.name === "Bone"){
          leftHand.hand = bone; // set an arbitrary new property to access the hand bone
          break;
        }
      }
            
      action.play();
    }
    scene.add(mesh);
    //renderer.render(scene, camera);
  });
});

function attachPlateToLeftHand(){
  if(!plateAttached){
    const handBone = leftHand.hand;
    handBone.add(plate);
    plate.position.set(0.6, 0.8, 1.6);
    plate.rotateZ(-Math.PI/2);
    plateAttached = true;
  }
}

function attachSpongeToRightHand(){
  if(!spongeAttached){
    const handBone = rightHand.hand;
    handBone.add(sponge);
    sponge.position.set(0, 0.7, 0.3);
    sponge.rotateY(-Math.PI/2);
    sponge.rotateZ(Math.PI/2);
        
    animationMixerRightHand = new THREE.AnimationMixer(rightHand);
    const action = animationMixerRightHand.clipAction(animationClips["hold1"]);
    action.play();
        
    spongeAttached = true;
  }
}

function detectSpongeToPlateContact(mouse){
  // use raycast from sponge
  // if within certain distance, consider contact made
  // check duration of contact (TODO: take into account change in sponge distance
  // also so that the user has to actually move the sponge to clean the plate :D)
  // after a certain duration, we can consider the plate to be getting "cleaned"
  // so e.g. one sponge stroke over 1 sec can lower the plate's
  // "dirtiness" rating
  if(plateAttached && dirtiness > 0){
    // https://stackoverflow.com/questions/47799977/three-js-raycasting-performance
    //console.time('raycast: ');
    const gotPlate = raycaster.intersectObject(plate);
    //console.timeEnd('raycast: ');
        
    if(gotPlate.length > 0){
      // we'll 2 results (that are the same) because a plate has 2 sides, and both
      // get hit by the ray
            
      // distance always appears to be the same (~1.43) and it looks fine visually
      // at the given distance so I'm not going to care about the distance
      //const distFromSponge = sponge.position.distanceTo(plate.position);
      //console.log(distFromSponge);
            
      // contact made so start counting duration
      durationSoFar += clock.getDelta();
            
      if(!lastSpongePos){
        lastSpongePos = sponge.position;
      }
            
      // TODO: take into account sponge distance change and not just time elapsed
      //const spongeDistDelta = sponge.position.distanceTo(lastSpongePos);
      //console.log(spongeDistDelta);
            
      if(durationSoFar >= durationTillClean){
        durationSoFar = 0; // reset duration
        dirtiness--;
                
        if(dirtiness === 2){
          const newMat = new THREE.MeshBasicMaterial({color: 0xaa8800});
          plate.material = newMat;
        }else if(dirtiness === 0){
          // change the plate color (probably should use texture instead of vertex paint)
          const newMat = new THREE.MeshBasicMaterial({color: 0xaaaa00});
          plate.material = newMat;
                    
          alert("nice job! you cleaned the plate :D");
        }
      }
            
      lastSpongePos = sponge.position;
    }else{
      // reset when sponge is away from plate
      durationSoFar = 0;
      lastSpongePos = null;
    }
  }
}

function keydown(evt){
  if(evt.keyCode === 71){
    // g key
    attachPlateToLeftHand();
  }else if(evt.keyCode === 83){
    // s key
    attachSpongeToRightHand();
  }
}

function keyup(evt){
}

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);

// allow objects in renderer to be 'clickable'
renderer.domElement.addEventListener('mousedown', (evt) => {
  mouse.x = (evt.offsetX / evt.target.width) * 2 - 1;
  mouse.y = -(evt.offsetY / evt.target.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
    
  const intersects = raycaster.intersectObjects(scene.children, true); // make sure it's recursive
  const gotSponge = intersects.filter(x => x.object.name === "sponge");
  const gotPlate = intersects.filter(x => x.object.name === "plate");
    
  if(gotSponge.length > 0){
    attachSpongeToRightHand();
  }else if(gotPlate.length > 0){
    attachPlateToLeftHand();
  }
});

let lastMove = Date.now();
renderer.domElement.addEventListener('mousemove', (evt) => {
  if(spongeAttached){
    // https://stackoverflow.com/questions/42232001/three-js-performance-very-slow-using-onmousemove-with-raycaster
    if(Date.now() - lastMove < 21){
      return;
    }

    lastMove = Date.now();
        
    mouse.x = (evt.offsetX / evt.target.width) * 2 - 1;
    mouse.y = -(evt.offsetY / evt.target.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
        
    const zPos = rightHand.position.z;
        
    // get the position that's dist along the new ray and set rightHand's position to that
    const dist = rightHand.position.distanceTo(camera.position);
    raycaster.ray.at(dist, rightHand.position);
        
    rightHand.position.z = zPos; // lock the z-axis by reusing the same z pos
    //console.log(rightHand.position);
        
    detectSpongeToPlateContact(mouse);
  }
});


function update(){
  const sec = clock.getDelta();
  const moveDistance = 8 * sec;
  const rotationAngle = (Math.PI / 2) * sec;
    
  //if(leftHand) leftHand.rotateY(rotationAngle);
  //if(rightHand) rightHand.rotateY(rotationAngle);
    
  if(animationMixerLeftHand) animationMixerLeftHand.update(sec);
  if(animationMixerRightHand) animationMixerRightHand.update(sec);
}

function animate(){
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}