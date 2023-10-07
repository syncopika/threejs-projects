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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 200, -8);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

//const pointLight = new THREE.PointLight(0xffffff, 1, 0);
//pointLight.position.set(2, 10, 2);
//pointLight.castShadow = true;
//scene.add(pointLight);

//const hemiLight = new THREE.HemisphereLight(0xffffff);
//hemiLight.position.set(0, 10, 0);
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

const raycaster = new THREE.Raycaster();

const loadedModels = [];
let animationController;
let animationMixer = null;
let animationClips = null;

let playerMesh = null;
let boardMesh = null;

let isJumping = false;
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
                    let clips = {};
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

//loadedModels.push(getModel('../shared_assets/oceanfloor.glb', 'none', 'bg'));
loadedModels.push(getModel('snowboarder.gltf', 'player', 'p1'));
loadedModels.push(getModel('snowboard.gltf', 'tool', 'obj'));
loadedModels.push(getModel('pine-tree.gltf', 'obj', 'tree'));
loadedModels.push(getModel('hill.gltf', 'obj', 'hill'));

Promise.all(loadedModels).then(objects => {
    objects.forEach(mesh => {
        if(mesh.name === 'p1'){
            mesh.translateY(1.75);
            mesh.rotateY(Math.PI);
            scene.add(mesh);
            
            originalPlayerY = mesh.position.y;
            
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
            }
        }
        
        if(mesh.name === 'hill'){
            mesh.position.set(-5, 0, -20);
            mesh.scale.set(20, 20, 20);
            mesh.material.wireframe = true;
            scene.add(mesh);
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
    if(evt.keyCode === 32){
        // spacebar
        animationController.changeAction('braking');
        animationController.setUpdateTimeDivisor(.52);
    }
    
    if(evt.keyCode === 74){
        // j
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
}

function keyup(evt){
    if(evt.keyCode === 32){
        // spacebar
        animationController.changeAction('idle');
        animationController.setUpdateTimeDivisor(.52);
    }
    if(evt.keyCode === 65){
        // a
        animationController.changeAction('idle');
    }
    if(evt.keyCode === 68){
        // d
        animationController.changeAction('idle');
    }
    if(evt.keyCode === 87){
        // w
        animationController.changeAction('idle');
    }
}

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);

function getForwardVector(obj){
    // https://github.com/mrdoob/three.js/issues/1606
    const matrix = new THREE.Matrix4();
    matrix.extractRotation(obj.matrix);
    
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyMatrix4(matrix);
    
    return direction;
}

function doRaycast(playerMesh, raycaster){
    if(isJumping) return;
    
    // aim ray downwards but above the player
    const raycastStart = new THREE.Vector3(playerMesh.position.x, playerMesh.position.y + 20, playerMesh.position.z + 2.0);
    raycaster.set(raycastStart, new THREE.Vector3(0, -1, 0));
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for(let i = 0; i < intersects.length; i++){
        if(intersects[i].object.name === 'hill' || intersects[i].object.name === 'plane'){
            const currPos = intersects[i].point; // point where the raycast hit
            
            if(currPos.y + originalPlayerY > originalPlayerY){
                const nextY = originalPlayerY + currPos.y;
                
                const nextVec = new THREE.Vector3(currPos.x - playerMesh.position.x, nextY - playerMesh.position.y, currPos.z - playerMesh.position.z);
                nextVec.normalize();
                
                const forward = new THREE.Vector3(0, 0, 1);
                
                const angleTo = forward.angleTo(nextVec);

                /*
                console.log("curr pos");
                console.log(playerMesh.position);

                console.log("next vector");
                console.log(nextVec);
                */
                
                const crossProductLength = forward.cross(nextVec);
                
                if(crossProductLength.x > 0){
                    playerMesh.rotateX(angleTo);
                    //console.log(`angleTo: ${180 * angleTo / Math.PI}`);
                }else{
                    playerMesh.rotateX(-angleTo);
                    //console.log(`angleTo: ${180 * -angleTo / Math.PI}`);
                }
                
                playerMesh.position.y = nextY;
            }else{
                playerMesh.position.y = originalPlayerY;
            }
            
            break; // only handle hill or plane, whichever comes first based on raycast
        }
        
    }
}

function update(){
    const delta = clock.getDelta();
    
    if(playerMesh){
        const relCameraOffset = new THREE.Vector3(0, 2, -10); 

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
        if(
            animationController.currAction === 'moving' || 
            animationController.currAction === 'jump' ||
            animationController.currAction === 'turnleft' ||
            animationController.currAction === 'turnright'
        ) playerMesh.translateZ(0.2);
        if(animationController.currAction === 'braking') playerMesh.translateZ(0.1);
    
        doRaycast(playerMesh, raycaster);
    }
    
    if(isJumping){
        // https://discussions.unity.com/t/bouncing-ball-without-physics-gravity/9973
        if(time < 1.0){
            time += delta;
            
            currJumpHeight = jumpMaxY * Math.sin(time * Math.PI);
            
            /*
            if(!keyboard.pressed("W")){
                // handle jumping-in-place
                playerMesh.position.y = originalPlayerY + currJumpHeight;
            }*/
            
            playerMesh.position.y = initialJumpHeight + currJumpHeight;
        }else{
            time = 0;
            isJumping = false;
            /*
            if(!keyboard.pressed("W")){
                playerMesh.position.y = originalPlayerY;
            }else{
                currJumpHeight = 0;
            }*/
            playerMesh.position.y = originalPlayerY;
            animationController.changeAction('moving');
        }
    }
    
    // https://discourse.threejs.org/t/animations-looks-different-and-wrong-when-i-play-them-on-three-js/55410/2
    if(animationController) animationController.update(delta);
}

function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    update();
}

animate();