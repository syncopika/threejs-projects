// 3D abacus

/* notes 
was trying to use cannon.js but stacking the beads isn't great cause they're jittery :(
seems to be unavoidable - see https://github.com/schteppe/cannon.js/issues/348

might be easier/better to just implement by own collision detection here since
I don't need a lot of complicated physics here anyway. 

it's pretty much just movement along one axis
and some simple bounding boxes ought to suffice for my meshes

edit: turns out raycasting is enough for collision detection with no boxes needed :)
*/

const container = document.getElementById("container");

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 4, 10);

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
scene.background = new THREE.Color(0xeeeeee);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 10, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 10, 0);
scene.add(hemiLight);

// set up trackball control
//const controls = new THREE.TrackballControls(camera, renderer.domElement);
//controls.rotateSpeed = 3.2;
//controls.zoomSpeed = 1.2;
//controls.panSpeed = 0.8;

let theAbacus = null;
const abacusBottomName = 'Cube011';
const abacusMidName = 'Cube010';
const abacusTopName = 'Cube012';

const abacusColumns = {
  'ones': 'bead1',
  'tens': 'bead6',
  'hundred': 'bead11',
  'thousand': 'bead16',
  'ten-thousand': 'bead21',
  'hundred-thousand': 'bead26',
  'million': 'bead31',
  'ten-million': 'bead36',
  'hundred-million': 'bead41',
  'billion': 'bead46',
  //'ten-billion': 'bead51',
};

const abacusBeads = [];

// for abacus bead move animation
const beadMoveDuration = 500; // move bead within 500 milliseconds (0.5 seconds)

let selectedBead = null;

function getAbacusColumnValue(leadingBead, abacus){
  const leadBeadNum = parseInt(leadingBead.name.match(/\d+/g)[0]);
  const colBeads = [];
  for(let i = leadBeadNum + 1; i < leadBeadNum + 5; i++){
    colBeads.push(`bead${i}`);
  }
  
  let colVal = 0;
  if(leadingBead.state === 'down'){
    // when the top bead above the separator thing
    // is down, the number for that column is at least 5
    colVal += 5;
  }
  
  colBeads
    .map(x => abacus.children.find(c => c.name === x))
    .forEach(x => {
      if(x.state === 'up') colVal++;
    });
    
  return colVal;
}

function getCurrAbacusValue(abacus){
  const val = [];
  Object.values(abacusColumns).forEach(k => {
    const leadBead = abacus.children.find(x => x.name === k);
    if(leadBead){
      val.push(getAbacusColumnValue(leadBead, abacus));
    }
  });
  return val.reverse().join('');
}

function displayCurrAbacusValue(){
  const displayElement = document.getElementById('currAbacusValue');
  displayElement.textContent = `current abacus value: ${getCurrAbacusValue(theAbacus)}`;
}

function getObstacleDist(bead, raycaster, direction){
  // important!! need to make sure we use the bead's world position for the raycast ;)
  const beadWorldPos = new THREE.Vector3();
  bead.getWorldPosition(beadWorldPos);
  
  // move the raycast origin slightly to the right so that we can also check against other beads as potentital obstacles 
  // since the beads have an empty center that the raycast will just pass through otherwise
  beadWorldPos.x += 0.6;
  
  if(direction === 'up'){
    raycaster.set(beadWorldPos, new THREE.Vector3(0, 1, 0));
  }else{
    raycaster.set(beadWorldPos, new THREE.Vector3(0, -1, 0));
  }
  
  const intersects = raycaster
    .intersectObjects(scene.children, true);
    
  if(intersects.length){
    const hit = intersects[0];
    return hit.distance;
  }
  
  return 0;
}

function isAtObstacleBoundary(bead, obstacle){
  return bead.position.distanceTo(obstacle.position) < 0.3;
}

renderer.domElement.addEventListener('pointerdown', (evt) => {
  mouse.x = (evt.offsetX / evt.target.width) * 2 - 1;
  mouse.y = -(evt.offsetY / evt.target.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(scene.children, true); // make sure it's recursive
    
  const gotBead = intersects.filter(x => x.object.name.includes('bead'));
  if(gotBead.length){
    const hit = gotBead[0];
    const bead = hit.object;
    selectedBead = bead;
    bead.material.wireframe = true;
    setTimeout(() => bead.material.wireframe = false, 1000);
  }
});

renderer.domElement.addEventListener('pointerup', (evt) => {
  if(selectedBead){
    const currY = -(evt.offsetY / evt.target.height) * 2 + 1;
    const deltaY = currY - mouse.y;
    const moveAmount = 1.2;
    const distThreshold = 0.78;
    const distDiff = 0.3;
    const minYDiff = 0.1;
    
    if(deltaY > minYDiff){
      // move bead up
      const obstacleDist = getObstacleDist(selectedBead, raycaster, 'up');
      if(obstacleDist > distThreshold){
        selectedBead.destination = new THREE.Vector3(
          selectedBead.position.x,
          selectedBead.position.y + Math.min(obstacleDist - distDiff, moveAmount),
          selectedBead.position.z
        );
        selectedBead.moveStart = Date.now();
        selectedBead.state = 'up';
        displayCurrAbacusValue();
      }
    }else if(deltaY < -minYDiff){
      // move bead down
      const obstacleDist = getObstacleDist(selectedBead, raycaster, 'down');
      if(obstacleDist > distThreshold){
        selectedBead.destination = new THREE.Vector3(
          selectedBead.position.x,
          selectedBead.position.y - Math.min(obstacleDist - distDiff, moveAmount),
          selectedBead.position.z
        );
        selectedBead.moveStart = Date.now();
        selectedBead.state = 'down';
        displayCurrAbacusValue();
      }
    }
    
    selectedBead = null;
  }
});

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

getModel('../models/abacus.gltf', 'abacus').then(abacus => {
  scene.add(abacus);
  theAbacus = abacus;
  
  abacus.position.z -= 7;
  abacus.rotateY(Math.PI / 2);
  
  // https://stackoverflow.com/questions/56537085/world-position-of-mesh-is-not-updated-after-rotation
  abacus.updateMatrixWorld();
  
  abacus.children.forEach(bead => {
    if(bead.name.includes('bead')){
      const mat = new THREE.MeshPhongMaterial({color: 0xE97451});
      bead.material = mat;
      abacusBeads.push(bead);
    }
  });
});

function update(){
  const now = Date.now();
  abacusBeads.forEach(b => {
    if(b.moveStart){
      const timeDelta = now - b.moveStart;
      if(timeDelta < beadMoveDuration){
        b.position.lerp(b.destination, timeDelta / beadMoveDuration);
      }else{
        b.position.copy(b.destination);
        b.moveStart = null;
      }
    }
  });
}

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  //controls.update();
  update();
}

animate();