// ================================
// 1. Firebase Config & Auth
// ================================
const firebaseConfig = {
  apiKey: "AIzaSyDT9cYP9h2Ywyhd1X3dABaYexpyTn9NyTo",
  authDomain: "musebrush-app.firebaseapp.com",
  databaseURL: "https://musebrush-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "musebrush-app",
  storageBucket: "musebrush-app.appspot.com",
  messagingSenderId: "53476649564",
  appId: "1:53476649564:web:c565c2d60ea36652ea1499"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

window.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    const authIcon = document.getElementById("authIcon");

    if (user) {
      if (!user.emailVerified && !user.isAnonymous) {
        alert("⚠️ Devi verificare la tua email prima di poter usare l'app.");
        disableSaveAndCollab();
        auth.signOut(); // logout automatico se non verificato
        return;
      }

      const isAnon = user.isAnonymous;
      if (isAnon) {
        console.log("👤 Utente anonimo");
        disableSaveAndCollab();
        authIcon.src = "./images/user.png";
        authIcon.alt = "Account";
      } else {
        console.log("👤 Utente autenticato:", user.email);
        enableFullAccess();
        authIcon.src = "./images/user-auth.png";
        authIcon.alt = "Utente autenticato";
      }
      document.getElementById("authModal").classList.add("hidden");
    } else {
      auth.signInAnonymously().catch(err => console.error("Errore login anonimo:", err));
    }
  });

  document.getElementById("loginBtn").onclick = () => {
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => alert("✅ Accesso effettuato!"))
      .catch(error => alert("Errore login: " + error.message));
  };

  document.getElementById("signupBtn").onclick = () => {
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        const user = userCredential.user;
        user.sendEmailVerification().then(() => {
          alert("📩 Registrazione completata! Ti abbiamo inviato un'email di verifica. Controlla la tua posta.");
          auth.signOut(); // Disconnette finché non verifica
        });
      })
      .catch(error => alert("Errore registrazione: " + error.message));
  };

  document.getElementById("googleLoginBtn").onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(result => {
        alert("✅ Accesso con Google riuscito: " + result.user.displayName);
        document.getElementById("authModal").classList.add("hidden");
      })
      .catch(error => {
        console.error(error);
        alert("Errore login con Google: " + error.message);
      });
  };

  document.getElementById("logoutBtn").onclick = () => {
    auth.signOut();
  };
});

document.getElementById("authToggleBtn").onclick = () => {
  const modal = document.getElementById("authModal");
  modal.classList.toggle("hidden");
};

window.onclick = function (event) {
  const modal = document.getElementById("authModal");
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
};

