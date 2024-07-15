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

const currentSplitFlapDisplays = [];

const textures = {};

const letters = 'abcdefghijklmnopqrstuvwxyz';
letters.split('').forEach(l => textures[l] = {});

class SplitFlapDisplay {
  constructor(scene, mesh, textures, animationClips){
    this.scene = scene;
    this.mesh = mesh;
    
    // keep track of the flaps that show the letters
    this.topFlap = mesh.children.find(x => x.name === 'flap1001');
    this.bottomFlap = mesh.children.find(x => x.name === 'flap12001');
    
    this.animationClips = animationClips;
    this.animationMixer = new THREE.AnimationMixer(mesh);
    
    this.animationMixer.addEventListener('loop', () => {
      if(this.destinationLetter && this.destinationLetter === this.currentLetter){
        this.moveAction.stop();
      }
      
      const letters = Array.from(Object.keys(textures));
      const pick = letters[Math.floor(Math.random() * letters.length)];
      const newTexture = textures[pick];
      
      if(this.topFlap && newTexture.top) this.topFlap.material = newTexture.top;
      if(this.bottomFlap && newTexture.bottom) this.bottomFlap.material = newTexture.bottom;
      
      this.currentLetter = pick;
    });
    
    this.moveAction = this.animationMixer.clipAction(animationClips['move']);
    
    this.currentLetter = null;
    this.destinationLetter = null;
  }
  
  attachToScene(){
    this.scene.add(this.mesh);
  }
  
  removeFromScene(){
    this.scene.remove(this.mesh);
  }
  
  play(){
    this.moveAction.play();
  }
  
  stop(){
    this.moveAction.stop();
  }
  
  getAnimationMixer(){
    return this.animationMixer;
  }
  
  getAction(){
    return this.moveAction;
  }
  
  setPosition(x, y, z){
    this.mesh.position.set(x, y, z);
  }
  
  setDestinationLetter(letterToStopAt){
    this.destinationLetter = letterToStopAt;
  }
}

function getModel(modelFilePath, xPos=null){
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
        
        [...gltf.scene.children].forEach(c => {
          if(c.type === 'Object3D'){
            const newDisplay = new SplitFlapDisplay(scene, c, textures, clips);
            
            newDisplay.attachToScene();
            
            currentSplitFlapDisplays.push(newDisplay);
            
            if(xPos){
              newDisplay.setPosition(
                xPos,
                c.position.y,
                c.position.z,
              );
            }
          }
        });
        
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
  
  currentSplitFlapDisplays.forEach(disp => {
    const animationMixer = disp.getAnimationMixer();
    if(animationMixer) animationMixer.update(sec);
  });
}

document.getElementById('test').addEventListener('click', () => {
  currentSplitFlapDisplays.forEach(disp => {
    const action = disp.getAction();
    if(!action.isRunning()){
      action.play();
    }else{
      action.stop();
    }
  });
});


function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
  update();
}

getTextures();

const numDisplays = 3;
let xPos = -5;

for(let i = 0; i < numDisplays; i++){
  getModel("../models/split-flap-idea.gltf", xPos);
  xPos += 5;
}

animate();