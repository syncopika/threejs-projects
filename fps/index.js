import { AnimationController } from '../character_demo/AnimationController.js';

const container = document.getElementById("container");
const fov = 60;
const defaultCamera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const raycaster = new THREE.Raycaster();

const loader = new THREE.GLTFLoader();

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight); 
renderer.domElement.id = "theCanvas";  
container.appendChild(renderer.domElement);

// overlay canvas for displaying crosshairs
const crosshairCanvas = document.createElement('canvas');
crosshairCanvas.style.position = 'absolute';
crosshairCanvas.style.left = '0';
crosshairCanvas.style.top = '0';
crosshairCanvas.style.border = '1px solid #000';
crosshairCanvas.style.width = renderer.domElement.width + 'px';
crosshairCanvas.style.height = renderer.domElement.height + 'px';
crosshairCanvas.style.display = 'none';
crosshairCanvas.width = renderer.domElement.width;
crosshairCanvas.height = renderer.domElement.height;

// make background color transparent
const ctx = crosshairCanvas.getContext('2d');
ctx.fillStyle = 'rgba(255, 255, 255, 0)';
ctx.fillRect(0, 0, crosshairCanvas.width, crosshairCanvas.height);

// TODO: put crosshair image on canvas
const crosshairImg = new Image();
crosshairImg.onload = () => {
    ctx.drawImage(crosshairImg, 200, 130);
};
crosshairImg.src = "crosshairs.png";

container.appendChild(crosshairCanvas);

const camera = defaultCamera;
camera.position.set(0, 5, 20);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);    
scene.add(camera);

const light = new THREE.PointLight(0xffffff, 1.2, 100);
light.position.set(0, 70, 0);
light.castShadow = true;
scene.add(light);

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

let player = null;
let tool = null;
let terrain = null;
let firstPersonViewOn = false;
let sideViewOn = false;
//let playerBody;

let cowProjectileMesh;

const cannonBodies = [];
const projectiles = new Set();

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);

// add ground
const texture = new THREE.TextureLoader().load('../car_demo/models/grass2.jpg');
const terrainMat = new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide});
const terrainGeometry = new THREE.PlaneGeometry(200, 200);
const plane = new THREE.Mesh(terrainGeometry, terrainMat);
plane.receiveShadow = true;
plane.castShadow = false;
plane.rotateX(Math.PI / 2);
plane.name = "ground";
plane.translateY(0.6);
terrain = plane;
scene.add(plane);

const planeShape = new CANNON.Plane();
const groundMat = new CANNON.Material();
const planeBody = new CANNON.Body({material: groundMat, mass: 0}); // this plane extends infinitely
planeBody.addShape(planeShape);
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI/2);
planeBody.mesh = plane;
world.addBody(planeBody);

function addCannonBox(mesh, width, height, length, x, y, z, mass=0){
    const box = new CANNON.Box(new CANNON.Vec3(width, height, length));
    const mat = new CANNON.Material();
    const body = new CANNON.Body({material: mat, mass});
    
    body.position.x = x;
    body.position.y = y;
    body.position.z = z;
    
    body.addShape(box);
    world.addBody(body);
    
    body.mesh = mesh; // associate mesh with body (not sure there's an official way of doing this atm but it works at least?
    
    // detect collision
    // https://stackoverflow.com/questions/31750026/cannon-js-registering-collision-without-colliding
    body.addEventListener("collide", (e) => {
        const collidingObj = e.body.mesh;
        if(collidingObj.name === "projectile"){
            const hitTarget = e.target.mesh;
            
            const hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
            hitTarget.material = hitMaterial;
            
            setTimeout(() => {
                hitTarget.material = hitTarget.originalColor;
            }, 300);
        }
    });
    
    return {planeBody: body, mat};
}

