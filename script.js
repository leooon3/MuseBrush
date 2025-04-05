// 🔥 Inizializzazione Firebase con supporto Auth
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


// 🔐 Controllo stato autenticazione

// 🛑 Blocca funzioni per anonimi
function disableSaveAndCollab() {
  ["saveCanvasBtn", "updateProjectBtn", "exportProjectBtn", "newCanvasBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
}

// ✅ Sblocca tutto per utenti autenticati
function enableFullAccess() {
  ["saveCanvasBtn", "updateProjectBtn", "exportProjectBtn", "newCanvasBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });
}

// 👤 Login/Registrazione UI
window.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    const authIcon = document.getElementById("authIcon");
  
    if (user) {
      const isAnon = user.isAnonymous;
      if (isAnon) {
        console.log("👤 Utente anonimo");
        disableSaveAndCollab();
        authIcon.src = "./images/user.png";
        authIcon.alt = "Account";
      } else {
        console.log("👤 Utente autenticato:", user.email);
        enableFullAccess();
        authIcon.src = "./images/user-auth.png"; // <-- icona per autenticati
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
      .then(() => alert("✅ Registrazione completata!"))
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
const database = firebase.database();

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
  const layerCanvasEl = document.createElement('canvas');
  layerCanvasEl.classList.add('layer-canvas');
  layerCanvasEl.width = DEFAULT_CANVAS_WIDTH;
  layerCanvasEl.height = DEFAULT_CANVAS_HEIGHT;  
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
  fitCanvasToContainer(layerCanvas);
}
function initLayers() {
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
          fill: null,
          selectable: true
        });
        shapeObject.set({ erasable: true });
        break;
    }
    if (shapeObject) canvas.add(shapeObject);
  });
  canvas.on('mouse:move', function(opt) {
    const overlay = document.getElementById('eraser-preview');
    if (!overlay) return; // PREVIENE L’ERRORE
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
    highlightTool('brushes_tab');
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
  addRecentColor(brushColor); // <-- AGGIUNTA
});
document.getElementById("authToggleBtn").onclick = () => {
  const modal = document.getElementById("authModal");
  modal.classList.toggle("hidden");
};
document.getElementById("logoutBtn").onclick = () => {
  auth.signOut();
};
window.onclick = function (event) {
  const modal = document.getElementById("authModal");
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
};
function addRecentColor(color) {
  if (recentColors.includes(color)) {
    // Sposta in cima se già esistente
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
      addRecentColor(color); // <-- FIX QUI
    };
    container.appendChild(btn);
  });
}
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
document.getElementById('eraser_tab').onclick = () => {
  globalDrawingMode = true;
  setDrawingMode(true);
  setBrush("Eraser");
  highlightTool('eraser_tab');
};
function highlightTool(buttonId) {
  // Rimuove lo stato attivo da tutti i tool
  document.querySelectorAll(".menu-left button").forEach(btn => {
    btn.classList.remove("tool-active");
  });
  // Aggiunge lo stato attivo al selezionato
  const btn = document.getElementById(buttonId);
  if (btn) btn.classList.add("tool-active");
}
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
// ================================
// 8. GALLERY
// ================================
const galleryBtn = document.getElementById("galleryBtn");
const galleryModal = document.getElementById("galleryModal");
const closeGalleryBtn = document.getElementById("closeGalleryBtn");
const saveCanvasBtn = document.getElementById("saveCanvasBtn");
const updateProjectBtn = document.getElementById("updateProjectBtn");
const projectList = document.getElementById("projectList");
const projectNameInput = document.getElementById("projectNameInput");
galleryBtn.onclick = () => {
  const user = firebase.auth().currentUser;

  if (user?.isAnonymous) {
    alert("🔒 Per accedere alla galleria, effettua prima il login o la registrazione.");
    return;
  }

  galleryModal.classList.remove("hidden");
  projectList.innerHTML = '';

  caricaProgettiFirebase(progetti => {
    if (!progetti) return projectList.innerHTML = '<p>Nessun progetto trovato.</p>';
    Object.values(progetti).forEach(progetto => {
      const div = document.createElement("div");
      div.className = "project";
      div.innerHTML = `
  <img src="${progetto.thumbnail || 'https://via.placeholder.com/150'}" 
       width="100" height="75" 
       style="border-radius:6px; margin-bottom:5px; object-fit:cover;" />
  <strong>${progetto.nome}</strong><br>
  <em>${new Date(progetto.dataCreazione).toLocaleString()}</em>
`;
      const loadBtn = document.createElement("button");
      loadBtn.textContent = "📂 Apri";
      loadBtn.onclick = () => {
        if (confirm(`Vuoi caricare "${progetto.nome}"?`)) {
          loadProjectFirebase(progetto);
          galleryModal.classList.add("hidden");
        }
      };
      
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️ Elimina";
      deleteBtn.onclick = () => {
        if (confirm(`Eliminare il progetto "${progetto.nome}"?`)) {
          deleteProjectFirebase(progetto.nome);
        }
      };
      
      div.appendChild(loadBtn);
      div.appendChild(deleteBtn);
      
      projectList.appendChild(div);
    });
  });
};



