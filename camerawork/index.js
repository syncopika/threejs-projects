class Path {
  constructor(start, end, linkMesh, target=null){
    this.start = start; // a threejs mesh object
    this.end = end; // a threejs mesh object
        
    this.linkMesh = linkMesh; // a threejs line mesh object
        
    // other parameters to describe the path
    this.duration = 5; // the seconds it takes to traverse the path. for now make it 5 secs.
        
    // the object to look at while the camera moves along this path
    this.target = target;
  }
}

class MarkerManager {
  constructor(scene, camera){
    this.scene = scene; // threejs scene
    this.camera = camera; // the camera the user will use to move around with
    this.paths = []; // list of Path objects
    this.selectedMarkers = [];
    this.mode = "add"; // 'add' or 'select'
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
        
    // for path movement
    this.startPos = null;
    this.startTime = 0;
    this.currPathIndex = 0;
    this.reqAnimFrameId = 0;
  }
    
  changeMode(){
    this.mode = (this.mode === "add" ? "select" : "add");
  }

  // add a new marker to the path
  // marker should be a mesh or Object3D
  // x and y are 2d-to-3d converted coord values
  addMarker(marker, x, y){
    // add marker to camera in order to be able to add the cube
    // to the scene in the proper position relative to the camera
    this.camera.add(marker);
        
    // copy camera rotation
    marker.rotation.copy(this.camera.rotation);
        
    // translate cube in camera object space
    const cubePos = new THREE.Vector3(10*x, 10*y, -10);
    marker.position.set(cubePos.x, cubePos.y, cubePos.z);
        
    // move it to world space
    const cubePosWorld = new THREE.Vector3();
    marker.getWorldPosition(cubePosWorld);
    marker.position.set(cubePosWorld.x, cubePosWorld.y, cubePosWorld.z);
        
    // make scene the parent of the cube
    this.scene.add(marker);
  }
    
  removeMarkers(markersToRemove){
    // not great for scaling to a large number of markers and paths
    // but for now let's check against each existing path for each marker to remove
    for(const marker of markersToRemove){
      // remove from paths any path that contains this marker
      const pathsToKeep = [];
      for(const path of this.paths){
        if(path.start.uuid !== marker.uuid && path.end.uuid !== marker.uuid){
          pathsToKeep.push(path);
        }else{
          this.scene.remove(path.linkMesh);
        }
      }
      this.paths = pathsToKeep;
            
      this.camera.remove(marker);
      this.scene.remove(marker);
    }
        
    // also remove markers from currently selected markers
    // markersToRemove is a ref to this.selectedMarkers
    // so we make a copy so we don't iterate and alter the same list
    const markersToRemoveCopy = markersToRemove.slice();
    markersToRemoveCopy.forEach(marker => {
      this.removeSelectedMarker(marker);
    });
  }
    
  addToSelectedMarkers(markerToAdd){
    // this is a reference to the marker mesh object
    this.selectedMarkers.push(markerToAdd);
  }
    
  removeSelectedMarker(markerToRemove){
    // this is a reference to the marker mesh object
    this.selectedMarkers = this.selectedMarkers.filter((marker) => {
      return marker.uuid !== markerToRemove.uuid;
    });
  }
    
  connectMarkers(markerList, target=null){
    // what if we want a path with just 1 marker? i.e. for a static camera scene
    if(markerList.length === 1){
      // TODO: create some kinda path marker for it? like a sphere hovering over the marker maybe?
      this.createPath(markerList[0], markerList[0], null, target);
    }else{
      // draw lines between the markers in the list (based on order in the list)
      const lineMaterial = new THREE.LineBasicMaterial({color: 0x0000ff});
      const startPos = new THREE.Vector3();
      const endPos = new THREE.Vector3();
      for(let i = 0; i < markerList.length - 1; i++){
        const start = markerList[i];
        const end = markerList[i+1];
                
        start.getWorldPosition(startPos);
        end.getWorldPosition(endPos);
                
        const linePts = [startPos, endPos];
        const tubeGeo = new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(linePts),
          512, // path segments
          0.2, // thickness
          8, // roundness
          false, // closed
        );
                
        const tube = new THREE.BufferGeometry().fromGeometry(tubeGeo);
        const line = new THREE.Line(tube, lineMaterial);
        scene.add(line);
                
        // add to list of paths
        this.createPath(start, end, line, target);
      }
    }
        
