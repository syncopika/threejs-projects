// audio visualization
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
// https://github.com/syncopika/jsProjects/blob/master/audio_visualizer/audioVisualiser.html

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
spotLight.position.set(0, 50, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 10, 5);
//pointLight.castShadow = true;
scene.add(pointLight);

//const hemiLight = new THREE.HemisphereLight(0xffffff);
//hemiLight.position.set(0, 10, 0);
//scene.add(hemiLight);

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
const analyser = audioCtx.createAnalyser();
const bufferLength = analyser.frequencyBinCount;
const buffer = new Uint8Array(bufferLength);
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
            audioSource.connect(audioCtx.destination);
        });
    }
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

const visualizationSpheres = [];
function createVisualization(){
    const numSpheres = 50;
    const increment = Math.floor(bufferLength / numSpheres);
    const xIncrement = 0.5 + 0.6; // 0.5 is the radius of a sphere, 0.5 for buffer space
    let xPos = -20;
    
    for(let i = 0; i < bufferLength; i += increment){
        const newSphere = createVisualizationSphere();
        visualizationSpheres.push(newSphere);
        
        newSphere.position.x = xPos + xIncrement;
        newSphere.position.z = -12;
        
        scene.add(newSphere);
        
        xPos += xIncrement;
    }
}

function updateVisualization(audioDataBuffer){
    const increment = Math.floor(bufferLength / visualizationSpheres.length);
    
    for(let i = 0; i < visualizationSpheres.length; i++){
        const value = audioDataBuffer[i*increment] / 128.0; // why 128?
        const y = value * 10; // multiply by maximum height
        
        const sphere = visualizationSpheres[i];
        sphere.position.lerp(new THREE.Vector3(sphere.position.x, y, sphere.position.z), 0.15);
        //sphere.position.y = y; // corresponds to amplitude from time domain
    }
}

function play(){
    isPlaying = true;
    isStopped = false;
    audioSource.start();
}
document.getElementById("play").addEventListener("click", play);

function stop(){
    isPlaying = false;
    isStopped = true;
    audioSource.stop();
    
    // reload since we can't restart buffer source
    if(audioFileUrl) loadAudioFile(audioFileUrl);
}
document.getElementById("stop").addEventListener("click", stop);

function update(){
    if(isPlaying){
        analyser.getByteTimeDomainData(buffer);
        updateVisualization(buffer);
    }
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

// enable audio file finding
const openFile = (function(){
   return function(handleFileFunc){
       const fileInput = document.getElementById('fileInput');
       
       function onFileChange(evt){
           const files = evt.target.files;
           if(files && files.length > 0){
               handleFileFunc(files[0]);
           }
       }
       
       fileInput.addEventListener("change", onFileChange, false);
       fileInput.click();
   } 
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
        }
    })(file);
    
    reader.readAsDataURL(file);
    loadAudioFile(audioFileUrl);
}

document.getElementById("importAudio").addEventListener("click", () => {
    openFile(handleFile);
});

function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    update();
}

createVisualization();
animate();