closeGalleryBtn.onclick = () => {
  galleryModal.classList.add("hidden");
};
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
saveCanvasBtn.onclick = () => {
  const nomeProgetto = projectNameInput.value.trim();
  if (!nomeProgetto) return alert("Inserisci un nome!");

  const layerData = layers.map(layer => ({
    name: layer.name,
    visible: layer.visible,
    json: layer.canvas.toJSON()
  }));

  salvaProgettoFirebase(nomeProgetto, layerData);
};


updateProjectBtn.onclick = () => {
  if (!currentProjectName) return;
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
  const layerData = layers.map(layer => ({
    name: layer.name,
    visible: layer.visible,
    json: layer.canvas.toJSON()
  }));
  const projects = JSON.parse(localStorage.getItem("savedProjects") || "[]");
  const updatedProjects = projects.filter(p => p.name !== currentProjectName);
  updatedProjects.unshift({ name: currentProjectName, image: dataURL, layers: layerData });
  localStorage.setItem("savedProjects", JSON.stringify(updatedProjects));
  renderProjectList();
  lastSavedState = getCurrentCanvasState();
  const confirmation = document.getElementById("saveConfirmation");
  confirmation.textContent = "✅ Progetto aggiornato!";
  confirmation.classList.remove("hidden");
  setTimeout(() => {
    confirmation.classList.add("hidden");
    confirmation.textContent = "✅ Progetto salvato!";
  }, 2000);
};
function renderProjectList() {
  projectList.innerHTML = "";
  recent.forEach(({ name, image, data }) => {
    const div = document.createElement("div");
    div.className = "project";
    div.innerHTML = `<strong>${name}</strong><br><img src="${image}" width="100" />`;
    div.onclick = () => {
      const confirmLoad = confirm(`Vuoi caricare il progetto "${name}"?`);
      if (!confirmLoad) return; // 🛑 Se annulla, non fare nulla
      loadProject(data);
      currentProjectName = name;
      galleryModal.classList.add("hidden");
    };    
    projectList.appendChild(div);
  });
}

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
        if (obj.type === 'line') {
          obj.set({ fill: null });  // ✅ rimuove eventuale riempimento
        }
      });
      canvas.renderAll();
      fitCanvasToContainer(canvas);
      attachCanvasEvents(canvas);
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
// ================================
// 📥 Salva progetto su Firebase (SOLO JSON)
// ================================
function salvaProgettoFirebase(nomeProgetto, layerData) {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Devi essere loggato per salvare.");
    return;
  }

  const userId = user.uid;
  const progettoRef = database.ref('progetti/' + userId + '/' + nomeProgetto);

  // 👉 Genera anteprima
  const width = 200;
  const height = 150;
  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = width;
  thumbCanvas.height = height;
  const ctx = thumbCanvas.getContext("2d");

  layers.forEach(layer => {
    if (!layer.visible) return;
    ctx.drawImage(layer.canvas.lowerCanvasEl, 0, 0, width, height);
  });

  const thumbnail = thumbCanvas.toDataURL("image/png");

  // 📦 Salva tutto
  progettoRef.set({
    nome: nomeProgetto,
    layers: layerData,
    dataCreazione: new Date().toISOString(),
    thumbnail: thumbnail
  })
  .then(() => {
    alert('✅ Progetto salvato su Firebase!');
  })
  .catch(err => {
    console.error(err);
    alert('Errore nel salvataggio su Firebase.');
  });
}