function disableSaveAndCollab() {
  ["saveCanvasBtn", "updateProjectBtn", "exportProjectBtn", "newCanvasBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
}

function enableFullAccess() {
  ["saveCanvasBtn", "updateProjectBtn", "exportProjectBtn", "newCanvasBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });
}

// ================================
// 2. Canvas Constants & Init
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
let isBucketActive = false;
const recentColors = [];
const maxRecentColors = 6;
let lastSavedState = null;
let currentProjectName = null;
const DEFAULT_CANVAS_WIDTH = 1920;
const DEFAULT_CANVAS_HEIGHT = 1080;

function getActiveLayer() {
  return layers[activeLayerIndex];
}

function createLayer(container, index) {
  if (!container) {
    console.error("❌ .canvas-container not found!");
    return;
  }
  const layerCanvasEl = document.createElement('canvas');
  layerCanvasEl.classList.add('layer-canvas');
  layerCanvasEl.width = DEFAULT_CANVAS_WIDTH;
  layerCanvasEl.height = DEFAULT_CANVAS_HEIGHT;
  const layerCanvas = new fabric.Canvas(layerCanvasEl, {
    isDrawingMode: index === 1,
    backgroundColor: index === 0 ? 'white' : 'transparent',
    preserveObjectStacking: true,
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
  fitCanvasToContainer(layerCanvas);
}

function initLayers(initialLayerCount = 1) {
  const overlay = document.createElement('canvas');
  overlay.id = 'eraser-preview';
  overlay.style.position = 'absolute';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.pointerEvents = 'none';
  overlay.width = DEFAULT_CANVAS_WIDTH;
  overlay.height = DEFAULT_CANVAS_HEIGHT;
  overlay.style.zIndex = 9999;
  document.querySelector('.canvas-container').appendChild(overlay);

  const container = document.querySelector('.canvas-container');

  for (let i = 0; i < initialLayerCount; i++) {
    createLayer(container, i); // 👈 creates N layers depending on parameter
  }

  updateCanvasVisibility();
  setDrawingMode(true);
  setBrush(currentBrush);
}


function fitCanvasToContainer(canvas) {
  const container = document.querySelector('.canvas-container');
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const scale = Math.min(
    containerWidth / canvasWidth,
    containerHeight / canvasHeight
  );
  canvas.setZoom(scale);
  canvas.setViewportTransform([scale, 0, 0, scale, 0, 0]);
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
// 3. Drawing Tools: Brush, Shapes, Text, Events
// ================================
function setBrush(type) {
  const layer = getActiveLayer();
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
      brush.width = brushSize * 1.5;
      brush.color = realColor;
      brush.strokeLineCap = 'square';
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
      brush.color = 'transparent';
      break;
  }
  if (brush) {
    layer.canvas.freeDrawingBrush = brush;
  }
}

function setDrawingMode(active) {
  layers.forEach((layer, i) => {
    const isActive = i === activeLayerIndex;
    const canvas = layer.canvas;
    canvas.isDrawingMode = isActive && active && layer.visible;
    canvas.selection = active; // 👈 disattiva selezione quando disegno OFF
    canvas.skipTargetFind = !active; // 👈 ignora oggetti cliccabili
  });

  document.getElementById('pointerIcon').src = active
    ? "./images/pencil-icon.png"
    : "./images/pointer-icon.png";
}


function disableDrawingSilently() {
  layers.forEach(layer => layer.canvas.isDrawingMode = false);
}
function isPathClosed(path) {
  if (!path.path || path.path.length < 2) return false;
  const first = path.path[0];
  const last = path.path[path.path.length - 1];
  const dx = Math.abs(first[1] - last[1]);
  const dy = Math.abs(first[2] - last[2]);
  return dx < 10 && dy < 10; // distanza tra inizio/fine per considerarlo chiuso
}

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
function fabricToCanvasCoords(canvas, pointer) {
  const vt = canvas.viewportTransform;
  const zoom = canvas.getZoom();
  const x = (pointer.x * zoom + vt[4]) / zoom;
  const y = (pointer.y * zoom + vt[5]) / zoom;
  return { x: Math.floor(x), y: Math.floor(y) };
}

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

    canvas.renderAll();
    saveState();
  });

  canvas.on('mouse:down', function(opt) {
    const pointer = canvas.getPointer(opt.e);
    if (currentBrush === 'PixelEraser') {
      canvas.contextTop.globalCompositeOperation = 'destination-out';
      canvas._isErasing = true;
    }
    if (isBucketActive) {
      const rawPointer = canvas.getPointer(opt.e);
      const { x, y } = fabricToCanvasCoords(canvas, rawPointer);
      const ctx = canvas.lowerCanvasEl.getContext("2d");
    
      if (!brushColor) {
        alert("⚠️ Seleziona un colore prima di usare il secchiello.");
        return;
      }
    
      const rgba = hexToRgba(brushColor);
      floodFill(canvas.lowerCanvasEl, x, y, rgba);
    
      canvas.requestRenderAll();
      saveState();
    
      isBucketActive = false;
      setDrawingMode(globalDrawingMode);
      setBrush(currentBrush);
      return;
    }    
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
          fill: 'transparent',
          stroke: brushColor || '#000000',
          strokeWidth: brushSize || 2,
          selectable: true
        });        
        break;
      case 'circle':
        shapeObject = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: 'transparent',
          stroke: brushColor || '#000000',
          strokeWidth: brushSize || 2,
          selectable: true
        });        
        break;
      case 'line':
        shapeObject = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: brushColor || '#000000',
          strokeWidth: brushSize || 2,
          fill: 'transparent',
          selectable: true
        });
        
        break;
    }
    if (shapeObject) {
      shapeObject.set({ erasable: true });
      canvas.add(shapeObject);
    }
  });

  canvas.on('mouse:move', function(opt) {
    const overlay = document.getElementById('eraser-preview');
    if (!overlay) return;
    const ctxOverlay = overlay.getContext('2d');
    ctxOverlay.clearRect(0, 0, overlay.width, overlay.height);

    if (currentBrush === 'PixelEraser') {
      const pointer = canvas.getPointer(opt.e, true);
      ctxOverlay.beginPath();
      ctxOverlay.arc(pointer.x, pointer.y, brushSize / 2, 0, 2 * Math.PI);
      ctxOverlay.fillStyle = 'rgba(0,0,0,0.2)';
      ctxOverlay.fill();
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
        const radius = Math.sqrt(
          Math.pow(pointer.x - shapeOrigin.x, 2) +
          Math.pow(pointer.y - shapeOrigin.y, 2)
        ) / 2;
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
// 4. UI Controls: Buttons, Dropdowns, Sliders
// ================================
const brushButton = document.getElementById("brushes_tab");
const brushDropdown = document.getElementById("brushDropdown");
const downloadBtn = document.getElementById("download_tab");
const downloadDropdown = document.getElementById("downloadDropdown");
const shapesButton = document.getElementById("shapes_tab");
const shapeDropdown = document.getElementById("shapeDropdown");
const eraserButton = document.getElementById("eraser_tab");
const eraserDropdown = document.getElementById("eraserDropdown");

eraserButton.onclick = () => {
  eraserDropdown.style.display = eraserDropdown.style.display === "block" ? "none" : "block";
};

downloadBtn.onclick = () => {
  downloadDropdown.style.display=downloadDropdown.style.display === "block" ? "none" : "block";
}
shapesButton.onclick = () => shapeDropdown.style.display = shapeDropdown.style.display === "block" ? "none" : "block";

document.querySelectorAll(".shape-option").forEach(button => {
  button.addEventListener("click", () => {
    drawingShape = button.getAttribute("data-shape");
    highlightTool('shapes_tab');
    previousDrawingMode = globalDrawingMode;
    setDrawingMode(false);
    shapeDropdown.style.display = "none";
  });
});

brushButton.onclick = () => brushDropdown.style.display = brushDropdown.style.display === "block" ? "none" : "block";

document.querySelectorAll(".brush-option").forEach(button => {
  button.addEventListener("click", () => {
    const selectedBrush = button.getAttribute("data");
    if (selectedBrush !== "Eraser") {
      currentBrush = selectedBrush;
    }
    setBrush(selectedBrush);
    if (selectedBrush !== "Eraser") {
      globalDrawingMode = true;
      setDrawingMode(true);
      document.getElementById('pointerIcon').src = "./images/pencil-icon.png";
    }
    highlightTool('brushes_tab');
    brushDropdown.style.display = "none";
  });
});

document.querySelectorAll(".eraser-option").forEach(button => {
  button.addEventListener("click", () => {
    const selected = button.getAttribute("data");
    globalDrawingMode = true;
    setDrawingMode(true);
    setBrush(selected);
    highlightTool("eraser_tab");
    eraserDropdown.style.display = "none";
  });
});

document.addEventListener("click", function (e) {
  if (!eraserButton.contains(e.target) && !eraserDropdown.contains(e.target)) {
    eraserDropdown.style.display = "none";
  }
});

document.getElementById('thicknessSlider').addEventListener('input', function () {
  brushSize = parseInt(this.value);
  setBrush(currentBrush);
});

document.getElementById('colorInput').addEventListener('input', function () {
  brushColor = this.value;
  setBrush(currentBrush);
  addRecentColor(brushColor);
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
  highlightTool('text_tab');
};
document.getElementById("bucket_tab").onclick = () => {
  isBucketActive = true;
  drawingShape = null;
  isInsertingText = false;
  setDrawingMode(false);
  highlightTool("bucket_tab");
};

function highlightTool(buttonId) {
  document.querySelectorAll(".menu-left button").forEach(btn => {
    btn.classList.remove("tool-active");
  });
  const btn = document.getElementById(buttonId);
  if (btn) btn.classList.add("tool-active");
}

function addRecentColor(color) {
  if (recentColors.includes(color)) {
    recentColors.splice(recentColors.indexOf(color), 1);
  }
  recentColors.unshift(color);
  if (recentColors.length > maxRecentColors) {
    recentColors.pop();
  }
  renderRecentColors();
}

function renderRecentColors() {
  const container = document.getElementById('recentColors');
  container.innerHTML = '';
  recentColors.forEach(color => {
    const btn = document.createElement('button');
    btn.style.backgroundColor = color;
    btn.title = color;
    btn.onclick = () => {
      brushColor = color;
      document.getElementById('colorInput').value = color;
      setBrush(currentBrush);
      addRecentColor(color);
    };
    container.appendChild(btn);
  });
}
document.addEventListener("click", function(e) {

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
})
// ================================
// 5. Layers: Add, Select, Rename, Delete
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
// 6. Project Save/Load/Export/Import (Local & Firebase)
// ================================
document.getElementById("exportProjectBtn").onclick = () => {
  const name = prompt("Nome file da esportare:", currentProjectName || "progetto-musebrush");
  if (!name) return;

  const data = {
    name: name,
    layers: layers.map(layer => ({
      name: layer.name,
      visible: layer.visible,
      json: layer.canvas.toJSON(),
      width: layer.canvas.getWidth(),
      height: layer.canvas.getHeight()
    }))
  };

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name + ".musebrush.json";
  link.click();
};

document.getElementById("importProjectInput").onchange = function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const proj = JSON.parse(event.target.result);
      if (!proj.layers) throw new Error("Formato non valido");

      if (confirm(`Vuoi caricare il progetto "${proj.name}"?`)) {
        loadProject(proj);
        currentProjectName = proj.name;
      }
    } catch (err) {
      alert("Errore nel caricamento del file: " + err.message);
    }
  };
  reader.readAsText(file);
};

function getCurrentCanvasState() {
  return layers.map(layer => ({
    json: layer.canvas.toJSON(),
    visible: layer.visible,
    name: layer.name
  }));
}

// ================================
// 7. Auth UI & State Handling
// ================================
document.getElementById("resendVerificationBtn").onclick = () => {
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    user.sendEmailVerification()
      .then(() => alert("📨 Email di verifica inviata di nuovo!"))
      .catch(err => alert("Errore: " + err.message));
  } else {
    alert("✅ La tua email è già verificata oppure non sei loggato.");
  }
};

