var brushButton = document.getElementById("brushes_tab");
var brushDropdown = document.getElementById("brushDropdown");
document.querySelectorAll(".brush-option").forEach(button => {
    button.addEventListener("click", function () {
        setBrush(this.getAttribute("data"));
        brushDropdown.style.display = "none";
        setDrawingMode(true); // forza modalità disegno
    });
});

// Inizializzazione canvas Fabric.js
const canvasEl = document.getElementById('c');
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight * 0.85;

const canvas = new fabric.Canvas('c', {
    isDrawingMode: true,
    backgroundColor: 'transparent',
    width: canvasEl.width,
    height: canvasEl.height
});


canvas.setZoom(window.devicePixelRatio || 1);


// Inizializzazione colore e dimensione

// Inizializzazione colore e dimensione
const thicknessSlider = document.getElementById('thicknessSlider');
const colorInput = document.getElementById('colorInput');

let brushSize = parseInt(thicknessSlider.value, 10) || 5;
let brushColor = colorInput.value || "#000000";
let currentBrush = "Basic"; // default iniziale
let isInsertingText = false;



// Inizializza il pennello base
canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
canvas.freeDrawingBrush.width = brushSize;
canvas.freeDrawingBrush.color = brushColor;



// Funzioni pennelli
document.querySelectorAll(".brush-option").forEach(button => {
    button.addEventListener("click", function () {
        setBrush(this.getAttribute("data"));
        brushDropdown.style.display = "none";
    });
});
function setBrush(type) {
        currentBrush = type; // ✅ memorizza il tipo selezionato    
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
    drawingShape = null;  // disabilita disegno forme se si seleziona un pennello

}
function setDrawingMode(active) {
    canvas.isDrawingMode = active;
    const icon = document.getElementById('pointerIcon');
    icon.src = active ? "./images/pencil-icon.png" : "./images/pointer-icon.png";
}
function disableDrawingSilently() {
    canvas.isDrawingMode = false;
    // NON tocco l’icona!
}


// Gestione colore
colorInput.addEventListener('input', function () {
    brushColor = this.value;
    if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = brushColor;
    }
});

// Gestione spessore
thicknessSlider.addEventListener('input', function () {
    brushSize = parseInt(this.value, 10);
    canvas.freeDrawingBrush.width = brushSize;
});

// Modalità puntatore
document.getElementById('pointerToggleBtn').onclick = function() {
    const newMode = !canvas.isDrawingMode;
    setDrawingMode(newMode);
    drawingShape = null; // esce anche dalla modalità forme
};

// Undo e Redo
const undoStack = [];
const redoStack = [];
let isRestoring = false;

undoStack.push(JSON.stringify(canvas));

function saveState() {
    if (isRestoring) return;

    const current = JSON.stringify(canvas);
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== current) {
        undoStack.push(current);
        redoStack.length = 0;
    }
}

canvas.on('path:created', function(e) {
    // Dopo che un tratto è stato disegnato, assicuriamoci che venga tracciato
    canvas.renderAll();
    saveState();
});
document.getElementById('undoBtn').onclick = undo;
document.getElementById('redoBtn').onclick = redo;


function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        const previous = undoStack[undoStack.length - 1];
        isRestoring = true;
        canvas.loadFromJSON(previous, () => {
            canvas.renderAll();
            isRestoring = false;
        });
    }
}

function redo() {
    if (redoStack.length > 0) {
        const next = redoStack.pop();
        undoStack.push(next);
        isRestoring = true;
        canvas.loadFromJSON(next, () => {
            canvas.renderAll();
            isRestoring = false;
        });
    }
}

