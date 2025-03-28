// ================================
// 🖼️ 1. Inizializzazione Canvas e Layers
// ================================
const layers = [];
let activeLayerIndex = 0;
let brushSize = 5;
let brushColor = "#000000";
let currentBrush = "Basic";
let lastEraserPoint = null;
let isEraserMode = false;
let isInsertingText = false;
let drawingShape = null;
let isDrawingShape = false;
let previousDrawingMode = false;
let shapeOrigin = { x: 0, y: 0 };
let shapeObject = null;
let globalDrawingMode = true;

function getActiveLayer() {
  return layers[activeLayerIndex];
}

function createLayer(container, index) {
  const layerCanvasEl = document.createElement('canvas');
  layerCanvasEl.classList.add('layer-canvas');
  layerCanvasEl.width = window.innerWidth;
  layerCanvasEl.height = window.innerHeight * 0.85;

  const layerCanvas = new fabric.Canvas(layerCanvasEl, {
    isDrawingMode: index === 1,
    backgroundColor: index === 0 ? 'white' : 'transparent',
    width: layerCanvasEl.width,
    height: layerCanvasEl.height
  });

  layerCanvas.setZoom(window.devicePixelRatio || 1);
  container.appendChild(layerCanvas.lowerCanvasEl);
  container.appendChild(layerCanvas.upperCanvasEl);

  layers.push({
    canvas: layerCanvas,
    undoStack: [JSON.stringify(layerCanvas)],
    redoStack: [],
    name: `Livello ${layers.length + 1}`,
    visible: true
  });

  attachCanvasEvents(layerCanvas);
}

function initLayers() {
  // Create eraser overlay canvas
  const overlay = document.createElement('canvas');
  overlay.id = 'eraser-preview';
  overlay.style.position = 'absolute';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.pointerEvents = 'none';
  overlay.width = window.innerWidth;
  overlay.height = window.innerHeight * 0.85;
  overlay.style.zIndex = 9999;
  document.querySelector('.canvas-container').appendChild(overlay);

  const container = document.querySelector('.canvas-container');
  createLayer(container, 1);
  updateCanvasVisibility();
  setDrawingMode(true);
  setBrush(currentBrush);
}

function updateCanvasVisibility() {
  layers.forEach((layer, i) => {
    const canvas = layer.canvas;
    const isActive = i === activeLayerIndex;
    const zBase = i * 2;
    canvas.lowerCanvasEl.style.zIndex = zBase;
    canvas.upperCanvasEl.style.zIndex = zBase + 1;
    canvas.lowerCanvasEl.style.display = layer.visible ? 'block' : 'none';
    canvas.upperCanvasEl.style.display = isActive ? 'block' : 'none';
    canvas.lowerCanvasEl.style.position = 'absolute';
    canvas.upperCanvasEl.style.position = 'absolute';
    canvas.lowerCanvasEl.classList.toggle('active', isActive);
    canvas.upperCanvasEl.classList.toggle('active', isActive);
    canvas.isDrawingMode = isActive && globalDrawingMode && layer.visible;
    canvas.selection = isActive;
    canvas.skipTargetFind = !isActive;
  });
}

// ================================
// 🎨 2. Brush e Modalità Disegno
// ================================
function setBrush(type) {
  const layer = getActiveLayer();

  // ✅ Aggiorna flag
  isEraserMode = type === 'Eraser';
  currentBrush = type;

  if (!layer.canvas.isDrawingMode) return;

  let brush = null;

  const realColor = isEraserMode ? 'rgba(0,0,0,0)' : brushColor;
  switch (type) {
    case 'Basic':
      brush = new fabric.PencilBrush(layer.canvas);
      brush.width = brushSize;
      brush.color = brushColor;
      break;

    case 'Smooth':
      brush = new fabric.PencilBrush(layer.canvas);
      brush.width = brushSize * 1.5;
      brush.color = brushColor;
      break;

    case 'Thick':
      brush = new fabric.PencilBrush(layer.canvas);
      brush.width = brushSize * 3;
      brush.color = brushColor;
      break;

    case 'Spray':
      brush = new fabric.SprayBrush(layer.canvas);
      brush.width = brushSize;
      brush.density = 20;
      brush.color = realColor;
      break;

    case 'Calligraphy':
      brush = new fabric.PencilBrush(layer.canvas);
      brush.width = brushSize * (type === 'Smooth' ? 1.5 : type === 'Thick' ? 3 : 1);
      brush.color = realColor;
      brush.strokeLineCap = type === 'Calligraphy' ? 'square' : 'round';
      break;

    case 'Dotted':
      brush = new fabric.CircleBrush(layer.canvas);
      brush.width = brushSize;
      brush.color = realColor;
      break;

    
      case 'PixelEraser':
      brush = new fabric.PencilBrush(layer.canvas);
      brush.width = brushSize;
      brush.color = 'white';
      break;
      


      

    case 'Eraser':
      brush = new fabric.PencilBrush(layer.canvas);
      brush.width = brushSize;
      brush.color = "transparent"; // invisibile davvero
      break;
  }

  if (brush) {
    layer.canvas.freeDrawingBrush = brush;
  }
}


