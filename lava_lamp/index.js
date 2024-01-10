// lava lamp
// borrowed some code from https://threejs.org/examples/webgl_marchingcubes.html

import { MarchingCubes } from '../libs/MarchingCubes.js';

const container = document.getElementById("container");
//const keyboard = new THREEx.KeyboardState();

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 4, 10);

//const raycaster = new THREE.Raycaster();
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
spotLight.position.set(0, 30, -5);
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

const clock = new THREE.Clock();
let time = 0;

// add a plane and a sphere
const planeGeometry = new THREE.PlaneGeometry(25, 25);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0x055C9D});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
scene.add(plane);

const sphereGeometry = new THREE.SphereGeometry(0.9, 32, 16);
const sphereMaterial = new THREE.MeshPhongMaterial();
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.receiveShadow = true;
sphere.castShadow = true;
sphere.position.x = 0;
sphere.position.y = 4;
sphere.position.z = 0;
//scene.add(sphere);

// marching cubes stuff
const resolution = 28;
const effect = new MarchingCubes(resolution, sphereMaterial, true, true, 100000);
effect.position.set(0, 5, -5);
effect.scale.set(3, 3, 3);

effect.enableUvs = false;
effect.enableColors = false;

scene.add(effect);

let lampModel = null;

function getModel(modelFilePath, name){
    return new Promise((resolve, reject) => {
        loader.load(
            modelFilePath,
            function(gltf){
                gltf.scene.traverse(child => {
                    if(child.type === "Mesh"){
                        const obj = child;
                        obj.name = name;
                        resolve(obj);
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
getModel("lava-lamp.gltf", "lavalamp").then(obj => {
  lampModel = obj;
  lampModel.castShadow = true;
  console.log(lampModel);
  scene.add(lampModel);
  lampModel.position.set(0, 2, -5);
  lampModel.scale.set(1.5, 1.5, 1.5);
});

// this controls content of marching cubes voxel field
function updateCubes(object, time, numblobs, floor){ //, wallx, wallz){
    object.reset();

    // fill the field with some metaballs
    const rainbow = [
        new THREE.Color(0xff0000),
        new THREE.Color(0xffbb00),
        new THREE.Color(0xffff00),
        new THREE.Color(0x00ff00),
        new THREE.Color(0x0000ff),
        new THREE.Color(0x9400bd),
        new THREE.Color(0xc800eb)
    ];
    
    const subtract = 12;
    const strength = 1.2 / ((Math.sqrt(numblobs) - 1) / 4 + 1);

    for(let i = 0; i < numblobs; i ++ ){
        const ballx = Math.sin(i + 1.26 * time * (1.03 + 0.5 * Math.cos(0.21 * i))) * 0.27 + 0.5;
        const bally = Math.abs(Math.cos( i + 1.12 * time * Math.cos(1.22 + 0.1424 * i))) * 0.77; // dip into the floor
        const ballz = 0;//Math.cos(i + 1.32 * time * 0.1 * Math.sin((0.92 + 0.53 * i))) * 0.27 + 0.5;

        /*
        if(current_material === 'multiColors'){
            object.addBall(ballx, bally, ballz, strength, subtract, rainbow[i % 7]);
        }else{
            object.addBall(ballx, bally, ballz, strength, subtract);
        }*/
        object.addBall(ballx, bally, ballz, strength, subtract);
    }

    if(floor) object.addPlaneY(2, 12);
    //if (wallz) object.addPlaneZ( 2, 12 );
    //if (wallx) object.addPlaneX( 2, 12 );

    object.update();
}

function update(){
			const delta = clock.getDelta();

			time += delta * 1.0 * 0.5;

			// marching cubes
			updateCubes(effect, time, 5, true);
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
    update();
}

animate();