function generateProjectile(x, y, z){
    const useCowProjectile = document.getElementById('useCowProjectile').checked;
    if(!useCowProjectile){
        const sphereGeometry = new THREE.SphereGeometry(0.05, 32, 16);
        const normalMaterial = new THREE.MeshPhongMaterial({color: 0x055C9D});
        const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
        sphereMesh.receiveShadow = true;
        sphereMesh.castShadow = true;
        sphereMesh.position.x = x;
        sphereMesh.position.y = y;
        sphereMesh.position.z = z;
        sphereMesh.name = "projectile";
        scene.add(sphereMesh);

        const sphereShape = new CANNON.Sphere(0.05);
        const sphereMat = new CANNON.Material();
        const sphereBody = new CANNON.Body({material: sphereMat, mass: 0.2});
        sphereBody.addShape(sphereShape);
        sphereBody.position.x = sphereMesh.position.x;
        sphereBody.position.y = sphereMesh.position.y;
        sphereBody.position.z = sphereMesh.position.z;
        sphereBody.mesh = sphereMesh;
        world.addBody(sphereBody);
        
        return {sphereMesh, sphereBody};
    }else{
        const sphereMesh = cowProjectileMesh.clone();
        sphereMesh.receiveShadow = true;
        sphereMesh.castShadow = true;
        sphereMesh.position.x = x;
        sphereMesh.position.y = y;
        sphereMesh.position.z = z;
        sphereMesh.name = "projectile";
        scene.add(sphereMesh);
        
        const sphereShape = new CANNON.Sphere(1.2);
        const sphereMat = new CANNON.Material();
        const sphereBody = new CANNON.Body({material: sphereMat, mass: 0.2});
        sphereBody.addShape(sphereShape);
        sphereBody.position.x = sphereMesh.position.x;
        sphereBody.position.y = sphereMesh.position.y;
        sphereBody.position.z = sphereMesh.position.z;
        sphereBody.mesh = sphereMesh;
        world.addBody(sphereBody);

        return {sphereMesh, sphereBody};        
    }
}

