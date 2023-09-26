// battleships
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

const container = document.getElementById("container");

const WIDTH = container.clientWidth;
const HEIGHT = container.clientHeight;
const VIEW_ANGLE = 100;
const ASPECT = WIDTH / HEIGHT;
const NEAR = 1;
const FAR = 1000;
const LEFT = WIDTH / -10;
const RIGHT = WIDTH / 10;
const TOP = HEIGHT / 10;
const BOTTOM = HEIGHT / -10;

const orthoCamera = new THREE.OrthographicCamera(LEFT, RIGHT, TOP, BOTTOM, NEAR, FAR);
orthoCamera.rotateX(Math.PI / 2);

const perspCamera = new THREE.PerspectiveCamera(15, WIDTH / HEIGHT, 0.01, 10000);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const loadingManager = new THREE.LoadingManager();
setupLoadingManager(loadingManager);

const loader = new GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.setSize(WIDTH, HEIGHT);
container.appendChild(renderer.domElement);

let currentPlayerUnit = null;
let planeModel = null;
let lerpCamera = false;
let orbitControlsOn = false;
let airstrikeOn = false;
let currCamera = orthoCamera;

const orbitControls = new OrbitControls(perspCamera, renderer.domElement);
orbitControls.enabled = false;
orbitControls.enablePan = false;
orbitControls.update();

// add event listeners to renderer canvas
renderer.domElement.addEventListener('mousedown', (evt) => {
    if(currCamera === orthoCamera){
        const x = evt.clientX - renderer.domElement.getBoundingClientRect().left;
        const y = evt.clientY - renderer.domElement.getBoundingClientRect().top;

        mouse.x = (x / renderer.domElement.width) * 2 - 1;
        mouse.y = -(y / renderer.domElement.height) * 2 + 1;

        const v = new THREE.Vector3(mouse.x, mouse.y, 0).unproject(orthoCamera); // corresponding 3d coord to where clicked
        //console.log(`3d space - x: ${v.x}, y: ${v.y}, z: ${v.z}`);
        
        raycaster.set(v, new THREE.Vector3(0, -1, 0)); // ortho camera is looking down about the y-axis
        
        const intersects = raycaster.intersectObjects(scene.children, true); // make sure it's recursive
        if(intersects){
            const selected = intersects.filter(x => !(x.object.name === 'sky' || x.object.name === 'water' || x.object.name === 'axeshelper'))[0]; // get first hit that's not sky or water or axeshelper
            
            if(!selected) return;
            
            if(selected.object.name === 'player'){
                // toggle select area visibility
                togglePlayerSelectArea(selected.object, scene);
            }else if(selected.object.name === 'selectArea'){
                // TODO: what if there's an obstacle in the way?
                togglePlayerSelectArea(currentPlayerUnit, scene)
                currentPlayerUnit.isMoving = true;
                v.y = currentPlayerUnit.position.y;
                moveObj(currentPlayerUnit, v);
            }
            
            if(selected.object.name === 'enemy' || selected.object.name === 'obstacle'){
                if(currentPlayerUnit && selected.object.position.distanceTo(currentPlayerUnit.position) <= currentPlayerUnit.selectArea.geometry.parameters.radius + 5){
                    console.log("attacking...");
                    
                    if(airstrikeOn){
                        airstrike(planeModel.clone(), selected.object, scene);
                    }else{
                        explosionEffect(selected.object, scene, 20);
                    }
                }
            }
            
            if(selected.object.name !== 'player'){
                if(selected.object.material) selected.object.material.wireframe = true;
                setTimeout(() => {
                    if(selected.object.material) selected.object.material.wireframe = false;
                }, 1000);
            }
        }
    }else{
        const x = evt.clientX - renderer.domElement.getBoundingClientRect().left;
        const y = evt.clientY - renderer.domElement.getBoundingClientRect().top;
        
        mouse.x = (x / renderer.domElement.width) * 2 - 1;
        mouse.y = -(y / renderer.domElement.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, perspCamera);
        
        const intersects = raycaster.intersectObjects(scene.children, true);
        if(intersects){
            const selected = intersects.filter(x => !(x.object.name === 'sky' || x.object.name === 'water' || x.object.name === 'axeshelper'))[0];
            
            if(!selected) return;
            
            if(selected.object.name === 'selectArea'){
                // TODO: how to know correct z-index based on where user clicked on selectArea? maybe don't allow movement in perspective cam mode
                //moveObj(self.state.currentPlayerUnit, v);
            }else if(selected.object.name === 'player'){
                // TODO: maybe don't allow movement in perspective cam mode
                //togglePlayerSelectArea(selected.object, scene);
            }else if(selected.object.name === 'enemy' || selected.object.name === 'obstacle'){
                if(currentPlayerUnit && selected.object.position.distanceTo(currentPlayerUnit.position) <= currentPlayerUnit.selectArea.geometry.parameters.radius + 5){
                    if(airstrikeOn){
                        airstrike(planeModel.clone(), selected.object, scene);
                    }else{
                        explosionEffect(selected.object, scene, 20);
                    }
                }
            }
        }                
    }
});

