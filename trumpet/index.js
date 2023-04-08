// trumpet

const container = document.getElementById("container");

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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeff);
scene.add(camera);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 50, 35);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const valves = {1: null, 2: null, 3: null};

const noteToValveComboMap = {
    'a': '12',
    'ab': '23', // a flat
    'as': '1',  // a sharp
    'bb': '1',  // b flat
    'b': '2',
    'c': '0',  // open
    'cs': '123', // c sharp
    'd': '13', // valves 1 and 3 are down
    'ds': '23', // d sharp
    'e': '12',
    'f': '1',
    'fs': '2', // f sharp
    'g': '0',
    'gs': '23', // g sharp
};

// bit of a tricky problem. different notes within the same octave
// can have the same fingering, e.g. F and Bb are both played with the 1st valve down.
// G can be played open, but that's the same as C. alternatively you can do 1 and 3 but then
// D also shares that fingering. :/
// is it possible to create a sensible system to differentiate notes with the same fingering?
const valveToNoteComboMap = {
    '12': 'e',
    '23': 'gs',
    '1': 'f',
    '2': 'b',
    '0': 'c',
    '123': 'cs',
    '13': 'd',
    '3': 'a',
};

function setValves(note){
    const valveCombo = noteToValveComboMap[note];
    if(!valveCombo) return;
    
    const firstOpen = !valveCombo.includes('1');
    const secondOpen = !valveCombo.includes('2');
    const thirdOpen = !valveCombo.includes('3');
    
    valves[1].morphTargetInfluences[0] = firstOpen ? 0.0 : 1.0;
    valves[2].morphTargetInfluences[0] = secondOpen ? 0.0 : 1.0;
    valves[3].morphTargetInfluences[0] = thirdOpen ? 0.0 : 1.0;
}

const audioContext = new AudioContext();
audioContext.suspend();

// create and attach gain node (we can use a single gain node since there should only 1 note playing at a time)
const gainNode = new GainNode(audioContext);
gainNode.connect(audioContext.destination);

const noteBufferMap = {};
let readyToPlay = false;
function loadInNotes(){
    document.getElementById('status').textContent = "loading in notes...";
    const notesToLoad = [
        "c4",
        "cs4",
        "d4",
        "ds4",
        "e4",
        "f4",
        "fs4",
        "g4",
        "gs4",
        "a4",
        "bb4",
        "b4",
        "c5",
        "cs5",
        "d5",
        "e5",
        "f5",
        "g5",
        "gs5",
        "a5",
        "b5",
    ];
    let totalNotes = notesToLoad.length;
    notesToLoad.forEach(note => {
        const fileToFetch = "notes/" + note + '.ogg';
        const newSource = audioContext.createBufferSource();
        
        // https://developer.mozilla.org/en-US/docs/Web/API/Body/arrayBuffer
        const req = new Request(fileToFetch);
        
        fetch(req).then((res) => {
            return res.arrayBuffer();
        }).then((buffer) => {
            audioContext.decodeAudioData(buffer, (decodedData) => {
                newSource.buffer = decodedData; // newSource will be a buffer source node that will be a reference node that we'll use to create the nodes for playing the notes
                noteBufferMap[note.substring(note.indexOf('-')+1).toLowerCase()] = newSource;
                
                totalNotes--;
                if(totalNotes === 0){
                    document.getElementById('status').textContent = "";
                    readyToPlay = true;
                    
                    //console.log(noteBufferMap);
                }
            });
        });
    });
}
loadInNotes();