function setDrawingMode(active) {
  layers.forEach((layer, i) => {
    const isActive = i === activeLayerIndex;
    layer.canvas.isDrawingMode = isActive && active && layer.visible;
  });
  document.getElementById('pointerIcon').src = active ? "./images/pencil-icon.png" : "./images/pointer-icon.png";
}

function disableDrawingSilently() {
  layers.forEach(layer => layer.canvas.isDrawingMode = false);
}

// ================================
// 🔁 3. Undo, Redo e Stato
// ================================
function saveState() {
  const layer = getActiveLayer();
  const current = JSON.stringify(layer.canvas);
  if (layer.undoStack[layer.undoStack.length - 1] !== current) {
    layer.undoStack.push(current);
    layer.redoStack.length = 0;
  }
}

function undo() {
  const layer = getActiveLayer();
  if (layer.undoStack.length > 1) {
    layer.redoStack.push(layer.undoStack.pop());
    const previous = layer.undoStack[layer.undoStack.length - 1];
    layer.canvas.loadFromJSON(previous, () => layer.canvas.renderAll());
  }
}

function redo() {
  const layer = getActiveLayer();
  if (layer.redoStack.length > 0) {
    const next = layer.redoStack.pop();
    layer.undoStack.push(next);
    layer.canvas.loadFromJSON(next, () => layer.canvas.renderAll());
  }
}

// ================================
// ✏️ 4. Eventi Canvas: Disegno, Testo, Forme
// ================================
function attachCanvasEvents(canvas) {
  canvas.on('path:created', (opt) => {
    const path = opt.path;
  
    if (isEraserMode) {
      path.set({ erasable: false });
      const pathBounds = path.getBoundingRect();
  
      const toDelete = canvas.getObjects().filter(obj => {
        if (!obj.erasable || obj === path) return false;
        const objBounds = obj.getBoundingRect();
        const overlap = !(
          pathBounds.left > objBounds.left + objBounds.width ||
          pathBounds.left + pathBounds.width < objBounds.left ||
          pathBounds.top > objBounds.top + objBounds.height ||
          pathBounds.top + pathBounds.height < objBounds.top
        );
        return overlap;
      });
  
      toDelete.forEach(obj => canvas.remove(obj));
      canvas.remove(path);
      canvas.renderAll();
      saveState();
      return;
    }
  
    // Solo per path validi
    if (path && typeof path.set === 'function') {
      path.set({ erasable: true });
    }
    canvas.renderAll();
    saveState();
  });

  
  canvas.on('mouse:down', function(opt) {
    if (currentBrush === 'PixelEraser') {
      canvas.contextTop.globalCompositeOperation = 'destination-out';
      canvas._isErasing = true;
    }
    const pointer = canvas.getPointer(opt.e);

    if (isInsertingText) {
      const text = new fabric.IText("Testo", {
        left: pointer.x,
        top: pointer.y,
        fontFamily: 'Arial',
        fontSize: 24,
        fill: brushColor
      });
      text.set({ erasable: true });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      saveState();
      isInsertingText = false;
      setDrawingMode(previousDrawingMode);
      if (previousDrawingMode) setBrush(currentBrush);
      return;
    }

    if (!drawingShape) return;
    isDrawingShape = true;
    shapeOrigin = { x: pointer.x, y: pointer.y };

    switch (drawingShape) {
      case 'rect':
        shapeObject = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: brushColor,
          selectable: true
        });
        shapeObject.set({ erasable: true });
        break;
      case 'circle':
        shapeObject = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: brushColor,
          selectable: true
        });
        shapeObject.set({ erasable: true });
        break;
      case 'line':
        shapeObject = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: brushColor,
          strokeWidth: brushSize,
          selectable: true
        });
        shapeObject.set({ erasable: true });
        break;
    }
    if (shapeObject) canvas.add(shapeObject);
  });

  canvas.on('mouse:move', function(opt) {
    const overlay = document.getElementById('eraser-preview');
    const ctxOverlay = overlay.getContext('2d');
    ctxOverlay.clearRect(0, 0, overlay.width, overlay.height);
    if (currentBrush === 'PixelEraser') {
      const p = canvas.getPointer(opt.e);
      ctxOverlay.beginPath();
      ctxOverlay.arc(p.x, p.y, brushSize / 2, 0, 2 * Math.PI);
      ctxOverlay.fillStyle = 'rgba(0,0,0,0.2)';
      ctxOverlay.fill();
    }
    if (currentBrush === 'PixelEraser' && canvas._isErasing) {
      const ctx = canvas.contextTop;
      const p = canvas.getPointer(opt.e);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(p.x, p.y, brushSize / 2, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fill();
      lastEraserPoint = p;
    }
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
    if (currentBrush === 'PixelEraser') {
      canvas._isErasing = false;
      lastEraserPoint = null;
      const ctxOverlay = document.getElementById('eraser-preview').getContext('2d');
      ctxOverlay.clearRect(0, 0, canvas.width, canvas.height);
      canvas.contextTop.clearRect(0, 0, canvas.width, canvas.height);
      canvas.contextTop.globalCompositeOperation = 'source-over';
      canvas.renderAll();
      saveState();
    }
    if (isDrawingShape) {
      isDrawingShape = false;
      shapeObject = null;
      drawingShape = null;
      setDrawingMode(previousDrawingMode);
      if (previousDrawingMode) setBrush(currentBrush);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      saveState();
    }
  });
}
// ================================
// 🧩 5. UI: Bottoni, Dropdown, Slider, Colori
// ================================
const brushButton = document.getElementById("brushes_tab");
const brushDropdown = document.getElementById("brushDropdown");
const downloadBtn = document.getElementById("download_tab");
const downloadDropdown = document.getElementById("downloadDropdown");
const shapesButton = document.getElementById("shapes_tab");
const shapeDropdown = document.getElementById("shapeDropdown");