renderer.domElement.addEventListener('mousemove', (evt) => {
        const x = evt.clientX - renderer.domElement.getBoundingClientRect().left;
        const y = evt.clientY - renderer.domElement.getBoundingClientRect().top;
        
        mouse.x = (x / renderer.domElement.width) * 2 - 1;
        mouse.y = -(y / renderer.domElement.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, currCamera);
        
        const intersects = raycaster.intersectObjects(scene.children, true); // make sure it's recursive
        if(intersects){
            const selected = intersects.filter(x => !(x.object.name === 'sky' || x.object.name === 'water' || x.object.name === 'axeshelper'))[0]; // get first hit that's not sky or water or axeshelper
            
            if(!selected) return;
            
            if(currentPlayerUnit && selected.object.position.distanceTo(currentPlayerUnit.position) <= currentPlayerUnit.selectArea.geometry.parameters.radius + 5){
                // flash wireframe so we know what we selected
                // testing explosion effect
                if(selected.object.name === 'enemy' || selected.object.name === 'obstacle'){     
                    if(selected.object.material) selected.object.material.wireframe = true;
                    setTimeout(() => {
                        if(selected.object.material) selected.object.material.wireframe = false;
                    }, 1000);
                }
            }
        }
});

const scene = new THREE.Scene();
scene.add(orthoCamera);
scene.add(perspCamera);

/*
const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 70, -8);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);
*/

// https://threejs.org/examples/webgl_shaders_ocean.html
// Water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('waternormals.jpg', function(texture){
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);

water.name = 'water';
water.rotation.x = -Math.PI / 2;

scene.add(water);

// Skybox
const sky = new Sky();
sky.name = 'sky';
sky.scale.setScalar(10000);

const skyUniforms = sky.material.uniforms;

skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const parameters = {
    elevation: 2.2,
    azimuth: 30
};

const pmremGenerator = new THREE.PMREMGenerator(renderer);

let renderTarget;

