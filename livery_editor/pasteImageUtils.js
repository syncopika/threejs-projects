// this stuff is taken from: 
// https://github.com/syncopika/funSketch/blob/master/experiments/pasteToolExperiment/pasteTest.html

let isMovingPasteCanvas = false;
let lastOffsetHeight = 0;
let lastOffsetWidth = 0;
let initialOffsetX = 0;
let initialOffsetY = 0;

let resizingPasteCanvas = false;
let lastX = null;
let lastY = null;

let currPasteCanvasRotation = 0;
let rotatingPasteCanvas = false;

let originalPasteImage;

function addPasteCanvas(imgData, width, height){
    const canvasElement = document.createElement("canvas");
    document.getElementById("liveryDisplay").appendChild(canvasElement);
    canvasElement.id = "editCanvas";
    canvasElement.style.position = "absolute";
    canvasElement.style.border = "1px #000 solid";
    canvasElement.style.zIndex = 10;
    canvasElement.style.top = 0;
    canvasElement.style.left = 0;
    canvasElement.width = width;
    canvasElement.height = height;
    const ctx = canvasElement.getContext('2d');
    ctx.drawImage(imgData, 0, 0);
    return canvasElement;
}

function allowScaleAndRotate(pasteCanvas){
    return function(evt){
        if(evt.keyCode === 83){
            // s key
            resizingPasteCanvas = !resizingPasteCanvas;
        }else if(evt.keyCode === 82){
            // r key
            rotatingPasteCanvas = !rotatingPasteCanvas;
        }else if(evt.keyCode === 27){
            // esc key
            // cancel
            pasteCanvas.parentNode.removeChild(pasteCanvas);
        }
    }
}

function redrawImage(newRotation, pasteCanvas, ctx){
    // translate the (0,0) coord (where the top-left of the image will be in the canvas)
    if(newRotation === 0){
        ctx.translate(0, 0);
    }else if(newRotation === 90 || newRotation === -270){
        ctx.translate(pasteCanvas.width, 0);
    }else if(newRotation === 180 || newRotation === -180){
        ctx.translate(pasteCanvas.width, pasteCanvas.height);
    }else if(newRotation === 270 || newRotation === -90){
        ctx.translate(0, pasteCanvas.height);
    }
    
    // then apply the rotation
    ctx.rotate(newRotation * Math.PI / 180);
    
    if(Math.abs(newRotation) === 90 || Math.abs(newRotation) === 270){
        ctx.drawImage(originalPasteImage, 0, 0, pasteCanvas.height, pasteCanvas.width);
    }else{
        ctx.drawImage(originalPasteImage, 0, 0, pasteCanvas.width, pasteCanvas.height);
    }
}