// Cancella tutto
document.getElementById('clearBtn').onclick = function() {
    canvas.clear();
    undoStack.length = 0;
    redoStack.length = 0;
    saveState(); // aggiunto per aggiornare lo stato anche dopo clear
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



let drawingShape = null;
let isDrawingShape = false;
let previousDrawingMode = canvas.isDrawingMode;
let shapeOrigin = { x: 0, y: 0 };
let shapeObject = null;

const shapeBtn = document.getElementById('shapes_tab');
const shapeDropdown = document.getElementById('shapeDropdown');
const downloadBtn = document.getElementById("download_tab");
const downloadDropdown = document.getElementById("downloadDropdown");
document.querySelectorAll(".shape-option").forEach(button => {
    button.addEventListener("click", function () {
        previousDrawingMode = canvas.isDrawingMode;
        drawingShape = this.getAttribute("data-shape");
        disableDrawingSilently(); // ✅ Disattiva il disegno senza cambiare l’icona
        shapeDropdown.style.display = "none";        
    });
});



canvas.on('mouse:down', function(opt) {
    if (isInsertingText) {
        const pointer = canvas.getPointer(opt.e);
    
        const text = new fabric.IText("Testo", {
            left: pointer.x,
            top: pointer.y,
            fontFamily: 'Arial',
            fontSize: 24,
            fill: brushColor,
            fontWeight: 'normal',
            fontStyle: 'normal',
            underline: false
        });
    
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
        saveState();
    
        // Fine modalità testo
        isInsertingText = false;
        setDrawingMode(previousDrawingMode);
        if (previousDrawingMode) {
            setBrush(currentBrush);
        }
    }
    
    
    if (!drawingShape) return;
        // Forza salvataggio prima di inserire una nuova forma

    isDrawingShape = true;
    const pointer = canvas.getPointer(opt.e);
    shapeOrigin = { x: pointer.x, y: pointer.y };

    switch (drawingShape) {
        case 'rect':
            shapeObject = new fabric.Rect({
                left: pointer.x,
                top: pointer.y,
                width: 0,
                height: 0,
                fill: brushColor,
                selectable:true
            });
            break;
        case 'circle':
            shapeObject = new fabric.Circle({
                left: pointer.x,
                top: pointer.y,
                radius: 0,
                fill: brushColor,
                selectable: true
            });
            break;
        case 'line':
            shapeObject = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                stroke: brushColor,
                strokeWidth: brushSize,
                selectable: true 
            });
            break;
    }

    if (shapeObject) {
        canvas.add(shapeObject);
    }
});

canvas.on('mouse:move', function(opt) {
    if (!isDrawingShape || !shapeObject) return;

    const pointer = canvas.getPointer(opt.e);

    switch (drawingShape) {
        case 'rect':
            shapeObject.set({
                width: Math.abs(pointer.x - shapeOrigin.x),
                height: Math.abs(pointer.y - shapeOrigin.y),
                left: Math.min(pointer.x, shapeOrigin.x),
                top: Math.min(pointer.y, shapeOrigin.y)
            });
            break;
        case 'circle':
            const radius = Math.sqrt(Math.pow(pointer.x - shapeOrigin.x, 2) + Math.pow(pointer.y - shapeOrigin.y, 2)) / 2;
            shapeObject.set({
                radius: radius,
                left: (pointer.x + shapeOrigin.x) / 2 - radius,
                top: (pointer.y + shapeOrigin.y) / 2 - radius
            });
            break;
        case 'line':
            shapeObject.set({ x2: pointer.x, y2: pointer.y });
            break;
    }

    canvas.renderAll();
});

canvas.on('mouse:up', function() {
    if (isDrawingShape) {
        isDrawingShape = false;
        shapeObject = null;

        // ✅ Disattiva modalità figura
        drawingShape = null;

        // ✅ Torna alla modalità precedente
                // ✅ Torna alla modalità precedente
                setDrawingMode(previousDrawingMode);

                // ✅ Se torno al disegno, reimposto il pennello attivo
                if (previousDrawingMode) {
                    setBrush(currentBrush); // <== la variabile che useremo subito
                }
        

        // ✅ Deseleziona eventuali oggetti
        canvas.discardActiveObject();
        canvas.requestRenderAll();

        saveState();
        // Rendi selezionabile e interattivo dopo aver completato
const objects = canvas.getObjects();
const last = objects[objects.length - 1];
if (last) {
    last.selectable = true;
    last.evented = true;
}

    }
});






document.addEventListener("click", function(e) {
    if (!brushButton.contains(e.target) && !brushDropdown.contains(e.target)) {
        brushDropdown.style.display = "none";
    }
    if (!shapeBtn.contains(e.target) && !shapeDropdown.contains(e.target)) {
        shapeDropdown.style.display = "none";
    }
    if (!downloadBtn.contains(e.target) && !downloadDropdown.contains(e.target)) {
        downloadDropdown.style.display = "none";
    }
});
brushButton.onclick = function (e) {
    brushDropdown.style.display = (brushDropdown.style.display === "block") ? "none" : "block";
};

shapeBtn.onclick = function (e) {
    shapeDropdown.style.display = (shapeDropdown.style.display === "block") ? "none" : "block";
};

downloadBtn.onclick = function (e) {
    downloadDropdown.style.display = (downloadDropdown.style.display === "block") ? "none" : "block";
};

const textBtn = document.getElementById('text_tab');
textBtn.addEventListener("click", () => {
    previousDrawingMode = canvas.isDrawingMode;
    disableDrawingSilently(); // disattiva il disegno
    drawingShape = null; // disattiva le forme
    isInsertingText = true;
});