function updateSun(){
    const sceneEnv = new THREE.Scene(); // move this out of here if we need to call updateSun multiple times
    const sun = new THREE.Vector3();
    
    const phi = THREE.MathUtils.radToDeg(90 - parameters.elevation);
    const theta = THREE.MathUtils.radToDeg(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    if(renderTarget !== undefined) renderTarget.dispose();

    sceneEnv.add(sky);
    renderTarget = pmremGenerator.fromScene(sceneEnv);
    scene.add(sky);

    scene.environment = renderTarget.texture;
}

updateSun();

function inRange(v1, v2, limit){
    return (v1.x <= v2.x + limit && v1.x >= v2.x - limit && v1.y <= v2.y + limit && v1.y >= v2.y - limit);
}

function move(object, targetPos, directionVec, setIntervalName){
    // stop movement if reach target		
    // remember that in 3d space, downward movement means increasing negative numbers (unlike in 2d where going down means increasing positive value)
    if(inRange(object.position, targetPos, 0.1)){
        clearInterval(setIntervalName);
    }else{
        object.position.addScaledVector(directionVec, 0.2);
    }
}

function getAngleBetween(obj, vec){
    // https://github.com/mrdoob/three.js/issues/1606
    const matrix = new THREE.Matrix4();
    matrix.extractRotation(obj.matrix);
    
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyMatrix4(matrix);

    const currDirectionVector = direction; 
    const angleBetween = currDirectionVector.angleTo(vec);
    
    return angleBetween;
}

function rotate(object, angle, targetVec, setIntervalName, resolve){
    const limit = 0.03;
    const angleBetween = getAngleBetween(object, targetVec);
    
    if(angleBetween >= -limit && angleBetween <= limit){
        console.log("finished rotating");
        clearInterval(setIntervalName);
        resolve("done rotating");
    }else{
        object.rotateOnAxis(new THREE.Vector3(0, 1, 0), angle);
    }
}

function moveObj(objToMove, targetPos){
    // check to make sure what moves are valid.
    // i.e. if an enemy ship is already in another enemy's circle, they can move outside the circle
    // or rotate. they can't move closer if already in range to a fellow enemy. 
    let obj = objToMove;
    let v = targetPos;
    let vec = new THREE.Vector3(v.x - obj.position.x, v.y - obj.position.y, v.z - obj.position.z);
    vec.normalize();
            
    // get curr unit direction vector
    let angleBetween = getAngleBetween(obj, vec);
    console.log(`i need to rotate: ${180 * angleBetween / Math.PI} degrees`);
    
    // figure out if the angle should be added (clockwise) or subtracted (rotate counterclckwise)
    // https://stackoverflow.com/questions/16613616/work-out-whether-to-turn-clockwise-or-anticlockwise-from-two-angles
    let matrix = new THREE.Matrix4();
    matrix.extractRotation(obj.matrix);
    let direction = new THREE.Vector3(0, 0, 1);
    direction.applyMatrix4(matrix);
    let currDirectionVector = direction;
    
    //console.log(`curr forward vector: ${currDirectionVector.x}, ${currDirectionVector.y}, ${currDirectionVector.z}`);
    //console.log(`destination vector: ${vec.x}, ${vec.y}, ${vec.z}`);

    let crossProductLength = currDirectionVector.cross(vec);
    //console.log(`cross product: ${crossProductLength.x}, ${crossProductLength.y}, ${crossProductLength.z}`);
    
    let rotatePromise = new Promise((resolve, reject) => {
        if(crossProductLength.y > 0){ // why y? I believe it's because from the orthographic camera POV, it's an XZ plane and Y is going in/out of the screen.
            // clockwise
            let rotateFunc = setInterval(
                function(){
                    rotate(obj, angleBetween / 40, vec, rotateFunc, resolve);
                }, 35
            );
        }else{
            // counterclockwise
            let rotateFunc = setInterval(
                function(){
                    rotate(obj, -angleBetween / 40, vec, rotateFunc, resolve);
                }, 35
            );
        }
    });
    
    rotatePromise.then((result) => {
        console.log(result);
        
        // move to point clicked
        vec.normalize();
        let moveFunc = setInterval(
            function(){
                obj.isMoving = true;
                move(obj, v, vec, moveFunc);
                obj.isMoving = false;
            }, 30
        );
    });
}

function explosionEffect(mesh, scene, numParticles){
    //console.log('explosion');
    const position = mesh.position;
    const geometry = new THREE.SphereGeometry(0.5, 12, 12);
    const material = new THREE.MeshBasicMaterial({color: 0xffc0cb});//0x848884});
    material.wireframe = true;
    
    for(let i = 0; i < numParticles; i++){
        const particle = new THREE.Mesh(geometry, material);
        particle.position.x = position.x - Math.random() * 3.3;
        particle.position.y = position.y + Math.random() * 2.5;
        particle.position.z = position.z + Math.random() * 2.3;
        
        const sign = Math.random() < 0.5 ? -1 : 1;
        const direction = new THREE.Vector3(
            sign * (Math.random() * -1.2),
            sign * (Math.random() * 2.2),
            sign * (Math.random() * -1.2)
        );
        direction.normalize();
        particle.name = 'particle' + i;
        particle.direction = direction;
        
        scene.add(particle);
        
        setTimeout(() => {
            scene.remove(particle);
        }, 3000);
    }
}

function airstrike(plane, target, scene){
    plane.scale.set(0.85, 0.85, 0.85);
    plane.add(new THREE.AxesHelper(5));
    
    // TODO: fix the axes of the plane model? z is pointing down it seems
    plane.rotateY(Math.PI / 2);
    plane.rotateX(Math.PI / 2);
    
    scene.add(plane);
    const start = new THREE.Vector3();
    start.copy(target.position);
    start.x -= 300;
    start.y += 50;
    
    plane.position.copy(start);
    
    // TODO: put plane on a path (with some turns) for more realistic/cool airstrike?
    
    plane.direction = new THREE.Vector3(3, 0, 0);
    plane.target = target;
    
    setTimeout(() => {
        scene.remove(plane);
    }, 8000);
}

function convert2dCoordsTo3d(camera, containerWidth, containerHeight){
    let posX = Math.floor(Math.random() * containerWidth);
    let posY = Math.floor(Math.random() * containerHeight);
	let x = posX / containerWidth * 2 - 1;
	let y = posY / containerHeight * -2 + 1;
	let v = new THREE.Vector3(x, y, 0).unproject(camera);
	return v;
}

function togglePlayerSelectArea(playerMesh, scene){
    if(playerMesh.selectAreaOn){
        playerMesh.selectAreaOn = false;
        scene.remove(playerMesh.selectArea);
    }else{
        // a delta of 1.0 from the current y pos of playerMesh seems good (although not sure why if setting it to a lower y it doesn't appear in the orthographic camera but things look fine in the perspective camera :/)
        playerMesh.selectArea.position.set(playerMesh.position.x, playerMesh.position.y + 1.7, playerMesh.position.z);
        scene.add(playerMesh.selectArea);
        playerMesh.selectAreaOn = true;
    }
}

function placeObject(object){
    const v = convert2dCoordsTo3d(orthoCamera, WIDTH, HEIGHT);
    
    if(object.name === 'enemy'){
        object.position.set(v.x, -1.5, v.y);
    }else if(object.name === 'player'){
        object.position.set(v.x, -0.7, v.y); // note the y pos here. important for the selectArea circle mesh
    }else{
        object.position.set(v.x, 0, v.y);
    }
    
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.name = 'axeshelper';
    object.add(axesHelper);
}

function placeObstacles(obj){
    if(obj){
        const v = convert2dCoordsTo3d(orthoCamera, WIDTH, HEIGHT);
        
        // TODO: rotate about Z randomly
        obj.scale.x *= 0.15;
        obj.scale.y *= 0.15;
        obj.scale.z *= 0.15;
        obj.position.set(v.x, 0, v.y);
        scene.add(obj);
    }
}

document.getElementById('toggleLerpCamera').addEventListener('click', () => {
    lerpCamera = !lerpCamera;
    if(currCamera == orthoCamera){
        currCamera = perspCamera;
        document.getElementById('toggleOrbitControl').disabled = false;
    }else{
        currCamera = orthoCamera;
        document.getElementById('toggleOrbitControl').disabled = true;
    }
});

document.getElementById('toggleOrbitControl').addEventListener('change', () => {
    orbitControlsOn = !orbitControlsOn;
    orbitControls.enabled = orbitControlsOn;
});

document.getElementById('toggleAirstrike').addEventListener('change', () => {
    airstrikeOn = !airstrikeOn;
});

const loadedModels = [];
loadedModels.push(getModel('battleship-edit2.gltf', 'player', 'player'));
loadedModels.push(getModel('battleship2.glb', 'enemy', 'enemy'));
loadedModels.push(getModel('spiky-thing.gltf', 'none', 'obstacle'));
loadedModels.push(getModel('f14.gltf', 'none', 'plane'));

function getModel(modelFilePath, side, name){
    return new Promise((resolve, reject) => {
        loader.load(
            modelFilePath,
            function(gltf){
                gltf.scene.traverse((child) => {
                    if(child.type === "Mesh"){
        
                        let material = child.material;
                        let geometry = child.geometry;
                        let obj = new THREE.Mesh(geometry, material);
                        
                        if(name !== 'player'){
                            obj.scale.x = child.scale.x * 20;
                            obj.scale.y = child.scale.y * 20;
                            obj.scale.z = child.scale.z * 20;
                        }else{
                            obj.scale.x = child.scale.x * 3;
                            obj.scale.y = child.scale.y * 3;
                            obj.scale.z = child.scale.z * 3;
                        }
                        
                        obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI / 2); // note this on object's local axis! so when you rotate, the axes change (i.e. x becomes z)
                        //obj.rotateOnAxis(new THREE.Vector3(0,0,1), Math.PI / 2);
                    
                        obj.side = side; // player or enemy mesh?
                        resolve(obj);
                        obj.name = name;
                        
                        if(name === 'player'){
                            // add select area to player mesh
                            const geometry = new THREE.CircleGeometry(17, 32);
                            const material = new THREE.MeshBasicMaterial({color: 0xffff00, opacity: 0.5, transparent: true, side: THREE.DoubleSide});
                            const circle = new THREE.Mesh(geometry, material);
                            circle.name = "selectArea";
                            circle.rotateX(Math.PI / 2);
                            
                            obj.isMoving = false;
                            obj.selectArea = circle;
                            obj.selectAreaOn = false; // TODO: maybe we don't need this flag? can we just check the circle mesh's parent? e.g. scene if in scene, nothing if not in scene?
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
                console.log( 'An error happened' );
                console.log(error);
            }
        );
    });
}

function update(){
    if(lerpCamera){
        if(currentPlayerUnit){
            const currObj = currentPlayerUnit;
            const pos = currObj.position;
            
            // some position relative to the player's current unit
            const endCamPos = new THREE.Vector3(
                pos.x + 80,
                pos.y + 2,
                pos.z - 10
            );
            
            if(!orbitControls.enabled){
                perspCamera.position.copy(endCamPos);
                perspCamera.lookAt(currObj.position);
            }
            
            if(orbitControls.enabled){
                orbitControls.target = currentPlayerUnit.position;
                orbitControls.update();
            }
        }
        renderer.render(scene, perspCamera);
    }else{
        renderer.render(scene, orthoCamera);
    }

    scene.children.forEach(child => {
        if(child.name.includes("particle")){
            child.position.add(child.direction);
        }
        
        // for airstrike
        if(child.name.includes("plane")){
            child.position.add(child.direction);
            
            if(Math.abs(child.target.position.x - child.position.x) <= 1.5){
                document.getElementById("container").className = "airstrikeShake";
                setTimeout(() => { document.getElementById("container").className = ""; }, 1000);
                explosionEffect(child.target, scene, 60);
            }
        }
    });

    water.material.uniforms['time'].value += 1.0 / 60.0;

    requestAnimationFrame(update);
}

Promise.all(loadedModels).then((objects) => {
    console.log(objects);
    
    // place obstacles
    const obstacleModel = objects.filter(x => x.name === "obstacle")[0];
    for(let i = 0; i < 10; i++){
        const obstacle = obstacleModel.clone();
        placeObstacles(obstacle);
    }
    
    objects.forEach((obj) => {
        obj.castShadow = true;
        if(obj.side === "enemy"){
            placeObject(obj);
            scene.add(obj);
        }else if(obj.side === "player"){
            placeObject(obj);
            scene.add(obj);
            currentPlayerUnit = obj;
        }else if(obj.name === 'plane'){
            planeModel = obj;
        }
    });
    
    // after all objects are loaded, start showing things
    requestAnimationFrame(update);
});
