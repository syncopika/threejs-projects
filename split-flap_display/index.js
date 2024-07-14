// new project template

const container = document.getElementById("container");
//const keyboard = new THREEx.KeyboardState();

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 2, 10);

//const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const loadingManager = new THREE.LoadingManager();
setupLoadingManager(loadingManager);

const loader = new THREE.GLTFLoader(loadingManager);

const textureLoader = new THREE.TextureLoader();

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 15, 15);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// set up trackball control
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 3.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;

const hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 10, 0);
scene.add(hemiLight);

const clock = new THREE.Clock();

// keep track of the flaps that show the letters
let topFlap = null;
let bottomFlap = null;

let animationMixer = null;
let animationClips = null;
let action = null;

const textures = {};

const letters = 'abcdefghijklmnopqrstuvwxyz';
letters.split('').forEach(l => textures[l] = {});

function getModel(modelFilePath){
  return new Promise((resolve, reject) => {
    loader.load(
      modelFilePath,
      async function(gltf){
        // get animations
        const clips = {};
        gltf.animations.forEach(action => {
          let name = action['name'].toLowerCase();
          name = name.substring(0, name.length);
          clips[name] = action;
        });
        animationClips = clips;
        
        [...gltf.scene.children].forEach(c => {
          if(c.type === 'Object3D'){
            c.children.forEach(x => {
              if(x.name === 'flap1001'){
                topFlap = x;
              }else if(x.name === 'flap12001'){
                bottomFlap = x;
              }
            });
            
            animationMixer = new THREE.AnimationMixer(c);
            
            animationMixer.addEventListener('loop', () => {
              const letters = Array.from(Object.keys(textures));
              const pick = letters[Math.floor(Math.random() * letters.length)];
              const newTexture = textures[pick];
              if(topFlap && newTexture.top) topFlap.material = newTexture.top;
              if(bottomFlap && newTexture.bottom) bottomFlap.material = newTexture.bottom;
            });
            
            action = animationMixer.clipAction(animationClips['move']);
            console.log(action);
          }
          scene.add(c);
        });
        
        console.log(scene);
        console.log(topFlap);
        console.log(bottomFlap);
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

function getTextures(){
  Object.keys(textures).forEach(letter => {
    // load top part of letter image
    textureLoader.load(
      `letters/${letter}-top.png`,
      (texture) => {
        texture.flipY = false;
        textures[letter]['top'] = new THREE.MeshBasicMaterial({map: texture, skinning: true});
      },
      undefined,
      (err) => console.error(err)
    );
    
    // load bottom part of letter image
    textureLoader.load(
      `letters/${letter}-bottom.png`,
      (texture) => {
        texture.flipY = false;
        textures[letter]['bottom'] = new THREE.MeshBasicMaterial({map: texture, skinning: true});
      },
      undefined,
      (err) => console.error(err)
    );
    
    // TODO: should return promise so we know everything's been loaded?
    //console.log(textures);
  });
}

function update(){
  // move stuff around, etc.
  const sec = clock.getDelta();
  if(animationMixer) animationMixer.update(sec);
}

document.getElementById('test').addEventListener('click', () => {
  const letters = Array.from(Object.keys(textures));
  const pick = letters[Math.floor(Math.random() * letters.length)];
  const newTexture = textures[pick];
  if(topFlap && newTexture.top) topFlap.material = newTexture.top;
  if(bottomFlap && newTexture.bottom) bottomFlap.material = newTexture.bottom;
  if(!action.isRunning()){
    action.play();
  }else{
    action.stop();
  }
});


function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
  update();
}

getModel("../models/split-flap-idea.gltf");
getTextures();
animate();