function addPastCanvasEventListeners(pasteCanvas){
    document.addEventListener('keydown', allowScaleAndRotate(pasteCanvas));
    
    pasteCanvas.addEventListener('wheel', (evt) => {
        if(!rotatingPasteCanvas) return;
        
        evt.preventDefault();
        
        // only allow rotations in 90 deg increments because it's easier to handle such cases
        let newRotation = currPasteCanvasRotation;
        if(evt.deltaY > 0){
            // rotate left
            newRotation -= 90;
        }else{
            newRotation += 90;
        }
        newRotation %= 360;
        //console.log(newRotation);
        
        // https://stackoverflow.com/questions/17040360/javascript-function-to-rotate-a-base-64-image-by-x-degrees-and-return-new-base64
        const ctx = pasteCanvas.getContext("2d");
        
        // swap the dimensions because we're rotating the canvas
        const temp = pasteCanvas.height;
        pasteCanvas.height = pasteCanvas.width;
        pasteCanvas.width = temp;
        
        redrawImage(newRotation, pasteCanvas, ctx);
        
        currPasteCanvasRotation = newRotation;
    });

    pasteCanvas.addEventListener('mousedown', (evt) => {
        isMovingPasteCanvas = true;
        initialOffsetX = evt.offsetX;
        initialOffsetY = evt.offsetY;
    });
    
    pasteCanvas.addEventListener('mousemove', (evt) => {
        if(isMovingPasteCanvas){
            const currX = evt.offsetX;
            const currY = evt.offsetY;
            
            const offsetY = Math.abs(currY - initialOffsetY);
            const offsetX = Math.abs(currX - initialOffsetX);
            
            if(currY < lastOffsetHeight){
                pasteCanvas.style.top = (parseInt(pasteCanvas.style.top) - offsetY) + "px";
            }else{
                pasteCanvas.style.top = (parseInt(pasteCanvas.style.top) + offsetY) + "px";
            }
            lastOffsetHeight = currY;
            
            if(currX < lastOffsetWidth){
                pasteCanvas.style.left = (parseInt(pasteCanvas.style.left) - offsetX) + "px";
            }else{
                pasteCanvas.style.left = (parseInt(pasteCanvas.style.left) + offsetX) + "px";
            }
            lastOffsetWidth = currX;
        }else if(resizingPasteCanvas){
            // https://stackoverflow.com/questions/24429830/html5-canvas-how-to-change-putimagedata-scale
            // https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas
            const ctx = pasteCanvas.getContext('2d');
            
            const x = evt.pageX;
            const y = evt.pageY;
            
            let deltaX, deltaY;
            if(lastX === null || x === lastX){
                deltaX = 0;
            }else if(x < lastX){
                deltaX = -1;
            }else{
                deltaX = 1;
            }
            
            if(lastY === null || y === lastY){
                deltaY = 0;
            }else if(y < lastY){
                deltaY = -1;
            }else{
                deltaY = 1;
            }
            
            lastX = x;
            lastY = y;
            
            // adjust the canvas dimensions,
            // then draw back the original image
            pasteCanvas.width += deltaX*2;
            pasteCanvas.height += deltaY*2;
            
            redrawImage(currPasteCanvasRotation, pasteCanvas, ctx);
        }
    });
    
    pasteCanvas.addEventListener('mouseup', (evt) => {
        // place the image data from pasteCanvas onto the main canvas
        isMovingPasteCanvas = false;
        
        const mainCanvas = document.getElementById('liveryCanvas');
        const mainCtx = mainCanvas.getContext('2d');
        
        // figure out how much of the pasted image is visible and can be placed on the main canvas
        const pasteLeft = parseInt(pasteCanvas.style.left);
        const pasteTop = parseInt(pasteCanvas.style.top);
        
        let pasteImgRowStart = 0;
        let pasteImgRowEnd = pasteCanvas.height;
        let pasteImgColStart = 0;
        let pasteImgColEnd = pasteCanvas.width;
        
        let width;
        if(pasteLeft < 0){
            // image goes past the left side of the main canvas
            width = pasteCanvas.width + pasteLeft;
            pasteImgColStart = Math.abs(pasteLeft);
        }else if(pasteLeft + pasteCanvas.width <= mainCanvas.width){
            // if pasted image falls within the mainCanvas completely width-wise
            width = pasteCanvas.width;
        }else{
            // image goes past the right side of the main canvas
            width = mainCanvas.width - pasteLeft;
            pasteImgColEnd = width;
        }
        
        let height;
        if(pasteTop < 0){
            height = pasteCanvas.height + pasteTop;
            pasteImgRowStart = Math.abs(pasteTop);
        }else if(pasteTop + pasteCanvas.height <= mainCanvas.height){
            height = pasteCanvas.height;
        }else{
            height = mainCanvas.height - pasteTop;
            pasteImgRowEnd = height;
        }
        
        // isolate just the section of image data that should be pasted
        const pasteData = pasteCanvas.getContext('2d').getImageData(0,0,pasteCanvas.width,pasteCanvas.height).data;
        const pasteImgSectionData = [];
        for(let row = pasteImgRowStart*4*pasteCanvas.width; row < pasteImgRowEnd*4*pasteCanvas.width; row += (4*pasteCanvas.width)){
            for(let col = 4*pasteImgColStart; col < 4*pasteImgColEnd; col += 4){
                pasteImgSectionData.push(pasteData[row+col]);
                pasteImgSectionData.push(pasteData[row+col+1]);
                pasteImgSectionData.push(pasteData[row+col+2]);
                pasteImgSectionData.push(pasteData[row+col+3]);
            }
        }
        
        // the location on the main canvas where to start pasting the image
        const locX = (pasteLeft < 0) ? 0 : pasteLeft;
        const locY = (pasteTop < 0) ? 0 : pasteTop;
        
        const imgData = mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
        const rowStartMain = mainCanvas.width*4*locY;
        const rowEndMain = mainCanvas.width*4*(locY+height);
        const colStart = locX*4;
        const colEnd = 4*(locX+width);
        let pasteImgDataIdx = 0;
        
        for(let i = rowStartMain; i < rowEndMain; i += (mainCanvas.width*4)){
            for(let j = colStart; j < colEnd; j+=4){
                const r = pasteImgSectionData[pasteImgDataIdx++];
                const g = pasteImgSectionData[pasteImgDataIdx++];
                const b = pasteImgSectionData[pasteImgDataIdx++];
                const a = pasteImgSectionData[pasteImgDataIdx++];
                // avoid adding transparency as black
                if(
                    r === 0 &&
                    g === 0 &&
                    b === 0 &&
                    a === 0){
                    continue;
                }
                imgData.data[i+j] = r;
                imgData.data[i+j+1] = g;
                imgData.data[i+j+2] = b;
                imgData.data[i+j+3] = a;
            }
        }
        
        mainCtx.putImageData(imgData, 0, 0);
        
        pasteCanvas.parentNode.removeChild(pasteCanvas);
    });
}

// need to add the event listener on the document
document.addEventListener("paste", (evt) => {
    const items = (evt.clipboardData || evt.originalEvent.clipboardData).items; // items is an object of type DataTransferItemList
    
    for(let i = 0; i < items.length; i++){
        if(items[i].type.indexOf("image") > -1){
            const file = items[i]; // items[i] is a DataTransferItem type object
            const blob = file.getAsFile();
            const url = URL.createObjectURL(blob);
            
            // place the image on a new canvas (so we can allow moving it around for placement)
            const img = new Image();
            img.onload = () => {
                const pasteCanvas = addPasteCanvas(img, img.width, img.height);
                addPastCanvasEventListeners(pasteCanvas);
                originalPasteImage = img;
            };
            img.src = url;
            
            break;
        }
    }
});
