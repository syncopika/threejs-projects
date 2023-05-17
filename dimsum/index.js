// dimsum

const container = document.getElementById("container");

const fov = 55;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 30, 50);
camera.rotateX(-Math.PI / 6);

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

//const spotLight = new THREE.SpotLight(0xffffff);
//spotLight.position.set(0, 40, -10);
//spotLight.castShadow = true;
//spotLight.shadow.mapSize.width = 1024;
//spotLight.shadow.mapSize.height = 1024;
//scene.add(spotLight);

const pointLight = new THREE.PointLight(0xffffff, 2.8, 0);
pointLight.position.set(5, 40, 40);
pointLight.castShadow = true;
scene.add(pointLight);

//const hemiLight = new THREE.HemisphereLight(0xffffff);
//hemiLight.position.set(0, 0, 0);
//scene.add(hemiLight);

//const clock = new THREE.Clock();

let loadedModelPromises = [];
let loadedModels = [];
let startPositions = [];
let destinationPositions = []; // end positions when moving models
let currDishIdx = 0;
let isMoving = false;
const position = new THREE.Vector3(0, 0, 15); // position for current dish

function getModel(modelFilePath, pos){
    return new Promise((resolve, reject) => {
        loader.load(
            modelFilePath,
            function(gltf){
                /*
                gltf.scene.traverse((child) => {
                });
                */
                gltf.scene.position.x = pos.x;
                gltf.scene.position.y = pos.y;
                gltf.scene.position.z = pos.z;
                gltf.scene.name = modelFilePath;
                resolve(gltf.scene);
            },
            // called while loading is progressing
            function(xhr){
                //console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },
            // called when loading has errors
            function(error){
                console.log('An error happened');
                console.log(error);
            }
        );
    });
}

loadedModelPromises.push(getModel('./siu-mai-ha-gao.gltf', new THREE.Vector3(0, 0, 15)));
loadedModelPromises.push(getModel('./cha-siu-bao.gltf', new THREE.Vector3(25, 0, -22)));
loadedModelPromises.push(getModel('./dan-tat.gltf', new THREE.Vector3(-25, 0, -22)));

Promise.all(loadedModelPromises).then((objects) => {
    objects.forEach((mesh, index) => {
        mesh.originalRotation = new THREE.Euler();
        mesh.originalRotation.copy(mesh.rotation);
        if(index === currDishIdx){
            mesh.rotateX(Math.PI / 10);
        }
        loadedModels[index] = mesh;
        destinationPositions[index] = new THREE.Vector3();
        startPositions[index] = new THREE.Vector3();
        scene.add(mesh);
    });
    animate();
});

function update(){
    // move stuff around, etc.
    if(loadedModels[currDishIdx]) loadedModels[currDishIdx].rotation.y += 0.01;
    
    if(isMoving){
        // move the objects to their destination via lerp
        moveDishes();
    }
}

function keydown(evt){
    if(evt.keyCode === 32){
        // spacebar
    }else if(evt.keyCode === 49){
        //1 key
    }
}
document.addEventListener("keydown", keydown);

let time = 0;
function moveDishes(){
    let check = 0;
    loadedModels.forEach((model, index) => {
        const startPos = startPositions[index];
        const destPos = destinationPositions[index];
        
        model.position.lerpVectors(startPos, destPos, time);
        
        if(model.position.distanceTo(destPos) <= 0.3){
            check++;
        }
    });
    
    time += 0.0025;
    
    if(check === destinationPositions.length){
        isMoving = false;
        time = 0;
    }
}

function getNextPositionsForward(){
    const lastPos = new THREE.Vector3();
    lastPos.copy(loadedModels[0].position);
    
    loadedModels.forEach((model, index) => {
        startPositions[index].copy(model.position);
    });
    
    // make a copy of positions since we'll be overwriting positions in loadedModels
    const positions = loadedModels.slice().map(x => new THREE.Vector3(x.position.x, x.position.y, x.position.z));
    for(let i = 1; i < loadedModels.length; i++){
        destinationPositions[i-1].copy(positions[i]);
    }
    
    destinationPositions[destinationPositions.length-1].copy(lastPos);
}

function getNextPositionsBackward(){
    const lastPos = new THREE.Vector3();
    lastPos.copy(loadedModels[loadedModels.length - 1].position);
    
    loadedModels.forEach((model, index) => {
        startPositions[index].copy(model.position);
    });
    
    const positions = loadedModels.slice().map(x => new THREE.Vector3(x.position.x, x.position.y, x.position.z));
    for(let i = 0; i < loadedModels.length - 1; i++){
        destinationPositions[i+1].copy(positions[i]);
    }
    
    destinationPositions[0].copy(lastPos);
}

document.getElementById('left').addEventListener('click', () => {
    if(isMoving) return;
    
    isMoving = true;
    
    loadedModels[currDishIdx].rotation.copy(loadedModels[currDishIdx].originalRotation);
    getNextPositionsBackward();
    currDishIdx = (currDishIdx + 1) % loadedModels.length;
    loadedModels[currDishIdx].rotateX(Math.PI / 10);
});

document.getElementById('right').addEventListener('click', () => {
    if(isMoving) return;
    
    isMoving = true;
    
    // reset rotation for current dish
    loadedModels[currDishIdx].rotation.copy(loadedModels[currDishIdx].originalRotation);
    
    getNextPositionsForward();
    //console.log(destinationPositions);
    //console.log(loadedModels.map(x => x.name));
    
    if(currDishIdx > 0){
        currDishIdx--;
    }else{
        currDishIdx = loadedModels.length - 1;
    }
    
    loadedModels[currDishIdx].rotateX(Math.PI / 10);
});

/* allow objects in renderer to be 'clickable'
renderer.domElement.addEventListener('mousedown', (evt) => {
    mouse.x = (evt.offsetX / evt.target.width) * 2 - 1;
    mouse.y = -(evt.offsetY / evt.target.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true); // make sure it's recursive
    intersects.forEach(x => {
        console.log(x);
    });
});*/


function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    update();
}

animate();
