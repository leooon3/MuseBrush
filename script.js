var brushButton = document.getElementById("brushes_tab");
var brushDropdown = document.getElementById("brushDropdown");
brushButton.onclick = function () {
    brushDropdown.style.display = (brushDropdown.style.display === "block") ? "none" : "block";
};

document.querySelectorAll(".brush-option").forEach(button => {
    button.addEventListener("click", function () {
        brushType = this.getAttribute("data");
        setBrush(brushType);
        brushDropdown.style.display = "none";
    });
});

document.addEventListener("click", function (event) {
    if (!brushButton.contains(event.target) && !brushDropdown.contains(event.target)) {
        brushDropdown.style.display = "none";
    }
});

function setBrush(type) {
  switch (type) {
    case 'Basic':
      ctx.lineWidth = brushSize;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      break;
    case 'Smooth':
      ctx.lineWidth = brushSize * 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      break;
    case 'Thick':
      ctx.lineWidth = brushSize * 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      break;
    case 'Spray':
      ctx.lineWidth = 1;
      break;
    case 'Calligraphy':
      ctx.lineWidth = brushSize;
      ctx.lineJoin = 'bevel';
      ctx.lineCap = 'square';      
      break;
    case 'Dotted':
      ctx.lineWidth = brushSize;
      break;
  }
}




// ========= Fabric.js Logic ==========

// Inizializzazione canvas Fabric.js
const canvas = new fabric.Canvas('c', {
    isDrawingMode: true,
    backgroundColor: 'transparent',
    width: 800,
    height: 450  // 16:9 ratio
});

canvas.setZoom(window.devicePixelRatio || 1);

// Funzioni pennelli
document.querySelectorAll(".brush-option").forEach(button => {
    button.addEventListener("click", function () {
        setBrush(this.getAttribute("data"));
        brushDropdown.style.display = "none";
    });
});

function setBrush(type) {
    switch (type) {
        case 'Basic':
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.width = brushSize;
            break;
        case 'Smooth':
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.width = brushSize * 1.5;
            break;
        case 'Thick':
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.width = brushSize * 3;
            break;
        case 'Spray':
            canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
            canvas.freeDrawingBrush.width = brushSize;
            canvas.freeDrawingBrush.density = 20;
            break;
        case 'Calligraphy':
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.width = brushSize;
            canvas.freeDrawingBrush.strokeLineCap = 'square';
            break;
        case 'Dotted':
            canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
            canvas.freeDrawingBrush.width = brushSize;
            break;
    }
    canvas.freeDrawingBrush.color = brushColor;
}

// Gestione colore
const colorInput = document.getElementById('colorInput');
colorInput.addEventListener('input', function () {
    brushColor = this.value;
    canvas.freeDrawingBrush.color = brushColor;
});

// Gestione spessore
const thicknessSlider = document.getElementById('thicknessSlider');
thicknessSlider.addEventListener('input', function () {
    brushSize = parseInt(this.value, 10);
    canvas.freeDrawingBrush.width = brushSize;
});

// Modalità puntatore
document.getElementById('pointerToggleBtn').onclick = function() {
    canvas.isDrawingMode = !canvas.isDrawingMode;
    const icon = document.getElementById('pointerIcon');
    icon.src = canvas.isDrawingMode ? "./images/pencil-icon.png" : "./images/pointer-icon.png";
};

// Undo e Redo
const undoStack = [];
const redoStack = [];

canvas.on('path:created', function() {
    undoStack.push(JSON.stringify(canvas));
    redoStack.length = 0;
});

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(undoStack.pop());
        canvas.clear();
        if (undoStack.length) {
            canvas.loadFromJSON(undoStack[undoStack.length - 1], canvas.renderAll.bind(canvas));
        }
    }
}

document.getElementById('undoBtn').onclick = undo;

function redo() {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(state);
        canvas.loadFromJSON(state, canvas.renderAll.bind(canvas));
    }
}

document.getElementById('redoBtn').onclick = redo;

// Cancella tutto
document.getElementById('clearBtn').onclick = function() {
    canvas.clear();
    undoStack.length = 0;
    redoStack.length = 0;
};

// Download immagine
document.querySelectorAll(".download-option").forEach(button => {
    button.addEventListener("click", function () {
        const format = this.getAttribute("value");
        const dataURL = canvas.toDataURL({
            format: format,
            quality: 1.0
        });
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `drawing.${format}`;
        link.click();
    });
});
