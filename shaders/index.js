let currModel = null;
let currModelTexture = null;
let animationReqId;

const loader = new THREE.GLTFLoader();
const textureLoader = new THREE.TextureLoader();

const container = document.getElementById("container");
const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);    

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);
container.style.border = '1px solid #000';

camera.position.set(0, 10, 18);
const cameraZPos = camera.position.z;
//camera.rotateOnAxis(new THREE.Vector3(1,0,0), -Math.PI/8);
scene.add(camera);

// https://discourse.threejs.org/t/solved-glb-model-is-very-dark/6258
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
hemiLight.position.set(0, 200, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set(0, 50, 0);
scene.add(dirLight);

// set up trackball control
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 1.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;

getModel('../models/f-16.gltf', 'f-16');

function getModel(modelFilePath, name){
  return new Promise((resolve, reject) => {
    loader.load(
      modelFilePath,
      function(gltf){
        gltf.scene.traverse((child) => {
          if(child.type === "Mesh"){    
            const material = child.material;
            const geometry = child.geometry;
            const obj = new THREE.Mesh(geometry, material);            
            obj.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI/4);
            obj.name = name;
                        
            if(name === "whale-shark-camo"){
              obj.scale.set(1.8, 1.8, 1.8);
              obj.position.set(5, 0, 0);
              obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/2);
            }else{
              obj.position.set(0, 0, 0);
            }
                        
            currModel = obj;
            currModelTexture = obj.material.map ? obj.material.map.image : null;
                        
            if(name === "whale-shark-camo"){
              updateWhaleShark();
            }else if(name === "f-18"){
              updateJetModel2();
            }else if(name === "f-16"){
              updateJetModel();
            }            
                        
            processMesh(obj);
            resolve(true);
          }
        });
      },
      // called while loading is progressing
      function(xhr){
        //console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
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
  //let playerAxesHelper = new THREE.AxesHelper(10);
  //mesh.add(playerAxesHelper);
  scene.add(mesh);
  update();
  renderer.render(scene, camera);
}

function update(){
  animationReqId = requestAnimationFrame(update);
  controls.update();
    
  // update time uniform variable
  if(currModel && currModel.material.uniforms && currModel.material.uniforms.u_time){
    currModel.material.uniforms.u_time.value += 0.01;
    //currModel.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.01);
  }
    
  renderer.render(scene, camera);
}

// model selection
document.getElementById('selectModel').addEventListener('change', async (evt) => {
    
  if(animationReqId){
    cancelAnimationFrame(animationReqId);
  }
    
  scene.remove(scene.getObjectByName(currModel.name));
    
  currModel = null;
  currModelTexture = null;
    
  if(["whale-shark-camo", "f-18"].indexOf(evt.target.value) > -1){
    await getModel(`../models/${evt.target.value}.glb`, evt.target.value);
    camera.position.z = cameraZPos;
  }else if(evt.target.value === "scene1"){
    // this one changes the camera's z-position a bit
    currModel = createSceneSquares();
    processMesh(currModel);
  }else if(evt.target.value === "scene2"){
    currModel = createRaymarchShader();
    processMesh(currModel);
    camera.position.z = cameraZPos;
  }else if(evt.target.value === "ripple"){
    currModel = updateRipple();
    processMesh(currModel);
    currModel.rotation.x = -Math.PI / 2;
    camera.position.z = cameraZPos;
  }else if(evt.target.value === "toon"){
    await getModel('../models/f-16.gltf', 'f-16');
    createToonShader();
  }else{
    await getModel(`../models/${evt.target.value}.gltf`, evt.target.value);
    camera.position.z = cameraZPos;
  }
});

function getTextureImageUrl(imgElement){
  const canvas = document.createElement('canvas');
  canvas.width = imgElement.width;
  canvas.height = imgElement.height;
  canvas.getContext('2d').drawImage(imgElement, 0, 0);
  return canvas.toDataURL();
}

function showShaderCode(vertexCode, fragCode, container){
  // clear container
  // https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
  const vh = document.createElement('h2');
  vh.textContent = "vertex shader: ";
  const v = document.createElement('pre');
  v.textContent = vertexCode;

  const br = document.createElement('br');

  const fh = document.createElement('h2');
  fh.textContent = "fragment shader: ";
  const f = document.createElement('pre');
  f.textContent = fragCode;
    
  container.replaceChildren(vh, v, br, fh, f);
}


function updateJetModel(){
  const vertexShader = jetModelShader.vertexShader;
  const fragShader = jetModelShader.fragShader;
  showShaderCode(vertexShader, fragShader, document.getElementById('shader'));
    
  const uniforms = {
    u_time: {type: "f", value: 0.0},
    u_resolution: {type: "vec2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height)},
  };
    
  if(currModelTexture){
    const textureUrl = getTextureImageUrl(currModelTexture);
    const texture = textureLoader.load(textureUrl);
    texture.flipY = false; // this part is important!
    uniforms.img = {type: "t", value: texture};
  }
    
  const newShaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragShader,
  });
    
  currModel.material = newShaderMaterial;
}


function randomRange(min, max){
  return Math.random() * (max - min) + min;
}

// make a bunch of squares with shaders
function createSceneSquares(){
  const numSquares = 200;
  const vertexCount = numSquares * 4;
    
  const geometry = new THREE.BufferGeometry();
    
  const positions = [];
  const colors = [];
  const indices = [];
    
  camera.rotateOnAxis(new THREE.Vector3(1,0,0), -Math.PI/3);
  camera.position.z += 50;
    
  const zRange = {'min': camera.position.z-180, 'max': 20}; // range for z position of squares
  const xRange = {'min': -120, 'max': 120};
  const yRange = {'min': -120, 'max': 120};
  const squareWidth = 5;
  const squareHeight = 5;
    
  for(let i = 0; i <= vertexCount - 4; i+= 4){
    // this is one of the vertices of a square
    const x1 = randomRange(xRange.min, xRange.max);
    const y1 = randomRange(yRange.min, yRange.max);
    const z1 = randomRange(zRange.min, zRange.max);
        
    // top-left vertex
    positions.push(x1);
    positions.push(y1);
    positions.push(z1);
    colors.push(Math.random()*255); //r
    colors.push(Math.random()*255); //g
    colors.push(Math.random()*255); //g
    colors.push(200); //a - make each square slightly transparent
        
    // since each square has 4 vertices, create the others here
    // top-right vertex
    positions.push(x1+squareWidth);
    positions.push(y1);
    positions.push(z1);
    colors.push(Math.random()*255);
    colors.push(Math.random()*255);
    colors.push(Math.random()*255);
    colors.push(200);
        
    // bottom-left vertex
    positions.push(x1);
    positions.push(y1-squareHeight);
    positions.push(z1);
    colors.push(Math.random()*255);
    colors.push(Math.random()*255);
    colors.push(Math.random()*255);
    colors.push(200);
        
    // bottom-right vertex
    positions.push(x1+squareWidth);
    positions.push(y1-squareHeight);
    positions.push(z1);
    colors.push(Math.random()*255);
    colors.push(Math.random()*255);
    colors.push(Math.random()*255);
    colors.push(200);
        
    // since we're making squares, we need 2 triangles. 
    // specify what vertices make up which triangles in the indices array
    // first triangle
    indices.push(i+2);
    indices.push(i+3);
    indices.push(i+1);
        
    // second triangle
    indices.push(i+1);
    indices.push(i);
    indices.push(i+2);
  }
    
  const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
  const colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
  colorAttribute.normalized = true; // normalize color values so the fall in range 0 to 1.
    
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('color', colorAttribute);
  geometry.setIndex(indices);
    
  const vertexShader = springyShardShader.vertexShader;
  const fragShader = springyShardShader.fragShader;
  showShaderCode(vertexShader, fragShader, document.getElementById('shader'));
    
  const uniforms = {
    u_time: {type: "f", value: 0.0},
    u_resolution: {type: "vec2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height)},
  };
    
  const newShaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragShader,
    side: THREE.DoubleSide,
    transparent: true,
  });
    
  const mesh = new THREE.Mesh(geometry, newShaderMaterial);
  mesh.name = "squareScene";
    
  return mesh;
}

function createRaymarchShader(){
  // fragment shader only
  const geometry = new THREE.PlaneGeometry(200, 100);
    
  const vertexShader = raymarchShader.vertexShader;
  const fragShader = raymarchShader.fragShader;
  showShaderCode(vertexShader, fragShader, document.getElementById('shader'));
    
  const uniforms = {
    u_time: {type: "f", value: 0.0},
    u_resolution: {type: "vec2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height)},
  };
    
  const newShaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragShader,
    side: THREE.DoubleSide,
  });
    
  const mesh = new THREE.Mesh(geometry, newShaderMaterial);
  mesh.name = "raymarchScene";
    
  return mesh;
}