function getModel(modelFilePath, name){
    return new Promise((resolve, reject) => {
        loader.load(
            modelFilePath,
            function(gltf){
                if(gltf.animations.length > 0 && name === "player"){
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

loadedModels.push(getModel('../character_demo/models/humanoid-rig-with-gun.gltf', 'player'));
loadedModels.push(getModel('../character_demo/models/m4carbine-final.gltf', 'obj'));
loadedModels.push(getModel('./target.gltf', 'target'));
loadedModels.push(getModel('./box.gltf', 'box'));
loadedModels.push(getModel('./box.gltf', 'box2'));
loadedModels.push(getModel('./barrel.gltf', 'barrel'));

getModel('./cow.gltf', 'cow').then(model => {
    cowProjectileMesh = model;
});

Promise.all(loadedModels).then(objects => {
    objects.forEach(mesh => {
        if(mesh.name === "npc"){
            // npcs?
        }else if(mesh.name === "obj"){
            // tools that can be equipped
            mesh.castShadow = true;
            tool = mesh;
            tool.visible = false;
        }else if(mesh.name === "target" || mesh.name.includes("box") || mesh.name === "barrel"){
            mesh.castShadow = true;
            if(mesh.name === "target"){
                mesh.position.set(10, mesh.position.y, -30);
                mesh.scale.x *= 4;
                mesh.scale.y *= 4;
                mesh.scale.z *= 4;
                mesh.translateY(1.1);
                mesh.rotateX(Math.PI / 8);
                mesh.rotateY(-Math.PI / 1.5);
                mesh.rotateX(-Math.PI / 10);
                
                const bbox = new THREE.Box3().setFromObject(mesh);
                
                const body = addCannonBox(
                    mesh,
                    Math.abs(bbox.max.x - bbox.min.x) / 3.8, 
                    Math.abs(bbox.max.y - bbox.min.y) / 2.5, 
                    Math.abs(bbox.max.z - bbox.min.z) / 5, 
                    mesh.position.x + 0.5, mesh.position.y, mesh.position.z,
                );
                
                body.planeBody.quaternion.setFromAxisAngle(
                    new CANNON.Vec3(0, 1, 0),
                    -Math.PI / 6
                );
                
                cannonBodies.push(body);
            }
            
            if(mesh.name === "box"){
                mesh.position.set(-10, mesh.position.y, -20);
                mesh.translateY(.05);
                
                const bbox = new THREE.Box3().setFromObject(mesh);
                
                cannonBodies.push(addCannonBox(
                    mesh,
                    Math.abs(bbox.max.x - bbox.min.x) / 2, 
                    Math.abs(bbox.max.y - bbox.min.y) / 2, 
                    Math.abs(bbox.max.z - bbox.min.z) / 2, 
                    mesh.position.x, mesh.position.y, mesh.position.z,
                    5
                ));
            }
            
            if(mesh.name === "box2"){
                mesh.position.set(-10, mesh.position.y, -20);
                mesh.translateY(2);
                
                const bbox = new THREE.Box3().setFromObject(mesh);
                
                cannonBodies.push(addCannonBox(
                    mesh,
                    Math.abs(bbox.max.x - bbox.min.x) / 2, 
                    Math.abs(bbox.max.y - bbox.min.y) / 2, 
                    Math.abs(bbox.max.z - bbox.min.z) / 2, 
                    mesh.position.x, mesh.position.y, mesh.position.z,
                    2
                ));
            }
            
            if(mesh.name === "barrel"){
                mesh.position.set(1.1, mesh.position.y, 5);
                
                const bbox = new THREE.Box3().setFromObject(mesh);
                
                cannonBodies.push(addCannonBox(
                    mesh,
                    Math.abs(bbox.max.x - bbox.min.x) / 2, 
                    Math.abs(bbox.max.y - bbox.min.y) / 2, 
                    Math.abs(bbox.max.z - bbox.min.z) / 2, 
                    mesh.position.x, mesh.position.y - 0.3, mesh.position.z,
                    30
                ));
            }
        }else if(mesh.name === "player"){
            mesh.castShadow = true;
            player = mesh;

            // add a 3d object (cube) to serve as a marker for the 
            // location of the head of the mesh. we'll use this to 
            // create a vertical ray towards the ground
            // this ray can tell us the current height.
            // if the height is < the height of our character,
            // we know that we're on an uphill part of the terrain 
            // and can adjust our character accordingly
            // similarly, if the height is > the character height, we're going downhill
            const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
            const head = new THREE.Mesh(cubeGeometry, material);
            head.visible = false;
            
            mesh.add(head);
            mesh.head = head;
            head.position.set(0, 4, 0);
            
            animationMixer = new THREE.AnimationMixer(mesh);
            animationController = new AnimationController(player, animationMixer, animationClips, clock);
            animationController.changeState("normal"); // set normal state by default for animations. see animation_state_map.json

            mesh.position.set(0, 1.4, -10);
            mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI);
            
            // add hand bone to equip tool with as a child of the player mesh
            for(let bone of player.skeleton.bones){
                if(bone.name === "HandR001"){
                    player.hand = bone; // set an arbitrary new property to access the hand bone
                }
                
                if(bone.name === "Chest"){
                    player.chest = bone;
                    player.head.quaternion.copy(bone.quaternion); // make sure head mesh follows chest bone rotation
                }
            }
            
            /* for the player I'm going just detect collision
            // with objects manually (having some trouble with the rigidbody)
            // might be helpful? https://github.com/schteppe/cannon.js/issues/188
            const bbox = new THREE.Box3().setFromObject(mesh);
            const body = addCannonBox(
                mesh,
                Math.abs(bbox.max.x - bbox.min.x), 
                Math.abs(bbox.max.y - bbox.min.y), 
                Math.abs(bbox.max.z - bbox.min.z), 
                mesh.position.x, mesh.position.y / 1.8, mesh.position.z,
                10
            );
            
            playerBody = body.planeBody;
            */

            animate();
        }
        
        mesh.originalColor = mesh.material;
        
        scene.add(mesh);
        renderer.render(scene, camera);
    });
});

function moveBasedOnAction(controller, player, speed, reverse){
    let action = controller.currAction;
    if(action === 'walk' || action === 'run'){
        if(action === 'run'){
            speed += 0.10;
        }
        if(reverse){
            player.translateZ(-speed);
        }else{
            player.translateZ(speed);
        }
    }
}

function checkCollision(moveDistance, isReverse){
    for(let body of cannonBodies){
        const bodyPos = body.planeBody.position;
        const destPos = new THREE.Vector3();
        
        // get forward vector of player
        player.getWorldDirection(destPos);
        destPos.multiplyScalar((isReverse ? -moveDistance : moveDistance));
        
        // using player.position doesn't seem to work - I guess cause it's local instead of world?
        const playerWorldPos = new THREE.Vector3();
        player.getWorldPosition(playerWorldPos);
        destPos.add(playerWorldPos);
        
        if(destPos.distanceTo(bodyPos) < 2){
            return true;
        }
    }
    return false;
}

function keydown(evt){
    if(evt.keyCode === 16){
        // shift key
        // toggle between walk and run while moving
        if(animationController.currAction === 'walk'){
            animationController.changeAction('run');
            //animationController.setUpdateTimeDivisor(.12);
        }
    }else if(evt.keyCode === 71){
        // g key
        // for toggling weapon/tool equip
        let handBone = player.hand;
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
        let timeScale = 1.0;
        
        if(animationController.currState === "normal"){
            tool.visible = true;
            animationController.changeState("equip"); // equip weapon
        }else{
            animationController.changeState("normal");
            timeScale = -1; // need to play equip animation backwards to put away weapon
        }
        animationController.setUpdateTimeDivisor(0.002);
        animationController.changeAction("drawgun", timeScale);
    }else if(evt.keyCode === 49){
        // toggle first-person view
        firstPersonViewOn = !firstPersonViewOn;
        sideViewOn = false;
        
        // make sure camera is in the head position
        // and that the camera is parented to the character mesh
        // so that it can rotate with the mesh
        if(firstPersonViewOn){
            player.add(camera);
            camera.position.copy(player.head.position);
            camera.position.z += 0.9;
            camera.position.y -= 0.4;
            camera.rotation.copy(player.head.rotation);
            camera.rotateY(Math.PI);
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
document.getElementById("theCanvas").parentNode.addEventListener("pointerdown", (evt) => {
    if(animationController.currState !== "normal"){
        evt.preventDefault();
        const forwardVec = new THREE.Vector3();
        player.getWorldDirection(forwardVec);
        
        const impulseVal = parseInt(document.getElementById('impulseSlider').value);
        forwardVec.multiplyScalar(impulseVal);
        
        const sphere = generateProjectile(player.position.x, player.position.y + 1.0, player.position.z);
        sphere.sphereBody.applyImpulse(new CANNON.Vec3(forwardVec.x, forwardVec.y, forwardVec.z), sphere.sphereBody.position);
        
        projectiles.add(sphere);
    }
});

function update(){
    sec = clock.getDelta();
    moveDistance = 5 * sec;
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
        animationController.setUpdateTimeDivisor(.008);
        
        if(!checkCollision(moveDistance, false)){
            moveBasedOnAction(animationController, player, moveDistance, false);
        }
        
        //playerBody.velocity.z = 0.5;
    }else if(keyboard.pressed("S")){
        // moving backwards
        if(animationController.currAction !== "run"){
            animationController.changeAction('walk', -1);
        }
        animationController.setUpdateTimeDivisor(.008);
        
        if(!checkCollision(moveDistance, true)){
            moveBasedOnAction(animationController, player, moveDistance, true);
        }
        
        //playerBody.velocity.z = -0.5;
    }else if(!keyboard.pressed("W") && !keyboard.pressed("S")){
        // can we make this less specific i.e. don't explicitly check for "drawgun"?
        if(animationController.currAction !== 'idle' && animationController.currAction !== "drawgun"){
            animationController.changeAction('idle');
            animationController.setUpdateTimeDivisor(.05);
        }
    }
    
    if(keyboard.pressed("A")){
        player.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationAngle);
        //playerBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotationAngle); // can't get this to work :/
    }
    
    if(keyboard.pressed("D")){
        player.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotationAngle);
    }
    
    // keep the current animation running
    animationController.update();
    
    let relCameraOffset;
    
    if(firstPersonViewOn){
        // have crosshairs showing
        crosshairCanvas.style.display = 'block';
        
        // https://stackoverflow.com/questions/25567369/show-children-of-invisible-parents
        player.material.visible = false;
    }else if(sideViewOn){
        relCameraOffset = new THREE.Vector3(-10, 3, 0);
    }else if(!changeCameraView){
        relCameraOffset = new THREE.Vector3(0, 3, -15);
    }else{
        relCameraOffset = new THREE.Vector3(0, 3, 15);
    }
    
    if(!firstPersonViewOn){
        crosshairCanvas.style.display = 'none';
        player.material.visible = true;
        
        const cameraOffset = relCameraOffset.applyMatrix4(player.matrixWorld);
        camera.position.x = cameraOffset.x;
        camera.position.y = cameraOffset.y;
        camera.position.z = cameraOffset.z;
        
        camera.lookAt(player.position);
    }
}

function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    update();
    cannonDebugRenderer.update();
    
    world.step(0.01);
    
    projectiles.forEach(p => {
        if(p.sphereMesh.position.y < 0.5){
            // remove projectile from scene and set of projectiles
            scene.remove(p.sphereMesh);
            world.remove(p.sphereBody);
            projectiles.delete(p);
            return;
        }
        p.sphereMesh.position.set(p.sphereBody.position.x, p.sphereBody.position.y, p.sphereBody.position.z);
        p.sphereMesh.quaternion.set(
            p.sphereBody.quaternion.x,
            p.sphereBody.quaternion.y,
            p.sphereBody.quaternion.z,
            p.sphereBody.quaternion.w,
        );
    });
    
    cannonBodies.forEach(b => {
        const bBody = b.planeBody;
        const bMesh = bBody.mesh;
        
        // for now only have boxes be able to move on projectile impact
        if(bMesh.name.includes("box")){
            bMesh.position.set(bBody.position.x, bBody.position.y, bBody.position.z);    
            bMesh.quaternion.set(
                bBody.quaternion.x,
                bBody.quaternion.y,
                bBody.quaternion.z,
                bBody.quaternion.w,
            );
        }
    });
    
    /* adjust player's rigidbody based on the player model
    playerBody.position.set(player.position.x, player.position.y, player.position.z);
    
    playerBody.quaternion.set(
        player.quaternion.x,
        player.quaternion.y,
        player.quaternion.z,
        player.quaternion.w,
    );*/
}

document.getElementById('impulseSlider').addEventListener('change', (evt) => {
    document.getElementById('impulseVal').textContent = evt.target.value;
});