// playing with curves
import { Flow } from '../libs/CurveModifier.js';

function getModel(modelFilePath){
    return new Promise((resolve, reject) => {
        loader.load(
            modelFilePath,
            function(gltf){
                gltf.scene.traverse((child) => {
                    if(child.type === "Mesh"){
                        resolve(child);
                    }
                });    
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

function generateHelixCurvePoints(numPoints, radius, separationConstant){
    const points = [];
    
    const angleSlice = (2*Math.PI)/numPoints; // in radians
    
    let currAngle = 0;
    for(let i = 0; i < numPoints; i++){
        // note we're assuming the z axis in/out of the page and x and y form a vertical plane relative to the camera
        const y = radius * Math.cos(currAngle);
        const z = radius * Math.sin(currAngle);
        const x = separationConstant * currAngle;
        
        points.push(new THREE.Vector3(x, y, z));
        
        currAngle += angleSlice;
    }
    
    return points;
}

function setupCurveAndGetLine(curve, closed=false){
    curve.closed = closed;

    const points = curve.getPoints(60);
    const line = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({color: 0xffff00, /*opacity: 0, transparent: true*/})
    );
    
    return line;
    //scene.add(line);
}

const container = document.getElementById("container");
//const keyboard = new THREEx.KeyboardState();

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 4, 10);

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
spotLight.position.set(0, 70, -8);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(2, 10, 2);
pointLight.castShadow = true;
scene.add(pointLight);

//const hemiLight = new THREE.HemisphereLight(0xffffff);
//hemiLight.position.set(0, 10, 0);
//scene.add(hemiLight);

const clock = new THREE.Clock();

// add a plane and a sphere
const planeGeometry = new THREE.PlaneGeometry(25, 25);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0x055C9D});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = true;
//scene.add(plane);

const sphereGeometry = new THREE.SphereGeometry(0.9, 32, 16);
const sphereMaterial = new THREE.MeshPhongMaterial();
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.receiveShadow = true;
sphere.castShadow = true;
sphere.position.x = 0;
sphere.position.y = 4;
sphere.position.z = 0;
//scene.add(sphere);


// add a curve
const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(5, 3, -8),
    new THREE.Vector3(5, 4.2, 4),
    new THREE.Vector3(-5, 3, 4),
    new THREE.Vector3(-5, 4.4, -8)
]);

// more curves
let helix = generateHelixCurvePoints(50, 2, 3);
helix = helix.map((v) => {
    //console.log(v.x);
    v.x -= 9.3;
    v.y += 0.8;
    v.z -= 1.5;
    return v;
});
const barrelRollCurve = new THREE.CatmullRomCurve3(helix);

/*
new THREE.CatmullRomCurve3([
    new THREE.Vector3(11, 0, -3),
    new THREE.Vector3(8, 3, -5),
    new THREE.Vector3(3, 5, -2),
    new THREE.Vector3(1, 3, 0),
    new THREE.Vector3(-1, 0, -2),
    new THREE.Vector3(-3, 3, -6),
    new THREE.Vector3(-5, 5, -2),
    new THREE.Vector3(-7, 3, 0),
    new THREE.Vector3(-9, 0, -2),
]);
*/

const curveOptions = [
    {
        curve,
        line: setupCurveAndGetLine(curve, true),
    },
    {
        curve: barrelRollCurve,
        line: setupCurveAndGetLine(barrelRollCurve),
    }
];

let currCurve = curveOptions[1].curve;
scene.add(curveOptions[1].line);


let flow = null;
let model = null;
let t = 0;
let pause = false;

// add the object that will follow the curve
getModel("f5tiger.gltf").then((modelData) => {
    //console.log(modelData);
    modelData.scale.x *= 1;
    modelData.scale.y *= 1;
    modelData.scale.z *= 1;
    
    const modelAxesHelper = new THREE.AxesHelper(10);
    modelData.add(modelAxesHelper);
    model = modelData;
    scene.add(model);
    
    // currently just setting up the curve and using it solely to get some
    // positioning and rotation info, which I then apply manually to the model
    // I want to move seems to work well.
    //
    // passing the model to Flow() doesn't seem to get the model to move along the curve :/
    // something to investigate later?
    //flow = new Flow();
    //flow.updateCurve(0, curve);
    //scene.add(flow.object3D);
});

/*
flow = new Flow(sphere);
flow.updateCurve(0, curve);
scene.add(flow.object3D);
*/

function update(){
    if(pause) return;
    
    //if(flow) flow.moveAlongCurve(0.003);
    
    if(model){
        t += 0.003;
        
        if(t > 1) t = 0;
        
        // move the model to the next position
        model.position.copy(currCurve.getPoint(t));
        
        // rotate the model based on tangent to curve
        const tangent = currCurve.getTangent(t);
        model.quaternion.setFromUnitVectors(new THREE.Vector3(-1, 0, 0), tangent);
        
        // TODO:
        // what if we want rotation but tangent doesn't change?
        // probably need to interpolate rotation based on distance from start to end points
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


function animate(){
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

document.getElementById('pause').addEventListener('click', (evt) => {
    if(!pause){
        evt.target.textContent = 'resume';
    }else{
        evt.target.textContent = 'pause';
    }
    pause = !pause;
});

animate();
