// script.js - Fixed Complete Undo/Redo for Multi-Layer Restore
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let isDrawing = false;
let layers = [];
let activeLayer = 0;
let undoStack = [];
let redoStack = [];

// Initialize first layer
function createLayer() {
    const layer = document.createElement("canvas");
    layer.width = canvas.width;
    layer.height = canvas.height;
    layer.ctx = layer.getContext("2d");
    layer.visible = true;
    return layer;
}

layers.push(createLayer());

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    let pos = getMousePos(e);
    layers[activeLayer].ctx.beginPath();
    layers[activeLayer].ctx.moveTo(pos.x, pos.y);
    saveState(); // Save state before drawing
});

canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});

canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    let pos = getMousePos(e);
    layers[activeLayer].ctx.lineTo(pos.x, pos.y);
    layers[activeLayer].ctx.stroke();
    updateCanvas();
});

// Save state for undo/redo
function saveState() {
    let state = layers.map(layer => ({
        imgData: layer.ctx.getImageData(0, 0, canvas.width, canvas.height),
        visible: layer.visible
    }));
    undoStack.push(state);
    redoStack = [];
}

function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layers.forEach(layer => {
        if (layer.visible) {
            ctx.drawImage(layer, 0, 0);
        }
    });
}

// Undo function
function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        restoreState(undoStack[undoStack.length - 1]);
    }
}

// Redo function
function redo() {
    if (redoStack.length > 0) {
        let nextState = redoStack.pop();
        undoStack.push(nextState);
        restoreState(nextState);
    }
}

function restoreState(state) {
    state.forEach((layerState, index) => {
        layers[index].ctx.putImageData(layerState.imgData, 0, 0);
        layers[index].visible = layerState.visible;
    });
    updateCanvas();
}

// Add new layer
function addLayer() {
    layers.push(createLayer());
    activeLayer = layers.length - 1;
    saveState();
}

// Switch active layer
function switchLayer(index) {
    if (index >= 0 && index < layers.length) {
        activeLayer = index;
    }
}

// Toggle visibility of a layer
function toggleLayerVisibility(index) {
    if (index >= 0 && index < layers.length) {
        layers[index].visible = !layers[index].visible;
        saveState();
        updateCanvas();
    }
}

document.getElementById("addLayerBtn").addEventListener("click", addLayer);
document.getElementById("switchLayerBtn").addEventListener("click", () => {
    let index = prompt("Enter layer number:");
    switchLayer(parseInt(index));
});
document.getElementById("toggleLayerBtn").addEventListener("click", () => {
    let index = prompt("Enter layer number to toggle visibility:");
    toggleLayerVisibility(parseInt(index));
});
document.getElementById("undoBtn").addEventListener("click", undo);
document.getElementById("redoBtn").addEventListener("click", redo);