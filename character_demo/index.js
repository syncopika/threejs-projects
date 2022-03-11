import { AnimationController } from './AnimationController.js';

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
let loadedModels = [];
let animationMixer = null;
let animationClips = null;

function getModel(modelFilePath, side, name){
    return new Promise((resolve, reject) => {
        loader.load(
            modelFilePath,
            function(gltf){
                if(gltf.animations.length > 0 && name === "p1"){
                    let clips = {};
                    gltf.animations.forEach((action) => {
                        let name = action['name'].toLowerCase();
                        name = name.substring(0, name.length - 1);
                        clips[name] = action;
                    });
                    animationClips = clips;
                }
                
                // if a scene has multiple meshes you want (like for the m4 carbine),
                // do the traversal and attach the magazine mesh as a child or something to the m4 mesh.
                // then resolve the thing outside the traverse.
                let carbine = [];
                gltf.scene.traverse((child) => {
                    if(child.type === "Mesh" || child.type === "SkinnedMesh"){
                        let obj = child;

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
                    let m4carbine = carbine[0];
                    //console.log(m4carbine.skeleton);
                    m4carbine.add(m4carbine.skeleton.bones[0]);
                    m4carbine.name = name;
                    
                    let magazine = carbine[1];
                    m4carbine.magazine = magazine;
                    m4carbine.skeleton.bones[1].add(magazine); // add magazine to the mag bone

                    m4carbine.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/2);
                    m4carbine.rotateOnAxis(new THREE.Vector3(0,0,-1), Math.PI/2);

                    resolve(m4carbine);
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

// https://threejs.org/docs/#api/en/textures/Texture
loadedModels.push(getModel('../shared_assets/oceanfloor.glb', 'none', 'bg'));
loadedModels.push(getModel('models/humanoid-rig-with-gun.gltf', 'player', 'p1'));
loadedModels.push(getModel('models/m4carbine-final.gltf', 'tool', 'obj'));

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
            // location of the head of the mesh. we'll use this to 
            // create a vertical ray towards the ground
            // this ray can tell us the current height.
            // if the height is < the height of our character,
            // we know that we're on an uphill part of the terrain 
            // and can adjust our character accordingly
            // similarly, if the height is > the character height, we're going downhill
            let cubeGeometry = new THREE.BoxGeometry(0.2,0.2,0.2);
            let material = new THREE.MeshBasicMaterial({color: 0x00ff00});
            let head = new THREE.Mesh(cubeGeometry, material); 
            
            mesh.add(head);
            mesh.head = head;
            head.position.set(0, 4, 0);
            
            animationMixer = new THREE.AnimationMixer(mesh);
            animationController = new AnimationController(thePlayer, animationMixer, animationClips, clock);
            animationController.changeState("normal"); // set normal state by default for animations. see animation_state_map.json

            mesh.position.set(0, 2.8, -10);
            mesh.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
            mesh.originalColor = mesh.material;
            
            // alternate materials used for the sub depending on condition 
            let hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
            mesh.hitMaterial = hitMaterial;
            mesh.originalMaterial = mesh.material;
            
            // add hand bone to equip tool with as a child of the player mesh
            for(let bone of thePlayer.skeleton.bones){
                if(bone.name === "HandR001"){ // lol why is it like this??
                    thePlayer.hand = bone; // set an arbitrary new property to access the hand bone
                    break;
                }
            }

            animate();
        }
        scene.add(mesh);
        renderer.render(scene, camera);
    })
});

// checkTerrainHeight comes from utils.js in /lib
function adjustVerticalHeightBasedOnTerrain(thePlayer, raycaster, scene){
    // for now I'm hardcoding the expected height at level terrain 
    let baseline = 2.75;
    let head = getCenter(thePlayer.head);
    let verticalDirection = checkTerrainHeight(head, raycaster, terrain, document.getElementById('height'));
    
    if(verticalDirection < 2.74){
        // go uphill so increase y
        let deltaY = baseline - verticalDirection;
        thePlayer.position.y += deltaY;
    }else if(verticalDirection > 2.76){
        // go downhil so decrease y
        let deltaY = verticalDirection - baseline;
        thePlayer.position.y -= deltaY;
    }
}

function moveBasedOnAction(controller, thePlayer, speed, reverse){
    let action = controller.currAction;
    if(action === 'walk' || action === 'run'){
        if(action === 'run'){
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
    if(evt.keyCode === 16){
        // shift key
        // toggle between walk and run while moving
        if(animationController.currAction === 'walk'){
            animationController.changeAction('run');
            animationController.setUpdateTimeDivisor(.12);
        }
    }else if(evt.keyCode === 71){
        // g key
        // for toggling weapon/tool equip
        
        // attach the tool
        // try attaching tool to player's hand?
        // https://stackoverflow.com/questions/19031198/three-js-attaching-object-to-bone
        // https://stackoverflow.com/questions/54270675/three-js-parenting-mesh-to-bone
        let handBone = thePlayer.hand;
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
        // since I have the event listener for a 'finished' action set up
        let timeScale = 1;
        
        if(animationController.currState === "normal"){
            tool.visible = true;
            animationController.changeState("equip"); // equip weapon
        }else{
            animationController.changeState("normal"); // go back to normal state
            timeScale = -1; // need to play equip animation backwards to put away weapon
        }
        animationController.setUpdateTimeDivisor(.20);
        animationController.changeAction("drawgun", timeScale);
    }else if(evt.keyCode === 49){
        // toggle first-person view
        firstPersonViewOn = !firstPersonViewOn;
        sideViewOn = false;
        
        // make sure camera is in the head position
        // and that the camera is parented to the character mesh
        // so that it can rotate with the mesh
        if(firstPersonViewOn){
            thePlayer.add(camera);
            camera.position.copy(thePlayer.head.position);
            camera.position.z += 1.0;
            camera.position.y -= 0.4;
            camera.rotation.set(0, Math.PI, 0);
        }else{
            scene.add(camera);
        }
    }else if(evt.keyCode === 50){
        // toggle side view
        firstPersonViewOn = false;
        sideViewOn = !sideViewOn;
        
    }
}

function keyup(evt){
    if(evt.keyCode === 16){
        if(animationController.currAction === 'run'){
            animationController.changeAction('walk');
            animationController.setUpdateTimeDivisor(.12);
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
    
    if(keyboard.pressed("W")){
        // moving forwards
        if(animationController.currAction !== "run"){
            animationController.changeAction('walk');
        }
        animationController.setUpdateTimeDivisor(.10);
        moveBasedOnAction(animationController, thePlayer, moveDistance, false);
        
    }else if(keyboard.pressed("S")){
        // moving backwards
        if(animationController.currAction !== "run"){
            animationController.changeAction('walk', -1);
        }
        animationController.setUpdateTimeDivisor(.10);
        moveBasedOnAction(animationController, thePlayer, moveDistance, true);
        
    }else if(!keyboard.pressed("W") && !keyboard.pressed("S")){
        // for idle pose
        // can we make this less specific i.e. don't explicitly check for "drawgun"?
        if(animationController.currAction !== 'idle' && animationController.currAction !== "drawgun"){
            animationController.changeAction('idle');
            animationController.setUpdateTimeDivisor(.50);
        }
    }
    
    if(keyboard.pressed("J")){
        // for jumping
        // this one is not yet working and a bit tricky to think about for me - the animation 
        // is currently set to loop once and I'm not really sure yet how 
        // to set up the transition. maybe I need to keep a reference to 
        // the previous action before I trigger the jump?
        animationController.changeAction('jump');
        animationController.setUpdateTimeDivisor(.12);
        //moveBasedOnState(state, thePlayer, moveDistance, true);
    }
    
    if(keyboard.pressed("A")){
        thePlayer.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationAngle);
    }
    
    if(keyboard.pressed("D")){
        thePlayer.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotationAngle);
    }
    
    adjustVerticalHeightBasedOnTerrain(thePlayer, raycaster, scene);
    
    // keep the current animation running
    animationController.update();
    
    let relCameraOffset;
    
    if(firstPersonViewOn){
        // nothing to do
    }else if(sideViewOn){
        relCameraOffset = new THREE.Vector3(-10, 3, 0);
    }else if(!changeCameraView){
        relCameraOffset = new THREE.Vector3(0, 3, -15);
    }else{
        relCameraOffset = new THREE.Vector3(0, 3, 15);
    }
    
    if(!firstPersonViewOn){
        let cameraOffset = relCameraOffset.applyMatrix4(thePlayer.matrixWorld);
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