    // make sure markers are deselected
    markerList.forEach((marker) => {
      marker.material.color.setHex(0x00ff00);
    });
        
    this.selectedMarkers = [];
  }
    
  // x and y are 3d converted coordinates to 2d based on mouse location
  selectMarker(x, y){
    this.mouse.x = x;
    this.mouse.y = y;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    for(let i = 0; i < intersects.length; i++){
      if(intersects[i].object.objectType && intersects[i].object.objectType === "marker"){
        return intersects[i];
      }
    }
    return null;
  }
    
  createMarker(){
    const geo = new THREE.BoxGeometry(2,2,2);
    const mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
    const cube = new THREE.Mesh(geo, mat);
    cube.objectType = "marker";
    return cube;
  }
    
  focusOnTarget(target){
    const targetPosWorld = new THREE.Vector3();
    target.getWorldPosition(targetPosWorld);
    this.camera.lookAt(targetPosWorld);
  }
    
  // https://stackoverflow.com/questions/42309715/how-to-correctly-pass-mouse-coordinates-to-webgl
  getCoordsOnMouseClick(event){
    const target = event.target;
    const x1 = event.clientX - target.getBoundingClientRect().left;// + target.offsetWidth/2;
    const y1 = event.clientY - target.getBoundingClientRect().top;// + target.offsetHeight/2;
    const posX = (x1 * target.width) / target.clientWidth;
    const posY = (y1 * target.height) / target.clientHeight;

    const gl = target.getContext("webgl2"); // might be webgl in other browsers (not chrome)?
    const x = (posX / gl.canvas.width) * 2 - 1;
    const y = (posY / gl.canvas.height) * -2 + 1;
        
    return {x, y};
  }

  toggleMarkers(){
    // make a set containing all markers and then toggle visibility
    const markerSet = new Set();
    for(const path of this.paths){
      if(path.start){
        markerSet.add(path.start);
      }
      if(path.end){
        markerSet.add(path.end);
      }
    }
    for(const marker of markerSet){
      marker.visible = !marker.visible;
    }
  }

  togglePaths(){
    for(const path of this.paths){
      if(path.linkMesh){
        path.linkMesh.visible = !path.linkMesh.visible;
      }
    }
  }
    
  // markerStart and markerEnd should be threejs Mesh objects
  createPath(markerStart, markerEnd, linkMesh, target=null){
    const path = new Path(markerStart, markerEnd, linkMesh, target);
    this.paths.push(path);
  }
    
  removePath(startMarker, endMarker){
    // go through existing paths in this.paths
    // find the one that has the matching start and end markers
    // remove the path link/linkMesh (set to null?)
  }
    
  // ride() will be passed to requestAnimationFrame(), which will
  // pass a timestamp to ride()
  ride(timestamp){
    if(this.startTime === 0){
      this.startTime = timestamp;
    }
        
    // get the current path we're supposed to be on
    const currPath = this.paths[this.currPathIndex];
    const isStatic = (currPath.linkMesh === null);
        
    const elapsedTime = timestamp - this.startTime;
    const expectedDurationInMs = currPath.duration * 1000;
        
    // are we where we should be?
    // use the ratio of the current time elapsed and the expected duration,
    // the next marker's position and lerp to figure out the position we should be at
    if(isStatic){
      const start = currPath.start.position.clone();
      this.camera.position.copy(start); // move the camera to the start marker of this path since there is no link path to travel on
    }else{
      const lerpAlpha = elapsedTime / expectedDurationInMs;
            
      // use the start position of the start marker of the current path and lerp on that
      // we clone it each time so we don't overwrite its position (if we keep lerp'ing on a position that keeps changing,
      // the movement will be faster than we want it to be)
      this.camera.position.copy(this.startPos.clone().lerp(currPath.end.position, lerpAlpha));
    }
        
    // make sure we're looking in the right direction!
    // e.g. if we have a specific target, look at that target. otherwise,
    // look towards the next marker
    const target = currPath.target;
    if(target){
      this.focusOnTarget(target);
    }else{
      this.focusOnTarget(currPath.end);
    }
        
    if(elapsedTime >= expectedDurationInMs){
      // time to move on to the next path
      this.currPathIndex++;
      this.startTime = 0;
    }
        
    if(this.currPathIndex === this.paths.length){
      // we're done with traversing the path
      // reset stuff
      console.log("we're done");
      this.currPathIndex = 0;
      this.startPos = null;
      cancelAnimationFrame(this.reqAnimFrameId);
    }else{
      this.startPos = this.paths[this.currPathIndex].start.position.clone();
      this.reqAnimFrameId = requestAnimationFrame(this.ride.bind(this));
    }
  }
    
  ridePath(){
    if(this.paths.length === 0){
      return;
    }
        
    // move the camera to the first marker first
    if(this.paths[0]){
      const firstPos = this.paths[0].start.position;
      this.camera.position.copy(firstPos);
      this.startPos = firstPos.clone();
    }
        
    this.reqAnimFrameId = requestAnimationFrame(this.ride.bind(this));
  }
}