function updateJetModel2(){
  const vertexShader = jetModelShader2.vertexShader;
  const fragShader = jetModelShader2.fragShader;
  showShaderCode(vertexShader, fragShader, document.getElementById('shader'));
    
  const uniforms = {
    u_time: {type: "f", value: 0.0},
    u_resolution: {type: "vec2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height)},
    lightPosition: {value: [new THREE.Vector4(dirLight.position.x, dirLight.position.y, dirLight.position.z, 1.0)]},
    lightIntensity: {value: [new THREE.Vector4(0.8, 0.8, 0.8, 1.0)]},
    diffuseLight: {value: [new THREE.Vector3(0.15, 0.15, 0.15)]},
    specularLight: {value: [new THREE.Vector3(0.8, 0.8, 0.8)]},
    shininess: {value: 300.0},
  };
    
  if(currModelTexture){
    const textureUrl = getTextureImageUrl(currModelTexture);
    const texture = textureLoader.load(textureUrl);
    texture.flipY = false; // this part is important!
    uniforms.img = {type: "t", value: texture};
  }
    
  const newShaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragShader,
  });
    
  currModel.material = newShaderMaterial;    
}

// whale shark shader
function updateWhaleShark(){
  const vertexShader = whaleSharkShader.vertexShader;
  const fragShader = whaleSharkShader.fragShader;
  showShaderCode(vertexShader, fragShader, document.getElementById('shader'));
    
  const uniforms = {
    u_time: {type: "f", value: 0.0},
    u_resolution: {type: "vec2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height)},
  };
    
  if(currModelTexture){
    const textureUrl = getTextureImageUrl(currModelTexture);
    const texture = textureLoader.load(textureUrl);
    texture.flipY = false; // this part is important!
    uniforms.img = {type: "t", value: texture};
  }
    
  const newShaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragShader,
  });
    
  currModel.material = newShaderMaterial;
}

