// Rubik's cube
//
// make sure your model is correct in blender.
// I wasted way too much time trying to figure out why my cubes shared the same position and trying out all sorts of dumb stuff -__-
// https://blender.stackexchange.com/questions/305802/why-2-objects-have-same-location-orientation-scale-and-origin-yet-theyre-disp

const container = document.getElementById("container");
//const keyboard = new THREEx.KeyboardState();

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 4, 20);

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

const axesHelper = new THREE.AxesHelper(10);

// TODO: allow user to pick a layer of the cube to rotate
renderer.domElement.addEventListener('pointerdown', (evt) => {
    mouse.x = (evt.offsetX / evt.target.width) * 2 - 1;
    mouse.y = -(evt.offsetY / evt.target.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    //console.log('raycasting...');
    
    const intersects = raycaster.intersectObjects(scene.children, true); // make sure it's recursive
    
    const gotCube = intersects.filter(x => x.object.name.includes("Cube"));
    if(gotCube.length){
        const hit = gotCube[0];
        const cube = hit.object;
        console.log(cube);
        cube.material.wireframe = true;
        setTimeout(() => cube.material.wireframe = false, 1000);
        //sphere.position.copy(cube.position);
        //selectCubeGroup(cube);
        //cubeIsRotating = true;
    }
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 70, -8);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 10, 0);
scene.add(hemiLight);

// helpful for debugging
const sphereGeometry = new THREE.SphereGeometry(1.2, 32, 16);
const sphereMaterial = new THREE.MeshPhongMaterial({color: new THREE.Color(0x00ffff)});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
//scene.add(sphere);

// set up trackball control
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 3.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;

const clock = new THREE.Clock();
let cubeScene = null;
let cubeIsRotating = false;

const rotatingGroup = new THREE.Group();
rotatingGroup.name = 'rotatingGroup';
scene.attach(rotatingGroup);

let rotatingDirection = undefined;
let pause = false;

function getModel(modelFilePath){
    return new Promise((resolve, reject) => {
        loader.load(
            modelFilePath,
            async function(gltf){
                [...gltf.scene.children].forEach(c => {
                    scene.add(c);
                });
                
                cubeScene = scene;
                
                controls.target.set(scene.position.x, scene.position.y, scene.position.z);
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

function collectCubes(cube, raycastDir, selectedSoFar){
      const currPos = new THREE.Vector3();
      cube.getWorldPosition(currPos);
      
      //put scene sphere at selected cube location
      //sphere.position.set(currPos.x, currPos.y, currPos.z);
      
      const xOrigin = new THREE.Vector3(currPos.x - 10, currPos.y, currPos.z);
      const zOrigin = new THREE.Vector3(currPos.x, currPos.y, currPos.z - 10);
      const yOrigin = new THREE.Vector3(currPos.x, currPos.y - 10, currPos.z);
      
      if(raycastDir.x === 1){
          raycaster.set(xOrigin, raycastDir);
      }else if(raycastDir.y === 1){
          raycaster.set(yOrigin, raycastDir);
      }else{
          raycaster.set(zOrigin, raycastDir);
      }
      
      const intersects = raycaster.intersectObjects(scene.children, true).filter(hit => hit.object.name.includes("Cube"));
      
      if(intersects.length){
          //console.log(intersects);
          intersects.forEach(hit => {
              const cube = hit.object;
              selectedSoFar[cube.name] = cube;
          });
      }
}

function isCenterCube(cubeName){
    return cubeName.includes('016') ||
           cubeName.includes('010') ||
           cubeName.includes('060') ||
           cubeName.includes('062') ||
           cubeName.includes('064') ||
           cubeName.includes('025');
}

function getRandomLayer(){
    const layerCenters = [
        'Cube016',
        'Cube010',
        'Cube060',
        'Cube062',
        'Cube064',
        'Cube025',
    ];
    return layerCenters[Math.floor(Math.random() * layerCenters.length)];
}

function moveGroupChildrenToCubeScene(){
    // https://stackoverflow.com/questions/44836055/update-position-of-mesh-after-rotation-of-three-group
    // https://stackoverflow.com/questions/71512739/group-children-position-is-not-saved-after-removing-from-group-and-adding-to-sce
    // https://stackoverflow.com/questions/20089098/three-js-adding-and-removing-children-of-rotated-objects
    
    // need to make a copy of the children array before iterating cause .add/.attach will change the group's children array while iterating
    [...rotatingGroup.children].forEach(child => {
        scene.attach(child);
        child.material.wireframe = false;
    });
    
    cubeIsRotating = false;
}

function rotateGroup(){
    // https://stackoverflow.com/questions/73103621/how-do-i-slowly-rotate-a-cube-90-degrees-in-three-js
    const delta = clock.getDelta();
    if(rotatingDirection === 'horz'){
        // horizontal
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI/2, 0, 'XYZ')); // 90 deg rotation
        
        if(!rotatingGroup.quaternion.equals(targetQuaternion)){
            const step = 0.7 * delta;
            rotatingGroup.quaternion.rotateTowards(targetQuaternion, step);
        }else{
            // put all the rotatingGroup children back into cubeScene so that they're children of cubeScene again
            moveGroupChildrenToCubeScene();
            return;
        }
    }else{
        // TODO: we can rotate vertically about x or z axis
        // vertical
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromEuler(new THREE.Euler(0, 0, Math.PI/2, 'XYZ')); // 90 deg rotation
        
        if(!rotatingGroup.quaternion.equals(targetQuaternion)){
            const step = 0.7 * delta;
            rotatingGroup.quaternion.rotateTowards(targetQuaternion, step);
        }else{
            // put all the rotatingGroup children back into cubeScene so that they're children of cubeScene again
            moveGroupChildrenToCubeScene();
            return;
        }
    }
}

function selectCubeGroup(){
    // given a randomly selected cube
    // randomly choose which way to rotate
    if(cubeScene){
        const cubes = Array.from(scene.children).filter(c => c.name.includes("Cube"));
        //console.log('cube scene children length: ' + cubes.length);
        const selectedCube = cubes[Math.floor(Math.random() * cubes.length)];
        //selectedCube.add(axesHelper);
        
        const direction = Math.random() > 0.5 ? 'vert' : 'horz';
        //console.log(direction);
        
        const cubeGroup = {};
        cubeGroup[selectedCube.name] = selectedCube;
        
        // TODO: how about rotating the opposite direction?
        if(direction === 'horz'){
            // check x-axis
            collectCubes(selectedCube, new THREE.Vector3(1, 0, 0), cubeGroup);
            
            // check z-axis
            collectCubes(selectedCube, new THREE.Vector3(0, 0, 1), cubeGroup);
            
            // collect rest of cubes in layer
            Object.keys(cubeGroup).forEach(name => {
                if(name !== selectedCube.name){
                    //console.log(name);
                    collectCubes(cubeGroup[name], new THREE.Vector3(1, 0, 0), cubeGroup);
                }
            });
        }else{
            // check x-axis
            collectCubes(selectedCube, new THREE.Vector3(1, 0, 0), cubeGroup);
            
            // check y-axis
            collectCubes(selectedCube, new THREE.Vector3(0, 1, 0), cubeGroup);
            
            // collect rest of cubes in layer
            Object.keys(cubeGroup).forEach(name => {
                if(name !== selectedCube.name){
                    collectCubes(cubeGroup[name], new THREE.Vector3(1, 0, 0), cubeGroup);
                }
            });
        }
        
        rotatingGroup.rotation.set(0, 0, 0);
        
        Object.values(cubeGroup).forEach(c => {
            rotatingGroup.attach(c);
            //c.material.wireframe = true;
        });
        rotatingDirection = direction;
    }
}

function update(){
    if(pause) return;
    
    if(!cubeIsRotating && cubeScene){
        selectCubeGroup();
        cubeIsRotating = true;
    }
    
    if(cubeIsRotating){
        rotateGroup();
    }
}

function keydown(evt){
    if(evt.keyCode === 32){
        // spacebar
    }else if(evt.keyCode === 49){
        //1 key
    }else if(evt.keyCode === 50){
        //2 key
    }else if(evt.keyCode === 82){
        // r key
    }
}
document.addEventListener("keydown", keydown);


function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
    update();
}

getModel("rubikscube.gltf");
animate();

document.getElementById('pause').addEventListener('click', () => {
    pause = !pause;
});