class UIManager {
  constructor(){}

  // update UI with new changes
  // i.e. for customizing path properties, markers, etc.
  updateUI(){}
}

function setupSceneLights(scene){
  const hemiLight = new THREE.HemisphereLight(0xffffff);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);
}

function setupTerrain(scene){
  const texture = new THREE.TextureLoader().load('../models/grass2.jpg');
  const terrainMat = new THREE.MeshBasicMaterial({map: texture});
  const terrain = new THREE.PlaneGeometry(200, 200, 1);
  const plane = new THREE.Mesh(terrain, terrainMat);
  plane.position.set(0, -1, 0);
  plane.rotateX((3*Math.PI)/2);
  scene.add(plane);
}

function setupDemoMesh(scene){
  const cubeGeometry = new THREE.BoxGeometry(5,5,5);
  const material = new THREE.MeshBasicMaterial({color: 0x0000ff});
  material.wireframe = true;
  const mainTarget = new THREE.Mesh(cubeGeometry, material);

  const cube2g = new THREE.BoxGeometry(2,2,2);
  const mat = new THREE.MeshBasicMaterial({color: 0xff0000});
  const cube = new THREE.Mesh(cube2g, mat);

  mainTarget.add(cube);
  cube.position.set(0, 3, 0);

  mainTarget.position.set(0, 2, 0);
  scene.add(mainTarget);
    
  // add a moving ball to the mesh
  const sphereGeom = new THREE.SphereGeometry(3, 64, 64);
  const texture = new THREE.TextureLoader().load('texture.png');
  const sphereMat = new THREE.MeshBasicMaterial({map: texture});
  const sphere = new THREE.Mesh(sphereGeom, sphereMat);
  mainTarget.add(sphere);
  sphere.position.set(0, 10, 0);
  sphere.rotateY(-Math.PI/4);
  mainTarget.movingSphere = sphere;
    
  const targetAxesHelper = new THREE.AxesHelper(5);
  mainTarget.add(targetAxesHelper);
  return mainTarget;
}


//////////////////////////////////////////////////////// start
let addMarker = true;
let selectMarker = false;

const container = document.getElementById("container");
const fov = 60;

const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0,5,15);

const keyboard = new THREEx.KeyboardState();
const raycaster = new THREE.Raycaster();
const loadingManager = new THREE.LoadingManager();
const loader = new THREE.GLTFLoader(loadingManager);

// set up mobile keyboard
document.getElementById('showKeyboard').addEventListener('click', () => {
  new JSKeyboard(document.getElementById('mobileKeyboard'));
});

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);    
scene.add(camera);

setupSceneLights(scene);
setupTerrain(scene);

const targetObj = setupDemoMesh(scene);

const clock = new THREE.Clock();
let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;