shapesButton.onclick = () => shapeDropdown.style.display = shapeDropdown.style.display === "block" ? "none" : "block";

document.querySelectorAll(".shape-option").forEach(button => {
  button.addEventListener("click", () => {
    drawingShape = button.getAttribute("data-shape");
    previousDrawingMode = globalDrawingMode;
    setDrawingMode(false);
    shapeDropdown.style.display = "none";
  });
});

brushButton.onclick = () => brushDropdown.style.display = brushDropdown.style.display === "block" ? "none" : "block";

document.querySelectorAll(".brush-option").forEach(button => {
  button.addEventListener("click", () => {
    const selectedBrush = button.getAttribute("data");

    // Se non è gomma, aggiorno il currentBrush per i prossimi setBrush()
    if (selectedBrush !== "Eraser") {
      currentBrush = selectedBrush;
    }

    // Applico comunque il pennello selezionato (anche se è "Eraser")
    setBrush(selectedBrush);

    // Se esco dalla gomma, aggiorno l'icona del cursore
    if (selectedBrush !== "Eraser") {
      globalDrawingMode = true;
      setDrawingMode(true);
      document.getElementById('pointerIcon').src = "./images/pencil-icon.png";
    }

    brushDropdown.style.display = "none";
  });
});


document.getElementById('thicknessSlider').addEventListener('input', function () {
  brushSize = parseInt(this.value);
  setBrush(currentBrush);
});

document.getElementById('colorInput').addEventListener('input', function () {
  brushColor = this.value;
  setBrush(currentBrush);
});

document.getElementById('pointerToggleBtn').onclick = () => {
  globalDrawingMode = !globalDrawingMode;
  setDrawingMode(globalDrawingMode);
  setBrush(currentBrush);
  drawingShape = null;
};

document.getElementById('undoBtn').onclick = undo;
document.getElementById('redoBtn').onclick = redo;

document.getElementById("clearBtn").onclick = () => {
  layers.forEach((layer, i) => {
    layer.canvas.clear();
    layer.canvas.backgroundColor = i === 0 ? 'white' : 'transparent';
    saveState();
    layer.canvas.renderAll();
  });
};

document.getElementById("text_tab").onclick = () => {
  previousDrawingMode = getActiveLayer().canvas.isDrawingMode;
  disableDrawingSilently();
  drawingShape = null;
  isInsertingText = true;
};
document.getElementById('eraser_tab').onclick = () => {
  globalDrawingMode = true;
  setDrawingMode(true);
  setBrush("Eraser");
};

