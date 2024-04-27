// audio visualization
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
// https://github.com/syncopika/jsProjects/blob/master/audio_visualizer/audioVisualiser.html

const container = document.getElementById("container");

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 2, 15);

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
spotLight.position.set(0, 50, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 15, 10);
//pointLight.castShadow = true;
scene.add(pointLight);

const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 1.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;

const clock = new THREE.Clock();

// add a plane
const planeGeometry = new THREE.PlaneGeometry(65, 65);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0x055C9D});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
plane.position.y = -3;
plane.position.z = -10;
scene.add(plane);

// set up web audio stuff
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser(); // default fft size is 2048
const bufferLength = analyser.frequencyBinCount;
const buffer = new Uint8Array(bufferLength);

// make a separate analyser node for frequency-domain data (it'll have a different fftSize)
const freqAnalyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
const freqBufferLength = freqAnalyser.frequencyBinCount;
const freqBuffer = new Uint8Array(freqBufferLength);

let audioSource;
let audioFileUrl;
let isPlaying = false;
let isStopped = true;

function loadAudioFile(url){
  //console.log("loading: " + url);
  audioSource = audioCtx.createBufferSource();  

  const req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.responseType = 'arraybuffer';
  req.onload = function(){
    audioCtx.decodeAudioData(req.response, (buffer) => {
      if (!audioSource.buffer) audioSource.buffer = buffer;
      audioSource.connect(analyser);
      audioSource.connect(freqAnalyser);
      audioSource.connect(audioCtx.destination);
    });
  };
  req.send();
}

function createVisualizationSphere(){
  const sphereGeometry = new THREE.SphereGeometry(0.5, 30, 16);
  const sphereMaterial = new THREE.MeshPhongMaterial({color: '#ff69b4'});
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.receiveShadow = true;
  sphere.castShadow = true;
  return sphere;
}

function createVisualizationCube(){
  const boxGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const boxMaterial = new THREE.MeshPhongMaterial({color: '#aaff00'});
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.receiveShadow = true;
  box.castShadow = true;
  return box;    
}

// visualization for time domain
const visualizationSpheres = [];
function createTimeDomainVisualization(){
  const numSpheres = 50;
  const increment = Math.floor(bufferLength / numSpheres);
  const xIncrement = 0.5 + 0.6; // 0.5 is the radius of a sphere, + extra buffer space between the next sphere
  let xPos = -25;
    
  for(let i = 0; i < bufferLength; i += increment){
    const newSphere = createVisualizationSphere();
    visualizationSpheres.push(newSphere);
        
    newSphere.position.x = xPos + xIncrement;
    newSphere.position.z = -12;
        
    scene.add(newSphere);
        
    xPos += xIncrement;
  }
}

function updateTimeDomainVisualization(audioDataBuffer){
  const increment = Math.floor(bufferLength / visualizationSpheres.length);
    
  for(let i = 0; i < visualizationSpheres.length; i++){
    const value = audioDataBuffer[i*increment] / 128.0; // why 128?
    const y = value * 10; // multiply by maximum height
        
    const sphere = visualizationSpheres[i];
    sphere.position.lerp(new THREE.Vector3(sphere.position.x, y, sphere.position.z), 0.3); // lerp for smoother animation
    //sphere.position.y = y; // corresponds to amplitude from time domain
  }
}

// visualization for frequency domain
const visualizationCubes = [];
function createFrequencyDomainVisualization(){
  const numCubes = 50;
  const increment = Math.floor(freqBufferLength / numCubes);
  const xIncrement = 0.3 + 0.2; // cube is 0.3 x 0.3 x 0.3
  let xPos = -12;
    
  for(let i = 0; i < freqBufferLength; i += increment){
    const newCube = createVisualizationCube();
    newCube.position.x = xPos + xIncrement;
    newCube.position.z = -20;
    visualizationCubes.push(newCube);
    scene.add(newCube);
    xPos += xIncrement;
  }
}

function updateFreqDomainVisualization(audioDataBuffer){
  const increment = Math.floor(freqBufferLength / visualizationCubes.length);
  for(let i = 0; i < visualizationCubes.length; i++){
    const value = audioDataBuffer[i*increment];
    const cube = visualizationCubes[i];
        
    // scale the cube based on freq bin value
    cube.scale.lerp(new THREE.Vector3(1, value, 1), 0.2);
  }
}

function play(){
  if(!isPlaying && audioSource){
    isPlaying = true;
    isStopped = false;
    audioSource.start();
  }
}
document.getElementById("play").addEventListener("click", play);

function stop(){
  if(isPlaying && audioSource){
    isPlaying = false;
    isStopped = true;
    audioSource.stop();
  }
    
  // reload since we can't restart buffer source
  if(audioFileUrl) loadAudioFile(audioFileUrl);
}
document.getElementById("stop").addEventListener("click", stop);

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
       
    fileInput.addEventListener("change", onFileChange, false);
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
    return function(evt){
      document.getElementById('audioFileName').textContent = f.name;
    };
  })(file);
    
  reader.readAsDataURL(file);
  loadAudioFile(audioFileUrl);
}

document.getElementById("importAudio").addEventListener("click", () => {
  openFile(handleFile);
});

function update(){
  if(isPlaying){
    // time domain viz
    analyser.fftSize = 2048;
    analyser.getByteTimeDomainData(buffer);
    updateTimeDomainVisualization(buffer);
        
    // freq domain viz
    freqAnalyser.getByteFrequencyData(freqBuffer);
    updateFreqDomainVisualization(freqBuffer);
  }
  
  // update trackball
  controls.update();
}

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}

createTimeDomainVisualization();
createFrequencyDomainVisualization();
animate();