function play(piece){
    const startTime = audioContext.currentTime;
    let offset = 0;
    
    // TODO: maybe figure out a better way to do this? 
    // ideally i'd like to set the valves 
    // at the time a note plays but there's no start callback 
    // so use onended for now (and set valve combo for first note initially)
    // so far this seems to work well enough though :)
    setValves(piece[0].note.substring(0, piece[0].note.length-1));
    
    audioContext.resume().then(() => {
        piece.forEach((note, index) => {
            // set up buffer nodes
            const newBufNode = audioContext.createBufferSource();
            if(note.note) newBufNode.buffer = noteBufferMap[note.note].buffer;
            newBufNode.connect(gainNode);
            
            // schedule note (use seconds for start time)
            const start = startTime + offset;
            const end = start + note.length/1000;
            gainNode.gain.setTargetAtTime(1.5, start, 0.0045);
            gainNode.gain.setTargetAtTime(0.0, (end - .0025), 0.0070);
            
            newBufNode.start(start);
            newBufNode.stop(end);
            
            offset += note.length / 1000;
            
            // when setting valves, note that we don't care about octave
            if(index < piece.length - 1){
                const nextNote = piece[index+1];
                newBufNode.onended = () => {
                    setValves(nextNote.note.substring(0, nextNote.note.length-1));
                }
            }else{
                // last note so reset all valves to open when this note is finished playing
                newBufNode.onended = () => {
                    setValves('c');
                }
            }
        });
    });
}

function playExamplePiece1(){
    // TODO: make json file?
    // each object in the piece array represents a note
    // each note will be played via a new buffersource node
    const piece = [
        {
            'note': 'c4',
            'length': 500, //ms
        },
        {
            'note': 'd4',
            'length': 500,
        },
        {
            'note': 'e4',
            'length': 500,
        },
        {
            'note': 'f4',
            'length': 500,
        },
        {
            'note': 'g4',
            'length': 500,
        },
        {
            'note': 'a4',
            'length': 500,
        },
        {
            'note': 'b4',
            'length': 500,
        },
        {
            'note': 'c5',
            'length': 500,
        },
        {
            'note': 'c5',
            'length': 400,
        },
        {
            'note': 'b4',
            'length': 400,
        },
        {
            'note': 'a4',
            'length': 400,
        },
        {
            'note': 'g4',
            'length': 400,
        },
        {
            'note': 'f4',
            'length': 400,
        },
        {
            'note': 'e4',
            'length': 400,
        },
        {
            'note': 'd4',
            'length': 400,
        },
        {
            'note': 'c4',
            'length': 400,
        },
    ];
    play(piece);
}

function playExamplePiece2(){
    const piece = [
        {
            'note': 'c4',
            'length': 200, //ms
        },
        {
            'note': 'cs4',
            'length': 200,
        },
        {
            'note': 'd4',
            'length': 200,
        },
        {
            'note': 'ds4',
            'length': 200,
        },
        {
            'note': 'e4',
            'length': 300,
        },
        {
            'note': 'f4',
            'length': 400,
        },
        {
            'note': 'fs4',
            'length': 500,
        },
        {
            'note': 'g4',
            'length': 400,
        },
        {
            'note': 'gs4',
            'length': 300,
        },
        {
            'note': 'a4',
            'length': 200,
        },
        {
            'note': 'bb4',
            'length': 200,
        },
        {
            'note': 'b4',
            'length': 200,
        },
        {
            'note': 'c5',
            'length': 200,
        }
    ];
    play(piece);
}

// excerpt of 'nostalgia' by fats navarro
function playNostalgiaExcerpt(){
    const piece = [
        {
            'note': '',
            'length': 80,
        },
        {
            'note': 'cs5',
            'length': 200, //ms
        },
        {
            'note': 'e5',
            'length': 160,
        },
        {
            'note': '',
            'length': 60,
        },
        {
            'note': 'cs5',
            'length': 200,
        },
        {
            'note': 'e5',
            'length': 260,
        },
        {
            'note': 'e5',
            'length': 200,
        },
        {
            'note': '',
            'length': 120,
        },
        {
            'note': 'cs5',
            'length': 220,
        },
        {
            'note': 'e5',
            'length': 200,
        },
        {
            'note': '',
            'length': 240,
        },
        {
            'note': 'cs5',
            'length': 200,
        },
        {
            'note': 'fs4',
            'length': 460,
        },
        {
            'note': 'e4',
            'length': 200,
        },
        // triplet
        {
            'note': 'fs4',
            'length': 100,
        },
        {
            'note': 'g4',
            'length': 100,
        },
        {
            'note': 'fs4',
            'length': 100,
        },
        // end triplet
        {
            'note': 'e4',
            'length': 200,
        },
        {
            'note': 'gs4',
            'length': 480,
        },
        {
            'note': 'e4',
            'length': 250,
        },
        {
            'note': 'cs4',
            'length': 210,
        },
        {
            'note': 'gs4',
            'length': 240,
        },
        {
            'note': 'fs4',
            'length': 520,
        }
    ];
    play(piece);
}