// ripple shader
function updateRipple(){
  const width = 50;
  const height = 50;
  const geometry = new THREE.PlaneGeometry(width, height);
    
  const vertexShader = rippleShader.vertexShader;
  const fragShader = rippleShader.fragShader;
  showShaderCode(vertexShader, fragShader, document.getElementById('shader'));
    
  const uniforms = {
    u_time: {type: "f", value: 0.0},
    u_resolution: {type: "vec2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height)},
    center: {type: "vec2", value: new THREE.Vector2(0.5, 0.5)},
    color: {type: "vec4", value: new THREE.Vector4(0.3, 0.6, 1, 0.8)},
    speed: {type: "f", value: 0.3},
    density: {type: "f", value: 50},
    strength: {type: "f", value: 2},
    brightness: {type: "f", value: 1}
  };
    
  const newShaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragShader,
    side: THREE.DoubleSide,
  });
    
  //const mat = new THREE.MeshLambertMaterial({color: '#cccddd'});
    
  const mesh = new THREE.Mesh(geometry, newShaderMaterial);
  mesh.name = "rippleScene";
    
  return mesh;
}

// toon shader
function createToonShader(){
  const vertexShader = toonShader.vertexShader;
  const fragShader = toonShader.fragShader;
  showShaderCode(vertexShader, fragShader, document.getElementById('shader'));
  
  const uniforms = {};
  if(currModelTexture){
    const textureUrl = getTextureImageUrl(currModelTexture);
    const texture = textureLoader.load(textureUrl);
    texture.flipY = false; // this part is important!
    uniforms.img = {type: "t", value: texture};
  }
    
  const newShaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragShader,
    side: THREE.DoubleSide,
  });
  
  currModel.material = newShaderMaterial;
}

