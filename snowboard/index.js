// snowboarding
import { AnimationController } from './AnimationController.js';

const container = document.getElementById("container");

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 2000);
camera.position.set(0, 4, 10);
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
spotLight.position.set(0, 100, -8);
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

const planeGeometry = new THREE.PlaneGeometry(25, 25);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0x055C9D});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
scene.add(plane);

const clock = new THREE.Clock();

const loadedModels = [];
let animationController;
let animationMixer = null;
let animationClips = null;

let playerMesh = null;
let boardMesh = null;

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
                }
                
                gltf.scene.traverse((child) => {
                    if(child.type === "Mesh" || child.type === "SkinnedMesh"){
                        let obj = child;

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
loadedModels.push(getModel('snowboarder-edit.gltf', 'player', 'p1'));
loadedModels.push(getModel('snowboard.gltf', 'tool', 'obj'));

Promise.all(loadedModels).then(objects => {
    objects.forEach(mesh => {
        //console.log(mesh);
        
        if(mesh.name === 'p1'){
            mesh.translateY(3.5);
            scene.add(mesh);
            
            animationMixer = new THREE.AnimationMixer(mesh);
            animationController = new AnimationController(mesh, animationMixer, animationClips, clock);
            animationController.changeState("normal");
            animationController.changeAction('moving');
        }
        
        //mesh.rotateY(Math.PI / 2);
        
    });
    
    playerMesh.boardAttachmentBone.add(boardMesh);
    
    boardMesh.rotateZ(Math.PI / 2);
    boardMesh.translateY(-0.2);
    boardMesh.translateZ(-0.75);
    boardMesh.rotateX(-Math.PI / 30);
});

function moveBasedOnAction(controller, thePlayer, speed, reverse){
}

function keydown(evt){
    // TODO:
    // spacebar to brake
    // j to jump
    if(evt.keyCode === 74){
        // j key
        animationController.changeAction('jump');
        animationController.setUpdateTimeDivisor(.52);
        setTimeout(() => animationController.changeAction('moving'), 2000);
    }
    if(evt.keyCode === 32){
        // spacebar
        animationController.changeAction('braking');
        animationController.setUpdateTimeDivisor(.52);
    }
}

function keyup(evt){
    // TODO: spacebar to brake. if spacebar up, stop braking
    if(evt.keyCode === 32){
        // spacebar
        animationController.changeAction('moving');
        animationController.setUpdateTimeDivisor(.52);
    }
}

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);

function update(){
    // move stuff around, etc.
    //if(playerMesh) playerMesh.rotateY(Math.PI / 100);
    
    if(animationController) animationController.update();
}

function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    update();
}

animate();