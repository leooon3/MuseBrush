// canvas.js

import { currentBrush, brushColor, brushSize, globalDrawingMode,
         isFilling, isBucketActive, isInsertingText,
         drawingShape, previousDrawingMode, isDrawingShape,
         shapeObject, shapeOrigin,
         activeLayerIndex } from './state.js';
import { attachCanvasEvents } from './events.js';
import { setDrawingMode, setBrush } from './tool.js';

export const layers = [];
const DEFAULT_CANVAS_WIDTH = 1920;
const DEFAULT_CANVAS_HEIGHT = 1080;
let backgroundCanvas = null;

/**
 * Restituisce il layer attivo.
 */
export function getActiveLayer() {
  return layers[activeLayerIndex];
}

/**
 * Inizializza i layer (background + n layers utente).
 */
export function initLayers(initialLayerCount = 1) {
  const container = document.querySelector('.canvas-container');
  container.innerHTML = '';

  // 1️⃣ Background
  createBackgroundLayer(container);

  // 2️⃣ Layers utente
  for (let i = 0; i < initialLayerCount; i++) {
    createLayer(container, i);
  }

  updateCanvasVisibility();

  // 3️⃣ Imposta subito brush e modalità disegno
  setDrawingMode(globalDrawingMode);
  setBrush(currentBrush);

  // 4️⃣ Overlay per preview gomma
  const overlay = document.createElement('canvas');
  overlay.id = 'eraser-preview';
  Object.assign(overlay.style, {
    position: 'absolute',
    top: 0, left: 0,
    pointerEvents: 'none',
    zIndex: 9999
  });
  overlay.width = DEFAULT_CANVAS_WIDTH;
  overlay.height = DEFAULT_CANVAS_HEIGHT;
  container.appendChild(overlay);
}

/**
 * Crea il layer di sfondo (non presente in layers[]).
 */
export function createBackgroundLayer(container) {
  backgroundCanvas = new fabric.Canvas(document.createElement('canvas'), {
    backgroundColor: 'white',
    isDrawingMode: false,
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    selection: false
  });

  // Z-index iniziale e stili
  backgroundCanvas.lowerCanvasEl.style.zIndex = 0;
  backgroundCanvas.upperCanvasEl.style.zIndex = 0;
  backgroundCanvas.lowerCanvasEl.style.pointerEvents = 'none';
  backgroundCanvas.upperCanvasEl.style.pointerEvents = 'none';
  backgroundCanvas.lowerCanvasEl.classList.add('background-canvas');
  backgroundCanvas.upperCanvasEl.classList.add('background-canvas');

  container.appendChild(backgroundCanvas.lowerCanvasEl);
  container.appendChild(backgroundCanvas.upperCanvasEl);

  fitCanvasToContainer(backgroundCanvas);
}

/**
 * Crea un nuovo layer utente.
 */
export function createLayer(container, index) {
  if (!container) {
    console.error("❌ .canvas-container not found!");
    return;
  }

  const layerCanvas = new fabric.Canvas(document.createElement('canvas'), {
    isDrawingMode: index === 0 ? globalDrawingMode : false,
    backgroundColor: 'transparent',
    preserveObjectStacking: true,
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT
  });

  layerCanvas.lowerCanvasEl.classList.add('layer-canvas');
  layerCanvas.upperCanvasEl.classList.add('layer-canvas');
  container.appendChild(layerCanvas.lowerCanvasEl);
  container.appendChild(layerCanvas.upperCanvasEl);

  layers.push({
    canvas: layerCanvas,
    // Serializziamo lo stato iniziale con toJSON(), non JSON.stringify
    undoStack: [layerCanvas.toJSON()],
    redoStack: [],
    name: `Livello ${layers.length + 1}`,
    visible: true
  });

  attachCanvasEvents(layerCanvas);
  fitCanvasToContainer(layerCanvas);
}

/**
 * Aggiorna visibilità e modalità di ciascun layer.
 */
export function updateCanvasVisibility() {
  layers.forEach((layer, i) => {
    const canvas = layer.canvas;
    const isActive = i === activeLayerIndex;
    const zBase = i * 2;

    // Z-index e display
    canvas.lowerCanvasEl.style.zIndex = zBase;
    canvas.upperCanvasEl.style.zIndex = zBase + 1;
    canvas.lowerCanvasEl.style.display = layer.visible ? 'block' : 'none';
    canvas.upperCanvasEl.style.display = isActive ? 'block' : 'none';
    canvas.lowerCanvasEl.style.position = 'absolute';
    canvas.upperCanvasEl.style.position = 'absolute';

    // Modalità drawing/filling
    const fillingNow = isFilling && isBucketActive;
    canvas.isDrawingMode = isActive && globalDrawingMode && layer.visible && !fillingNow;
    canvas.selection = isActive && !fillingNow;
    canvas.skipTargetFind = fillingNow ? false : !canvas.selection;

    canvas.getObjects().forEach(obj => {
      obj.selectable = canvas.selection;
      obj.evented = true;
    });
  });
}

/**
 * Ricostruisce l’ordine dei canvas nel DOM.
 */
export function updateCanvasStacking() {
  const container = document.querySelector('.canvas-container');
  container.innerHTML = '';

  if (backgroundCanvas) {
    container.appendChild(backgroundCanvas.lowerCanvasEl);
    container.appendChild(backgroundCanvas.upperCanvasEl);
  }
  const overlay = document.getElementById('eraser-preview');
  if (overlay) container.appendChild(overlay);

  layers.forEach(layer => {
    container.appendChild(layer.canvas.lowerCanvasEl);
    container.appendChild(layer.canvas.upperCanvasEl);
  });

  updateCanvasVisibility();
}

/**
 * Adatta il canvas alle dimensioni del container, mantenendo proporzioni.
 */
export function fitCanvasToContainer(canvas) {
  const container = document.querySelector('.canvas-container');
  if (!container) return;

  const cw = container.clientWidth;
  const ch = container.clientHeight - 40;
  const vw = canvas.getWidth();
  const vh = canvas.getHeight();

  const containerRatio = cw / ch;
  const canvasRatio = vw / vh;
  let scale, dw, dh, mx = 0, my = 20;

  if (containerRatio > canvasRatio) {
    scale = ch / vh; dw = vw * scale; dh = ch;
    mx = (cw - dw) / 2;
  } else {
    scale = cw / vw; dw = cw; dh = vh * scale;
    my += (ch - dh) / 2;
  }

  // Compensa DPR simulato
  const corrected = scale / 1.25;

  [canvas.lowerCanvasEl, canvas.upperCanvasEl].forEach(el => {
    el.style.width  = `${dw}px`;
    el.style.height = `${dh}px`;
    el.style.marginLeft = `${mx}px`;
    el.style.marginTop  = `${my}px`;
  });

  canvas.setZoom(corrected);
  canvas.setViewportTransform([corrected, 0, 0, corrected, 0, 0]);
  canvas.renderAll();
}

/**
 * Ritorna il canvas di sfondo.
 */
export function getBackgroundCanvas() {
  return backgroundCanvas;
}
