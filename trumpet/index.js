// new project template

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
scene.background = new THREE.Color(0xeeeeff);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 50, 30);
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

// add a plane and a sphere
const planeGeometry = new THREE.PlaneGeometry(25, 25);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0x055C9D});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
//scene.add(plane);

/*
const sphereGeometry = new THREE.SphereGeometry(0.9, 32, 16);
const sphereMaterial = new THREE.MeshPhongMaterial();
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.receiveShadow = true;
sphere.castShadow = true;
sphere.position.x = 0;
sphere.position.y = 4;
sphere.position.z = 0;
scene.add(sphere);
*/
const valves = {1: null, 2: null, 3: null};

function getModel(modelFilePath){
    return new Promise((resolve, reject) => {
        loader.load(
            modelFilePath,
            async function(gltf){
                scene.add(gltf.scene);
                gltf.scene.rotateY(Math.PI / 2);
                gltf.scene.translateZ(-1);
                gltf.scene.translateY(3);
                
                // get valves
                console.log(gltf.scene.children);
                // cylinders 003, 005 and 006 represent the valves
                gltf.scene.children.forEach(child => {
                    if(child.name.includes('003')){
                        valves[1] = child;
                    }else if(child.name.includes('005')){
                        valves[2] = child;
                    }else if(child.name.includes('006')){
                        valves[3] = child;
                    }
                });
                
                console.log(valves);
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

function update(){
    // move stuff around, etc.
}

function keydown(evt){
    if(evt.keyCode === 49){
        //1 key
        valves[1].morphTargetInfluences[0] = 1.0;
    }else if(evt.keyCode === 50){
        //2 key
        valves[2].morphTargetInfluences[0] = 1.0;
    }else if(evt.keyCode === 51){
        //3 key
        valves[3].morphTargetInfluences[0] = 1.0;
    }
}
document.addEventListener("keydown", keydown);

function keyup(evt){
    if(evt.keyCode === 49){
        //1 key
        valves[1].morphTargetInfluences[0] = 0.0;
    }else if(evt.keyCode === 50){
        //2 key
        valves[2].morphTargetInfluences[0] = 0.0;
    }else if(evt.keyCode === 51){
        //3 key
        valves[3].morphTargetInfluences[0] = 0.0;
    }
}
document.addEventListener("keyup", keyup);


function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    update();
}

getModel("trumpet.gltf", "trumpet");
animate();
