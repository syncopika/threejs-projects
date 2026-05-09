// 3d QR code idea

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
scene.background = new THREE.Color(0x111111);
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

const qrCodeMesh = new THREE.Group();


const cubeGeometry = new THREE.BoxGeometry(5,5,5);
const material = new THREE.MeshBasicMaterial({color: 0x0000ff});
material.wireframe = true;
const cube = new THREE.Mesh(cubeGeometry, material);
qrCodeMesh.add(cube);

scene.add(qrCodeMesh);

document.getElementById('toggleWireframe').addEventListener('change', (evt) => {
  const wireframeOn = evt.target.checked;
  console.log(`wireframe on: ${wireframeOn}`);
  qrCodeMesh.children.forEach(c => {
    c.material.wireframe = wireframeOn;
  });
});

document.getElementById('generateCode').addEventListener('click', () => {
  const input = document.getElementById('inputText').value;
  const qrcodeCanvas = generateQRCode(input);
  
  // traverse the pixels of finalResultCtx to form the 3d QR code
  const w = qrcodeCanvas.width;
  const h = qrcodeCanvas.height;
  
  // clear threejs group object
  for(const child of qrCodeMesh.children){
    qrCodeMesh.remove(child);
  }
  
  const cubeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  
  const selectedColor = document.getElementById('colorPicker').value;
  const material = new THREE.MeshBasicMaterial({color: selectedColor});
  
  const cube = new THREE.Mesh(cubeGeometry, material);
  
  console.log(`qr code width: ${w}, height: ${h}`);
  
  let currY = -30; // y-coord for 3d qr code cube
  const pixels = qrcodeCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  for(let row = 0; row < h; row++){
    let currX = -30; // x-coord for 3d qr code cube
    for(let col = 0; col < w; col++){
      const newCube = cube.clone();
      const pixelIdx = (w * row * 4) + (col * 4);
      const r = pixels[pixelIdx];
      const g = pixels[pixelIdx + 1];
      const b = pixels[pixelIdx + 2];
      
      if(r === 255 && g === 255 && b === 255){
        newCube.material = newCube.material.clone();
        newCube.material.color.set(0xffffff);
      }
      //newCube.material.wireframe = true;
      
      //console.log(`r: ${r}, g: ${g}, b: ${b}`);
      
      // place cube
      qrCodeMesh.add(newCube);
      newCube.translateX(currX);
      newCube.translateY(currY);
      
      currX++;
    }
    currY++;
  }
});

function update(){
}

function animate(){
  controls.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}

animate();