document.getElementById("forgotPasswordBtn").onclick = () => {
  const email = document.getElementById("emailInput").value.trim();
  if (!email) {
    return alert("📧 Inserisci l'email con cui ti sei registrato.");
  }

  auth.sendPasswordResetEmail(email)
    .then(() => {
      alert("📬 Ti abbiamo inviato un'email per reimpostare la password.");
    })
    .catch(error => {
      alert("Errore: " + error.message);
    });
};

auth.onAuthStateChanged(user => {
  const authIcon = document.getElementById("authIcon");

  if (user) {
    if (!user.emailVerified && !user.isAnonymous) {
      alert("⚠️ Devi verificare la tua email prima di poter usare l'app.");
      disableSaveAndCollab();
      auth.signOut();
      return;
    }

    if (user.isAnonymous) {
      console.log("👤 Utente anonimo");
      disableSaveAndCollab();
      authIcon.src = "./images/user.png";
      authIcon.alt = "Account";
    } else {
      console.log("👤 Utente autenticato:", user.email);
      enableFullAccess();
      authIcon.src = "./images/user-auth.png";
      authIcon.alt = "Utente autenticato";
    }
    document.getElementById("authModal").classList.add("hidden");
  } else {
    auth.signInAnonymously().catch(err => console.error("Errore login anonimo:", err));
  }
});

