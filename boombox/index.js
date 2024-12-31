// boombox idea
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics

const container = document.getElementById('container');

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 4, 10);

const loadingManager = new THREE.LoadingManager();
setupLoadingManager(loadingManager);

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);    
container.appendChild(renderer.domElement);

// set up trackball control
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 3.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 70, -8);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(2, 10, 10);
pointLight.castShadow = true;
scene.add(pointLight);

let boomboxMesh = null;

const audioCtx = new AudioContext();
const listener = audioCtx.listener;
const biquadFilter = audioCtx.createBiquadFilter();
biquadFilter.type = 'lowpass';
const analyser = audioCtx.createAnalyser(); // default fft size is 2048
const bufferLength = analyser.frequencyBinCount;
const buffer = new Uint8Array(bufferLength);
const panner = new PannerNode(audioCtx, {
  panningModel: 'HRTF',
  coneInnerAngle: 60,
  coneOuterAngle: 90,
  coneOuterGain: 0.5,
  rollOffFactor: 5,
  refDistance: 5,
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  orientationX: 0,
  orientationY: 0,
  orientationZ: -1,
});

let audioSource;
let audioFileUrl;
let isPlaying = false;

function setMorphAction(boombox, actionName, amount){
  const targetInfluenceIndex = boombox.morphTargetDictionary[actionName];
  if(targetInfluenceIndex !== undefined){
    boombox.morphTargetInfluences[targetInfluenceIndex] = amount;
  }
}

function updateTimeDomainVisualization(audioDataBuffer){
  //console.log(Math.max(...audioDataBuffer));
  const maxVal = Math.max(...audioDataBuffer);
  setMorphAction(boomboxMesh, 'move-speakers', (maxVal - 128) / 128);
}

function loadAudioFile(url){
  //console.log('loading: ' + url);
  audioSource = audioCtx.createBufferSource();  

  const req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.responseType = 'arraybuffer';
  req.onload = function(){
    audioCtx.decodeAudioData(req.response, (buffer) => {
      if (!audioSource.buffer) audioSource.buffer = buffer;
      audioSource.connect(analyser);
      audioSource
        .connect(panner)
        .connect(biquadFilter)
        .connect(audioCtx.destination);
    });
  };
  req.send();
}

function play(){
  if(!isPlaying && audioSource){
    isPlaying = true;
    
    if(boomboxMesh){
      setMorphAction(boomboxMesh, 'play', 1.0);
      setMorphAction(boomboxMesh, 'stop', 0.0);
      setMorphAction(boomboxMesh, 'pause', 0.0);
      setMorphAction(boomboxMesh, 'move-speakers', 0.0);
    }
    
    audioSource.start();
  }
}
document.getElementById('play').addEventListener('click', play);

function stop(){
  if(isPlaying && audioSource){
    isPlaying = false;
    
    if(boomboxMesh){
      setMorphAction(boomboxMesh, 'play', 0.0);
      setMorphAction(boomboxMesh, 'stop', 1.0);
      setMorphAction(boomboxMesh, 'pause', 0.0);
      setMorphAction(boomboxMesh, 'move-speakers', 0.0);
    }
    
    audioSource.stop();
  }
    
  // reload since we can't restart buffer source
  if(audioFileUrl) loadAudioFile(audioFileUrl);
}
document.getElementById('stop').addEventListener('click', stop);

document.getElementById('lowpassSlider').addEventListener('input', (evt) => {
  const val = parseInt(evt.target.value);
  if(boomboxMesh) setMorphAction(boomboxMesh, 'move-filter', Math.min(val / 10000, 1.0));
  biquadFilter.frequency.setValueAtTime(val, audioCtx.currentTime);
});

// enable audio file finding
const openFile = (function(){    
  return function(handleFileFunc){
    if(isPlaying) return;
       
    const fileInput = document.getElementById('fileInput');
       
    function onFileChange(evt){
      const files = evt.target.files;
      if(files && files.length > 0){
        handleFileFunc(files[0]);
      }
    }
       
    fileInput.addEventListener('change', onFileChange, false);
    fileInput.click();
  }; 
})();

function handleFile(file){
  audioFileUrl = URL.createObjectURL(file);
  const type = /audio.*/;
  if(!file.type.match(type)){
    return;
  }
    
  const reader = new FileReader();
  reader.onload = (function(f){
    return function(){
      document.getElementById('audioFileName').textContent = f.name;
    };
  })(file);
    
  reader.readAsDataURL(file);
  loadAudioFile(audioFileUrl);
}

document.getElementById('importAudio').addEventListener('click', () => {
  openFile(handleFile);
});


function getModel(modelFilePath){
  return new Promise((resolve) => {
    loader.load(
      modelFilePath,
      function(gltf){
        resolve(gltf.scene);
      },
      // called while loading is progressing
      function(xhr){
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      // called when loading has errors
      function(error){
        console.log('An error happened');
        console.log(error);
      }
    );
  });
}

getModel('../models/boombox.gltf').then(boombox => {
  boombox.position.z += 6;
  boombox.position.y += 1;
  boombox.rotateY(-Math.PI / 2);
  scene.add(boombox);
  console.log(boombox);
  
  listener.positionX.value = boombox.position.x; //camera.position.x;
  listener.positionY.value = boombox.position.y; //camera.position.y;
  listener.positionZ.value = boombox.position.z; //camera.position.z;
  
  boomboxMesh = boombox.children[3];
  
  // load demo audio
  audioFileUrl = '../models/080415pianobgm3popver-edit-steinway.ogg';
  loadAudioFile(audioFileUrl);
  document.getElementById('audioFileName').textContent = '080415pianobgm3popver-edit-steinway.ogg';
});

function update(){
  if(isPlaying){
    analyser.fftSize = 256;
    analyser.getByteTimeDomainData(buffer);
    updateTimeDomainVisualization(buffer);
    
    panner.positionX.value = camera.position.x;
    panner.positionY.value = camera.position.y;
    panner.positionZ.value = camera.position.z;
  }
}

function animate(){
  controls.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}

animate();