function getModel(modelFilePath){
    return new Promise((resolve, reject) => {
        loader.load(
            modelFilePath,
            async function(gltf){
                scene.add(gltf.scene);
                gltf.scene.rotateY(Math.PI / 2);
                gltf.scene.translateZ(-1);
                gltf.scene.translateY(3);
                
                // get valves
                // cylinders 003, 005 and 006 represent the valves
                gltf.scene.children.forEach(child => {
                    if(child.name.includes('003')){
                        valves[1] = child;
                    }else if(child.name.includes('005')){
                        valves[2] = child;
                    }else if(child.name.includes('006')){
                        valves[3] = child;
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

function update(){
    // move stuff around, etc.
}

function keydown(evt){
    if(evt.key === '1'){
        valves[1].morphTargetInfluences[0] = 1.0;
    }else if(evt.key === '2'){
        valves[2].morphTargetInfluences[0] = 1.0;
    }else if(evt.key === '3'){
        valves[3].morphTargetInfluences[0] = 1.0;
    }
    
    // TODO: how could we differentiate between notes with the same valve combinations?
    // e.g. first valve down could be F or Bb :/ any way to easily distinguish the two?
    
    // TODO: maybe allow for different octaves with some
    // simultaneous keydown? e.g. by default we're c4 - c5 (Bb)
    // but pressing down the 6 key at the same time will move to c5 - c6
}
document.addEventListener("keydown", keydown);

function keyup(evt){
    if(evt.key === '1'){
        valves[1].morphTargetInfluences[0] = 0.0;
    }else if(evt.key === '2'){
        valves[2].morphTargetInfluences[0] = 0.0;
    }else if(evt.key === '3'){
        valves[3].morphTargetInfluences[0] = 0.0;
    }
    
    if(evt.key === 'Shift'){
        // evaluate the current valves that are down and play corresponding note
        let valveCombo = "";
        valveCombo += valves[1].morphTargetInfluences[0] > 0 ? "1" : "";
        valveCombo += valves[2].morphTargetInfluences[0] > 0 ? "2" : "";
        valveCombo += valves[3].morphTargetInfluences[0] > 0 ? "3" : "";
        if(valveCombo === "") valveCombo = "0";
        
        const note = valveToNoteComboMap[valveCombo];
        const octave = document.getElementById('octave').value;
        
        audioContext.resume().then(() => {
            // set up buffer nodes
            const newBufNode = audioContext.createBufferSource();
            newBufNode.buffer = noteBufferMap[(note+octave)].buffer;
            newBufNode.connect(gainNode);
            
            // schedule note (use seconds for start time)
            const start = audioContext.currentTime;
            const end = start + 0.5;
            gainNode.gain.setTargetAtTime(1.5, start, 0.0045);
            gainNode.gain.setTargetAtTime(0.0, (end - .0025), 0.0070);
            
            newBufNode.start(start);
            newBufNode.stop(end);
        });
    }
}
document.addEventListener("keyup", keyup);

document.getElementById('playExample').addEventListener('click', () => {
    const selectedExample = document.getElementById('selectExamplePiece').value;
    //console.log(selectedExample);
    
    if(readyToPlay){
        if(selectedExample === "examplePiece1") playExamplePiece1();
        else if(selectedExample === "examplePiece2") playExamplePiece2();
        else if(selectedExample === "nostalgia-excerpt") playNostalgiaExcerpt();
    }
});


function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    update();
}

getModel("trumpet.gltf", "trumpet");
animate();