// ================================
// 🗂️ 6. Gestione Livelli: Aggiunta, Selezione, Visibilità, Elimina
// ================================
const layersTab = document.getElementById('layers_tab');
const layersPanel = document.getElementById('layersPanel');

function renderLayerList() {
  const list = document.getElementById("layersList");
  list.innerHTML = '';

  layers.forEach((layer, index) => {
    const li = document.createElement('li');
    li.className = index === activeLayerIndex ? 'active' : '';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = layer.name;
    nameSpan.style.flexGrow = '1';
    nameSpan.style.cursor = 'pointer';
    nameSpan.onclick = (e) => {
      e.stopPropagation();
      const newName = prompt("Inserisci un nuovo nome per il layer:", layer.name);
      if (newName && newName.trim()) {
        layer.name = newName.trim();
        renderLayerList();
      }
    };

    const controls = document.createElement('div');
    controls.className = 'layer-controls';

    const visibilityBtn = document.createElement('button');
    visibilityBtn.textContent = layer.visible ? '👁️' : '🚫';
    visibilityBtn.onclick = (e) => {
      e.stopPropagation();
      layer.visible = !layer.visible;
      updateCanvasVisibility();
      renderLayerList();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (layers.length === 1) return alert("Non puoi eliminare l'unico layer.");
      if (confirm(`Vuoi davvero eliminare "${layer.name}"?`)) {
        const container = document.querySelector('.canvas-container');
        container.removeChild(layer.canvas.lowerCanvasEl);
        container.removeChild(layer.canvas.upperCanvasEl);
        layers.splice(index, 1);
        activeLayerIndex = Math.max(0, activeLayerIndex - 1);
        updateCanvasVisibility();
        renderLayerList();
        setDrawingMode(globalDrawingMode);
        setTimeout(() => setBrush(currentBrush), 0);
      }
    };

    controls.appendChild(visibilityBtn);
    controls.appendChild(deleteBtn);
    li.appendChild(nameSpan);
    li.appendChild(controls);

    li.onclick = () => {
      activeLayerIndex = index;
      updateCanvasVisibility();
      renderLayerList();
      setDrawingMode(globalDrawingMode && layers[index].visible);
      setTimeout(() => setBrush(currentBrush), 0);
    };

    list.appendChild(li);
  });

  const addBtn = document.createElement('button');
  addBtn.textContent = "+ Nuovo Livello";
  addBtn.style.marginTop = "10px";
  addBtn.style.width = "100%";
  addBtn.style.padding = "6px 10px";
  addBtn.style.border = "1px solid #ccc";
  addBtn.style.borderRadius = "5px";
  addBtn.style.backgroundColor = "#f0f0f0";
  addBtn.style.cursor = "pointer";
  addBtn.onclick = () => {
    const container = document.querySelector('.canvas-container');
    createLayer(container, layers.length);
    activeLayerIndex = layers.length - 1;
    updateCanvasVisibility();
    renderLayerList();
    setDrawingMode(globalDrawingMode);
    setTimeout(() => setBrush(currentBrush), 0);
  };

  list.appendChild(addBtn);
}

layersTab.onclick = () => {
  layersPanel.classList.toggle("visible");
  renderLayerList();
  const disable = layersPanel.classList.contains("visible");
  document.querySelectorAll(".layer-canvas").forEach(c => {
    c.style.pointerEvents = disable ? "none" : "auto";
  });
};
// ================================
// 💾 7. Download Immagine Unificata
// ================================

downloadBtn.onclick = function () {
  downloadDropdown.style.display = (downloadDropdown.style.display === "block") ? "none" : "block";
};
document.addEventListener("click", function(e) {
  const downloadBtn = document.getElementById("download_tab");
  const downloadDropdown = document.getElementById("downloadDropdown");
  if (!downloadBtn.contains(e.target) && !downloadDropdown.contains(e.target)) {
    downloadDropdown.style.display = "none";
  }
});

document.querySelectorAll(".download-option").forEach(button => {
  button.addEventListener("click", function () {
    const format = this.getAttribute("value");
    const width = window.innerWidth;
    const height = window.innerHeight * 0.85;
    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = width;
    mergedCanvas.height = height;
    const ctx = mergedCanvas.getContext("2d");

    layers.forEach(layer => {
      if (!layer.visible) return;
      const layerEl = layer.canvas.lowerCanvasEl;
      ctx.drawImage(layerEl, 0, 0);
    });

    const dataURL = mergedCanvas.toDataURL(`image/${format}`, 1.0);
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `drawing.${format}`;
    link.click();
  });
});
window.onload = () => {
  initLayers();
};
