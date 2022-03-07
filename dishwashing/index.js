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

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

const camera = defaultCamera;
camera.position.set(0,4,9);
camera.rotateX(-Math.PI/5);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);
scene.add(camera);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 10, 0);
pointLight.castShadow = true;
scene.add(pointLight);

const hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const clock = new THREE.Clock();

let loadedModels = [];
let animationMixerRightHand = null;
let animationMixerLeftHand = null;
let animationClips = null;

let rightHand;
let leftHand;

function getModel(modelFilePath, side, name){
    return new Promise((resolve, reject) => {
        loader.load(
            modelFilePath,
            function(gltf){
                if(name === "rightHand" && gltf.animations.length > 0){
                    let clips = {};
                    gltf.animations.forEach((action) => {
                        let name = action['name'].toLowerCase();
                        name = name.substring(0, name.length);
                        clips[name] = action;
                    });
                    animationClips = clips;
                }
                
                gltf.scene.traverse((child) => {
                    //console.log(child);
                    if(child.type === "Mesh" || child.type === "SkinnedMesh"){
                        let obj = child;
                        if(child.type === "Mesh"){
                            //console.log(obj);
                        }
                        if(name === "rightHand" && child.type === "SkinnedMesh"){
                            obj.add(child.skeleton.bones[0]);
                            //console.log(child.skeleton.bones[0]);
                        }else if(name === "leftHand" && child.type === "SkinnedMesh"){
                            obj.add(child.skeleton.bones[0]);
                        }
                        
                        obj.name = name;
                        
                        resolve(obj); // this will return only one mesh. if you expect a scene to yield multiple meshes, this will fail.
                    }
                });
                
                // for the dishes
                if(name === "obj"){
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
loadedModels.push(getModel('models/hand-edit.gltf', '', 'rightHand'));
loadedModels.push(getModel('models/hand-edit.gltf', '', 'leftHand'));
loadedModels.push(getModel('models/plate.gltf', '', 'plate'));

Promise.all(loadedModels).then((objects) => {
    objects.forEach((mesh) => {
        if(mesh.name === "bg"){
            mesh.position.set(0, 0, 0);
            mesh.receiveShadow = true;
        }else if(mesh.name === "plate"){
            // objs that can be equipped
            mesh.castShadow = true;
            mesh.position.set(0, -5, 0);
            mesh.scale.x *= 8;
            mesh.scale.y *= 8;
            mesh.scale.z *= 8;
        }else if(mesh.name === "rightHand"){
            mesh.castShadow = true;

            rightHand = mesh;
            rightHand.translateX(3);
            rightHand.rotateX(-Math.PI/3);
            rightHand.rotateY((3*Math.PI)/2);
            const rightAxesHelper = new THREE.AxesHelper(4);
            rightHand.add(rightAxesHelper);
            
            animationMixerRightHand = new THREE.AnimationMixer(rightHand);
            const action = animationMixerRightHand.clipAction(animationClips["idle"]);
            console.log(animationMixerRightHand);
            
            action.play();
            
            animate();
        }else if(mesh.name === "leftHand"){
            mesh.castShadow = true;
            leftHand = mesh;
            leftHand.applyMatrix4(new THREE.Matrix4().makeScale(1,1,-1));
            leftHand.translateX(2);
            leftHand.rotateX(Math.PI/3);
            leftHand.rotateY((3*Math.PI)/2);
            const leftAxesHelper = new THREE.AxesHelper(4);
            leftHand.add(leftAxesHelper);
            
            animationMixerLeftHand = new THREE.AnimationMixer(leftHand);
            const action = animationMixerLeftHand.clipAction(animationClips["hold2"]);
            console.log(animationMixerLeftHand);
            
            action.play();
        }
        scene.add(mesh);
        //renderer.render(scene, camera);
    })
});

function keydown(evt){
}

function keyup(evt){
}

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);


function update(){
    const sec = clock.getDelta();
    const moveDistance = 8 * sec;
    const rotationAngle = (Math.PI / 2) * sec;
    //leftHand.rotateX(rotationAngle);
    //rightHand.rotateY(rotationAngle);
    if(animationMixerLeftHand) animationMixerLeftHand.update(sec);
    if(animationMixerRightHand) animationMixerRightHand.update(sec);
}

function animate(){
    //stats.begin();
    //stats.end();
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}