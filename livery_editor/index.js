let currModel = null;
let currModelTextureMesh = null; // use this variable to keep track of the mesh whose texture is being edited

const loader = new THREE.GLTFLoader();
const textureLoader = new THREE.TextureLoader();

const container = document.getElementById("display");
const renderer = new THREE.WebGLRenderer({antialias: true});
const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

camera.position.set(0, 10, 18);
camera.rotateOnAxis(new THREE.Vector3(1,0,0), -Math.PI/8);
scene.add(camera);

// https://discourse.threejs.org/t/solved-glb-model-is-very-dark/6258
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
hemiLight.position.set(0, 200, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( 0, 100, -10);
scene.add(dirLight);

// set up trackball control
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 1.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
//controls.noZoom = false;
//controls.noPan = false;
//controls.staticMoving = true;
//controls.dynamicDampingFactor = 0.3;

getModel('../models/f-16.gltf', 'f16');
update();

function getModel(modelFilePath, name){
  return new Promise((resolve, reject) => {
    loader.load(
      modelFilePath,
      async function(gltf){
        if(name === "porsche"){
          currModel = gltf.scene;
          currModel.scale.set(4,4,4);
          currModel.position.set(0, 0, -5);
          currModel.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI*.8);
          processMesh(currModel);
                    
          const carBody = gltf.scene.children.filter((obj) => obj.name === "porsche")[0];
          currModelTextureMesh = carBody;
                    
          const texture = carBody.material.map.image;
          const canvas = document.getElementById('liveryCanvas');
          canvas.width = texture.width;
          canvas.height = texture.height;
                    
          // make sure to explicitly set size of the canvas container
          canvas.parentNode.style.width = texture.width + "px";
          canvas.parentNode.style.height = texture.height + "px";
                    
          canvas.getContext('2d').drawImage(texture, 0, 0);
        }else{
          gltf.scene.traverse((child) => {
            if(child.type === "Mesh"){
              // get the embedded texture and display in canvas
              const texture = child.material.map.image;
              const canvas = document.getElementById('liveryCanvas');
              canvas.width = texture.width;
              canvas.height = texture.height;
              canvas.parentNode.style.width = texture.width + "px";
              canvas.parentNode.style.height = texture.height + "px";
              canvas.getContext('2d').drawImage(texture, 0, 0);
                            
              const material = child.material;
              const geometry = child.geometry;
              const obj = new THREE.Mesh(geometry, material);            
              obj.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI/4);
              obj.name = name;
                            
              obj.position.set(0, 0, 0);
                            
              currModel = obj;
              currModelTextureMesh = obj;
              processMesh(obj);
            }
          });
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

function processMesh(mesh){
  // the local axis of the imported mesh is a bit weird and not consistent with the world axis. so, to fix that,
  // put it in a group object and just control the group object! the mesh is also just oriented properly initially when placed in the group.
  const playerAxesHelper = new THREE.AxesHelper(10);
  mesh.add(playerAxesHelper);
    
  scene.add(mesh);
  update();
  renderer.render(scene, camera);
}

function update(){
  requestAnimationFrame(update);
  controls.update();
  renderer.render(scene, camera);
}

// model selection
document.getElementById('selectModel').addEventListener('change', (evt) => {
  //console.log(evt.target.value);
  scene.remove(scene.getObjectByName(currModel.name));
  getModel(`../models/${evt.target.value}.gltf`, evt.target.value);
});


// some filter stuff for the canvas
function invertColor(pixels){
  const d = pixels.data;
  let r, g, b;
  for(let i = 0; i < d.length; i += 4){
    r = d[i];
    g = d[i + 1];
    b = d[i + 2];
    d[i] = 255 - r;
    d[i + 1] = 255 - g;
    d[i + 2] = 255 - b;
  }
  return pixels;
}
document.getElementById('invertColor').addEventListener('click', (evt) => {
  const canvas = document.getElementById('liveryCanvas');
  const ctx = canvas.getContext('2d');
  const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const inverted = invertColor(pixelData);
  ctx.putImageData(inverted, 0, 0);
});

function mosaicFilter(pixels){
  const d = pixels.data;
  const copy = new Uint8ClampedArray(d);
    
  // get dimensions 
  const width = pixels.width;
  const height = pixels.height;
    
  // change sampling size here. lower for higher detail preservation, higher for less detail (because larger chunks)
  const chunkWidth = 10;
  const chunkHeight = 10;

  for(let i = 0; i < width; i += chunkWidth){
    for(let j = 0; j < height; j += chunkHeight){
      // multiply by width because all the image data is in a single array and a row is dependent on width
      const r = copy[4 * i + 4 * j * width];
      const g = copy[4 * i + 4 * j * width + 1];
      const b = copy[4 * i + 4 * j * width + 2];
      // now for all the other pixels in this chunk, set them to this color 
      for(let k = i; k < i + chunkWidth; k++){
        for(let l = j; l < j + chunkHeight; l++){
          d[4 * k + 4 * l * width] = r;
          d[4 * k + 4 * l * width + 1] = g;
          d[4 * k + 4 * l * width + 2] = b;
        }
      }
    }
  }
    
  return pixels;
}
document.getElementById('mosaic').addEventListener('click', (evt) => {
  const canvas = document.getElementById('liveryCanvas');
  const ctx = canvas.getContext('2d');
  const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const mosaic = mosaicFilter(pixelData);
  ctx.putImageData(mosaic, 0, 0);
});

function importTexture(){
  fileHandler();
    
  // define fileHandler 
  function fileHandler(){
    //initiate file choosing after button click
    const input = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', getFile, false);
    input.click();
  }
    
  function getFile(e){
    const img = new Image();
    const reader = new FileReader();
    const file = e.target.files[0];
    if(!file.type.match(/image.*/)){
      console.log("not a valid image");
      return;
    }
    img.onload = () => {
      const canvas = document.getElementById("liveryCanvas");
      const context = canvas.getContext("2d");
      const height = canvas.height;
      const width = canvas.width;
      context.drawImage(img, 0, 0, width, height);
    };
    //after reader has loaded file, put the data in the image object.
    reader.onloadend = function(){ 
      img.src = reader.result;
    };
    //read the file as a URL
    reader.readAsDataURL(file);
  }
}
document.getElementById("importTexture").addEventListener('click', () => {
  importTexture();
});

function exportTexture(){
  const canvas = document.getElementById("liveryCanvas");
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
        
    const name = prompt("please enter a name for the file");
    if(name === null) {
      return;
    }else{
      link.download = name;
      //simulate a click on the blob's url to download it 
      link.click();
    }
  });
}
document.getElementById("exportTexture").addEventListener('click', () => {
  exportTexture();
});


function updateModel(){
  // get image from canvas
  const imageUrl = document.getElementById('liveryCanvas').toDataURL();
    
  // create new texture from it
  const newTexture = textureLoader.load(imageUrl);
    
  // update model with new texture
  const oldTexture = currModelTextureMesh.material.map;

  newTexture.flipY = false;
  currModelTextureMesh.material.map = newTexture;
}
document.getElementById('updateModel').addEventListener('click', (evt) => {
  updateModel();
});

// canvas drawing stuff
let clickX = [];
let clickY = [];
let clickDrag = [];
let clickColor = [];
let clickSize = [];
let isDrawing = false;

function brushStart(evt){
  evt.preventDefault();
  if(evt.which === 1){
    isDrawing = true;
    addClick(evt, true);
    stroke();
  }
}

function brushMove(evt){
  evt.preventDefault();
  if(isDrawing){
    addClick(evt, true);
    stroke();
  }
}

function brushStop(){
  clearClick();
  isDrawing = false;
}

function addClick(ptrEvt, dragging){
  const size = 3;
  const color = document.getElementById('colorInput').value; //'rgba(0,0,0,255)';
  const x = ptrEvt.offsetX;
  const y = ptrEvt.offsetY;
  clickX.push(x);
  clickY.push(y);
  clickColor.push(color);
  clickSize.push(size);
  clickDrag.push(true);
}

function stroke(){
  const ctx = document.getElementById('liveryCanvas').getContext('2d');
  for(let i = 0; i < clickX.length; i++){        
    ctx.lineJoin = 'round';
    ctx.lineWidth = clickSize[i];
    ctx.strokeStyle = clickColor[i];
    ctx.beginPath();
        
    if(clickDrag[i] && i){
      ctx.moveTo(clickX[i-1], clickY[i-1]);
    }else{
      // single dot
      ctx.moveTo(clickX[i], clickY[i]+1);
    }
        
    ctx.lineTo(clickX[i], clickY[i]);
    ctx.closePath();
    ctx.stroke();
  }
}

function clearClick(){
  clickX = [];
  clickY = [];
  clickDrag = [];
  clickColor = [];
  clickSize = [];
}

const canvas = document.getElementById('liveryCanvas');
canvas.addEventListener('pointerdown', brushStart);
canvas.addEventListener('pointerup', brushStop);
canvas.addEventListener('pointermove', brushMove);
canvas.addEventListener('pointerleave', brushStop);

document.getElementById('colorInput').addEventListener('change', (evt) => {
  evt.target.style.border = '3px solid ' + evt.target.value;
});