const markerManager = new MarkerManager(scene, camera);
const radius = 5;
let t = 0;

renderer.domElement.addEventListener("click", (evt) => {
  const coords = markerManager.getCoordsOnMouseClick(evt);
  if(markerManager.mode === "add"){
    const cube = markerManager.createMarker();
    markerManager.addMarker(cube, coords.x, coords.y);
  }else{
    const selectedMarker = markerManager.selectMarker(coords.x, coords.y);
    if(selectedMarker){
      if(selectedMarker.object.material.color.g === 1){
        // select 
        selectedMarker.object.material.color.setHex(0xff0000);
        markerManager.addToSelectedMarkers(selectedMarker.object);
      }else{
        // deselect
        selectedMarker.object.material.color.setHex(0x00ff00);
        markerManager.removeSelectedMarker(selectedMarker.object);
      }
    }
  }
});

document.getElementById('addMarker').addEventListener('click', (evt) => {
  addMarker = true;
  selectMarker = false;
  evt.target.style.border = "3px solid green";
  document.getElementById('selectMarker').style.border = "none";
  markerManager.changeMode();
});

document.getElementById('removeMarker').addEventListener('click', (evt) => {
  if(selectMarker){
    markerManager.removeMarkers(markerManager.selectedMarkers);
  }
});

document.getElementById('selectMarker').addEventListener('click', (evt) => {
  selectMarker = true;
  addMarker = false;
  evt.target.style.border = "3px solid green";
  document.getElementById('addMarker').style.border = "none";
  markerManager.changeMode();
});

document.getElementById('createPath').addEventListener('click', (evt) => {
  if(markerManager.mode === "select"){
    // take all selected markers and create a path between them in the order they are in
    //console.log(targetObj);
    markerManager.connectMarkers(markerManager.selectedMarkers, targetObj);
  }
});

document.getElementById('ridePath').addEventListener('click', (evt) => {
  markerManager.ridePath();
});

document.getElementById('toggleMarkerVisibility').addEventListener('click', (evt) => {
  markerManager.toggleMarkers();
});

document.getElementById('togglePathVisibility').addEventListener('click', (evt) => {
  markerManager.togglePaths();
});

document.getElementById('setTarget').addEventListener('click', (evt) => {
  if(evt.target.textContent.trim() === "unset target"){
    markerManager.paths.forEach((path) => {
      path.target = null;
    });
    evt.target.textContent = "set target";
  }else{
    markerManager.paths.forEach((path) => {
      path.target = targetObj;
    });
    evt.target.textContent = "unset target";
  }
});

function update(){
  sec = clock.getDelta();
  moveDistance = 8 * sec;
  rotationAngle = (Math.PI / 2) * sec;
  t += 0.008;
    
  const changeCameraView = false;
    
  if(keyboard.pressed("W")){
    // moving forwards
    camera.translateZ(-moveDistance);
        
  }else if(keyboard.pressed("S")){
    // moving backwards
    camera.translateZ(moveDistance);
  }
    
  if(keyboard.pressed("up")){
    // up arrow (rotate x)
    // need to prevent default (i.e. scrolling)
    // clamp also?
    camera.rotateX(rotationAngle);
  }
    
  if(keyboard.pressed("down")){
    camera.rotateX(-rotationAngle);
  }
    
  if(keyboard.pressed("A")){
    camera.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationAngle);
  }
    
  if(keyboard.pressed("D")){
    camera.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotationAngle);
  }
    
  if(keyboard.pressed("Q")){
    camera.rotateOnAxis(new THREE.Vector3(0, 0, 1), rotationAngle);
  }
    
  if(keyboard.pressed("E")){
    camera.rotateOnAxis(new THREE.Vector3(0, 0, 1), -rotationAngle);
  }
    
  // move the targetObj's sphere in a circle
  targetObj.movingSphere.position.set(
    Math.cos(t)*radius,
    targetObj.movingSphere.position.y,
    Math.sin(t)*radius
  );
  targetObj.movingSphere.rotateY(rotationAngle);
}

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  update();
}
animate();