// ================================
// 📤 Carica progetti da Firebase
// ================================
function caricaProgettiFirebase(callback) {
  const user = firebase.auth().currentUser;
  if (!user) return callback(null);
  const userId = user.uid;
  database.ref('progetti/' + userId).once('value').then(snapshot => {
    const progetti = snapshot.val();
    callback(progetti);
  }).catch(err => console.error('Errore caricamento da Firebase:', err));
}


// ================================
// 🔄 Carica progetto specifico da Firebase
// ================================
function caricaProgettoFirebase(nomeProgetto, callback) {
  database.ref('progetti/' + nomeProgetto).once('value').then(snapshot => {
    const progetto = snapshot.val();
    callback(progetto);
  }).catch(err => console.error('Errore caricamento progetto:', err));
}

function loadProjectFirebase(progetto) {
  document.querySelector('.canvas-container').innerHTML = '';
  layers.length = 0;
  activeLayerIndex = 0;

  progetto.layers.forEach((layerData, index) => {
    const layerCanvasEl = document.createElement('canvas');
    layerCanvasEl.classList.add('layer-canvas');
    layerCanvasEl.width = DEFAULT_CANVAS_WIDTH;
    layerCanvasEl.height = DEFAULT_CANVAS_HEIGHT;

    const canvas = new fabric.Canvas(layerCanvasEl, {
      backgroundColor: index === 0 ? 'white' : 'transparent',
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT
    });

    document.querySelector('.canvas-container').appendChild(canvas.lowerCanvasEl);
    document.querySelector('.canvas-container').appendChild(canvas.upperCanvasEl);

    layers.push({
      canvas,
      undoStack: [],
      redoStack: [],
      name: layerData.name,
      visible: layerData.visible
    });

    canvas.loadFromJSON(layerData.json, () => {
      // ✅ FIX 1: rimuove fill anche da oggetti path
      canvas.getObjects().forEach(obj => {
        if (obj.type === 'line' || obj.type === 'path') {
          obj.set({ fill: null });
        }
      });

      canvas.renderAll();
      fitCanvasToContainer(canvas);
      attachCanvasEvents(canvas);
    });
  });

  updateCanvasVisibility();
  renderLayerList();
  setDrawingMode(true);
  setBrush(currentBrush);
}


function deleteProjectFirebase(nomeProgetto) {
  const user = firebase.auth().currentUser;
  if (!user) return alert("Devi essere loggato.");
  const userId = user.uid;
  const ref = database.ref('progetti/' + userId + '/' + nomeProgetto);
  ref.remove()
    .then(() => {
      alert(`✅ Progetto "${nomeProgetto}" eliminato.`);
      // Aggiorna la lista
      galleryBtn.click();
    })
    .catch(err => {
      console.error(err);
      alert("Errore durante l'eliminazione.");
    });
}

function getCurrentCanvasState() {
  return layers.map(layer => ({
    json: layer.canvas.toJSON(),
    visible: layer.visible,
    name: layer.name
  }));
}
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
let pendingUnload = false;
let unloadEvent = null;

window.addEventListener("beforeunload", (e) => {
  const currentState = getCurrentCanvasState();
  if (!lastSavedState || JSON.stringify(currentState) !== JSON.stringify(lastSavedState)) {
    e.preventDefault();
    e.returnValue = "";
    pendingUnload = true;
    unloadEvent = e;
    document.getElementById("exitModal").classList.remove("hidden");
    return "";
  }
});
document.getElementById("confirmSaveExitBtn").onclick = () => {
  galleryModal.classList.remove("hidden");
  document.getElementById("exitModal").classList.add("hidden");
};

document.getElementById("exitWithoutSavingBtn").onclick = () => {
  document.getElementById("exitModal").classList.add("hidden");
  pendingUnload = false;
  unloadEvent = null;
  window.onbeforeunload = null;
  window.location.href = window.location.href;
  // forza uscita
};

document.getElementById("cancelExitBtn").onclick = () => {
  document.getElementById("exitModal").classList.add("hidden");
  pendingUnload = false;
  unloadEvent = null;
};
window.onload = () => {
  initLayers();
  const autosave = JSON.parse(localStorage.getItem("autosaveProject") || "null");
if (autosave && confirm("Hai un salvataggio automatico. Vuoi ripristinarlo?")) {
  loadProject(autosave);
}
  addRecentColor(brushColor); // mostra il colore iniziale tra i recenti
};