document.getElementById("loginBtn").onclick = () => {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("✅ Accesso effettuato!"))
    .catch(error => alert("Errore login: " + error.message));
};

document.getElementById("signupBtn").onclick = () => {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      user.sendEmailVerification().then(() => {
        alert("📩 Registrazione completata! Ti abbiamo inviato un'email di verifica. Controlla la tua posta.");
        auth.signOut();
      });
    })
    .catch(error => alert("Errore registrazione: " + error.message));
};

document.getElementById("googleLoginBtn").onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      alert("✅ Accesso con Google riuscito: " + result.user.displayName);
      document.getElementById("authModal").classList.add("hidden");
    })
    .catch(error => {
      console.error(error);
      alert("Errore login con Google: " + error.message);
    });
};

document.getElementById("logoutBtn").onclick = () => {
  auth.signOut();
};

document.getElementById("authToggleBtn").onclick = () => {
  const modal = document.getElementById("authModal");
  modal.classList.toggle("hidden");
};

window.onclick = function (event) {
  const modal = document.getElementById("authModal");
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
};

function disableSaveAndCollab() {
  ["saveCanvasBtn", "updateProjectBtn", "exportProjectBtn", "newCanvasBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
}

function enableFullAccess() {
  ["saveCanvasBtn", "updateProjectBtn", "exportProjectBtn", "newCanvasBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });
}

// ================================
// 8. Gallery UI
// ================================
const galleryBtn = document.getElementById("galleryBtn");
const galleryModal = document.getElementById("galleryModal");
const galleryContent = document.getElementById("galleryContent");
const galleryCloseBtn = document.getElementById("galleryCloseBtn");
document.getElementById("saveCanvasBtn").onclick = () => {
  const name = document.getElementById("projectNameInput").value.trim();
  if (!name) return alert("📛 Inserisci un nome progetto prima di salvare.");
  salvaProgettoFirebase(name);
  currentProjectName = name;
  document.getElementById("saveConfirmation").classList.remove("hidden");
  setTimeout(() => {
    document.getElementById("saveConfirmation").classList.add("hidden");
  }, 2000);
};

document.getElementById("closeGalleryBtn").onclick = () => {
  document.getElementById("galleryModal").classList.add("hidden");
};


function salvaProgettoFirebase(nomeProgetto) {
  const utente = firebase.auth().currentUser;
  if (!utente || utente.isAnonymous) return alert("⚠️ Devi essere autenticato per salvare.");

  const preview = getActiveLayer().canvas.toDataURL({
    format: "jpeg",
    quality: 0.6,
    multiplier: 0.25
  });

  const progetto = {
    nome: nomeProgetto,
    layers: getCurrentCanvasState(),
    autore: utente.email,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    preview: preview
  };

  firebase.database().ref("progetti/" + utente.uid).push(progetto)
    .then(() => alert("✅ Progetto salvato nella galleria!"));
}
document.getElementById("updateProjectBtn").onclick = () => {
  const utente = firebase.auth().currentUser;
  if (!utente || utente.isAnonymous) return alert("⚠️ Devi essere autenticato per aggiornare.");

  const preview = getActiveLayer().canvas.toDataURL({
    format: "jpeg",
    quality: 0.6,
    multiplier: 0.25
  });

  const ref = firebase.database().ref("progetti/" + utente.uid);
  ref.orderByChild("nome").equalTo(currentProjectName).once("value", snapshot => {
    const updates = snapshot.val();
    if (!updates) return alert("⚠️ Progetto non trovato per aggiornamento.");

    const firstKey = Object.keys(updates)[0];
    const updated = {
      nome: currentProjectName,
      layers: getCurrentCanvasState(),
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      preview: preview
    };
    firebase.database().ref(`progetti/${utente.uid}/${firstKey}`).set(updated)
      .then(() => alert("✅ Progetto aggiornato!"));
  });
};


galleryBtn.onclick = () => {
  const user = firebase.auth().currentUser;

  if (!user || user.isAnonymous) {
    alert("🔒 Per accedere alla galleria, effettua prima il login o la registrazione.");
    return;
  }

  galleryModal.classList.remove("hidden");
  projectList.innerHTML = '<p>⏳ Caricamento...</p>';

  firebase.database().ref("progetti/" + user.uid).once("value")
    .then(snapshot => {
      const progetti = snapshot.val();
      projectList.innerHTML = '';

      if (!progetti) {
        projectList.innerHTML = '<p>📭 Nessun progetto trovato.</p>';
        return;
      }

      Object.entries(progetti).forEach(([id, progetto]) => {
        const div = document.createElement("div");
        div.className = "project";

        div.innerHTML = `
          <img src="${progetto.preview || 'https://via.placeholder.com/150'}"
               width="100" height="75"
               style="border-radius:6px; margin-bottom:5px; object-fit:cover;" />
          <strong>${progetto.nome}</strong><br>
          <em>${new Date(progetto.timestamp).toLocaleString()}</em>
        `;

        const loadBtn = document.createElement("button");
        loadBtn.textContent = "📂 Apri";
        loadBtn.onclick = () => {
          if (confirm(`Vuoi caricare "${progetto.nome}"?`)) {
            loadProject(progetto);
            currentProjectName = progetto.nome;
            galleryModal.classList.add("hidden");
          }
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️ Elimina";
        deleteBtn.onclick = () => {
          if (confirm(`Eliminare il progetto "${progetto.nome}"?`)) {
            firebase.database().ref("progetti/" + user.uid + "/" + id).remove()
              .then(() => {
                alert("✅ Progetto eliminato.");
                galleryBtn.click(); // ricarica lista
              });
          }
        };

        div.appendChild(loadBtn);
        div.appendChild(deleteBtn);

        projectList.appendChild(div);
      });
    });
};
function loadProject(proj) {
  // Pulisce i layer esistenti
  const container = document.querySelector('.canvas-container');
  container.innerHTML = '';
  const overlay = document.createElement('canvas');
  overlay.id = 'eraser-preview';
  overlay.style.position = 'absolute';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.pointerEvents = 'none';
  overlay.width = window.innerWidth;
  overlay.height = window.innerHeight * 0.85;
  overlay.style.zIndex = 9999;
  container.appendChild(overlay);
  container.appendChild(overlay);
  layers.length = 0;
  activeLayerIndex = 0;
  currentProjectName = proj.name;
  proj.layers.forEach((layerData, index) => {
    const layerCanvasEl = document.createElement('canvas');
    layerCanvasEl.classList.add('layer-canvas');
    const layerJSON = layerData.json;
    const originalWidth = layerJSON.width || DEFAULT_CANVAS_WIDTH;
    const originalHeight = layerJSON.height || DEFAULT_CANVAS_HEIGHT;
    layerCanvasEl.width = originalWidth;
    layerCanvasEl.height = originalHeight;       
    const canvas = new fabric.Canvas(layerCanvasEl, {
      backgroundColor: index === 0 ? 'white' : 'transparent',
      width: layerCanvasEl.width,
      height: layerCanvasEl.height
    });
    container.appendChild(canvas.lowerCanvasEl);
    container.appendChild(canvas.upperCanvasEl);
    layers.push({
      canvas: canvas,
      undoStack: [],
      redoStack: [],
      name: layerData.name,
      visible: layerData.visible
    });
    canvas.loadFromJSON(layerData.json, () => {
      // 🔧 FIX: forza tutte le linee ad avere fill null
      canvas.getObjects().forEach(obj => {
        if (obj.type === 'line' && obj.fill === null) {
          obj.set({ fill: 'transparent' });
        }        
      });
      canvas.renderAll();
      fitCanvasToContainer(canvas);
      attachCanvasEvents(canvas);
    });
    canvas.getObjects().forEach(obj => {
      if (obj.type === 'path') {
        obj.set({ fill: null }); // 💡 assicura che resti trasparente
      }
    });    

  });

  updateCanvasVisibility();
  renderLayerList();
  setDrawingMode(globalDrawingMode);
  setBrush(currentBrush);
  const width = window.innerWidth;
const height = window.innerHeight * 0.85;
const mergedCanvas = document.createElement("canvas");
mergedCanvas.width = width;
mergedCanvas.height = height;
const ctx = mergedCanvas.getContext("2d");
layers.forEach(layer => {
  if (!layer.visible) return;
  ctx.drawImage(layer.canvas.lowerCanvasEl, 0, 0);
});
const dataURL = mergedCanvas.toDataURL("image/png");

// aggiorna galleria (evita duplicati)
const recent = JSON.parse(sessionStorage.getItem("recentProjects") || "[]").filter(p => p.name !== proj.name);
recent.unshift({
  name: proj.name,
  image: dataURL,
  data: {
    name: proj.name,
    layers: proj.layers
  }
});

sessionStorage.setItem("recentProjects", JSON.stringify(recent));
renderProjectList();

}

galleryCloseBtn.onclick = () => galleryModal.classList.add("hidden");
function caricaProgettiFirebase() {
  const utente = firebase.auth().currentUser;
  if (!utente || utente.isAnonymous) return;

  const ref = firebase.database().ref("progetti/" + utente.uid);
  ref.once("value", (snapshot) => {
    const progetti = snapshot.val();
    const content = document.getElementById("galleryContent");
    content.innerHTML = "";

    if (!progetti) {
      content.innerHTML = "<p>Nessun progetto trovato.</p>";
      return;
    }

    Object.entries(progetti).forEach(([id, proj]) => {
      const div = document.createElement("div");
      div.classList.add("gallery-item");

      const preview = document.createElement("img");
      preview.src = proj.preview || "./images/placeholder.png";
      preview.alt = proj.nome;
      preview.style.maxWidth = "100%";

      const name = document.createElement("p");
      name.textContent = proj.nome;

      const timestamp = document.createElement("p");
      const date = new Date(proj.timestamp);
      timestamp.textContent = date.toLocaleString();

      const loadBtn = document.createElement("button");
      loadBtn.textContent = "Carica";
      loadBtn.onclick = () => loadProjectFirebase(id, proj);

      const delBtn = document.createElement("button");
      delBtn.textContent = "Elimina";
      delBtn.onclick = () => deleteProjectFirebase(id, proj.nome);

      div.appendChild(preview);
      div.appendChild(name);
      div.appendChild(timestamp);
      div.appendChild(loadBtn);
      div.appendChild(delBtn);

      content.appendChild(div);
    });
  });
}

function loadProjectFirebase(id, proj) {
  if (confirm(`Vuoi caricare il progetto "${proj.nome}"?`)) {
    loadProject(proj);
    currentProjectName = proj.nome;
    localStorage.setItem("autosaveProject", JSON.stringify(proj));
    document.getElementById("galleryModal").classList.add("hidden");
  }
}

function deleteProjectFirebase(id, name) {
  const utente = firebase.auth().currentUser;
  if (!utente) return;
  if (confirm(`Eliminare definitivamente "${name}"?`)) {
    firebase.database().ref("progetti/" + utente.uid + "/" + id).remove()
      .then(() => {
        alert("🗑️ Progetto eliminato");
        caricaProgettiFirebase();
      });
  }
}

document.getElementById("galleryBtn").onclick = () => {
  if (firebase.auth().currentUser?.isAnonymous) {
    alert("⚠️ Devi essere autenticato per vedere la galleria.");
    return;
  }
  document.getElementById("galleryModal").classList.remove("hidden");
  caricaProgettiFirebase();
};

function hexToRgba(hex) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255,
    255
  ];
}

function getPixelColor(imgData, x, y) {
  const index = (y * imgData.width + x) * 4;
  return imgData.data.slice(index, index + 4);
}

function setPixelColor(imgData, x, y, [r, g, b, a]) {
  const index = (y * imgData.width + x) * 4;
  imgData.data[index] = r;
  imgData.data[index + 1] = g;
  imgData.data[index + 2] = b;
  imgData.data[index + 3] = a;
}

function colorsMatch(a, b, tolerance = 32) {
  return Math.abs(a[0] - b[0]) < tolerance &&
         Math.abs(a[1] - b[1]) < tolerance &&
         Math.abs(a[2] - b[2]) < tolerance &&
         Math.abs(a[3] - b[3]) < tolerance;
}

function floodFill(canvasEl, x, y, fillColor) {
  const ctx = canvasEl.getContext("2d");
  const imgData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
  const targetColor = getPixelColor(imgData, x, y);

  if (colorsMatch(targetColor, fillColor)) return;

  const stack = [[x, y]];
  const visited = new Set();

  while (stack.length) {
    const [px, py] = stack.pop();
    const key = px + "," + py;
    if (visited.has(key)) continue;
    visited.add(key);

    if (px < 0 || py < 0 || px >= imgData.width || py >= imgData.height) continue;

    const currentColor = getPixelColor(imgData, px, py);
    if (!colorsMatch(currentColor, targetColor)) continue;

    setPixelColor(imgData, px, py, fillColor);
    stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
  }

  ctx.putImageData(imgData, 0, 0);
}

// ================================
// 9. Exit Modal & Window Events
// ================================
window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  e.returnValue = '';
});

document.getElementById("exitWithoutSavingBtn").onclick = () => {
  window.removeEventListener("beforeunload", () => {});
  window.location.reload();
};

document.getElementById("cancelExitBtn").onclick = () => {
  document.getElementById("exitModal").classList.add("hidden");
};

document.getElementById("confirmSaveExitBtn").onclick = () => {
  const name = prompt("Inserisci il nome del progetto prima di uscire:", currentProjectName || "progetto-musebrush");
  if (name) {
    salvaProgettoFirebase(name);
    window.removeEventListener("beforeunload", () => {});
    window.location.reload();
  }
};

// ================================
// 10. App Init on Load
// ================================
window.onload = () => {
  const container = document.querySelector('.canvas-container');
  if (!container) {
    console.error("❌ canvas-container non trovato nel DOM!");
    return;
  }
  initLayers(1);
  const autosave = JSON.parse(localStorage.getItem("autosaveProject") || "null");
  if (autosave && confirm("Hai un salvataggio automatico. Vuoi ripristinarlo?")) {
    loadProject(autosave);
  }
};
