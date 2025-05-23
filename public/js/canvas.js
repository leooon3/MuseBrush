// canvas.js
import { currentBrush, brushColor, brushSize, globalDrawingMode,
         isFilling, isBucketActive, isInsertingText,
         drawingShape, previousDrawingMode, isDrawingShape,
         shapeObject, shapeOrigin, activeLayerIndex } from './state.js';
import { attachCanvasEvents } from './events.js';

export const layers = [];
const DEFAULT_CANVAS_WIDTH = 1920;
const DEFAULT_CANVAS_HEIGHT = 1080;
let backgroundCanvas = null;

export function getActiveLayer() {
  console.log('[getActiveLayer]', activeLayerIndex, 'of', layers.length);
  const layer = layers[activeLayerIndex];
  console.log('[getActiveLayer] returning', layer);
  return layer;
}

export function initLayers(count = 1) {
  const container = document.querySelector('.canvas-container');
  container.innerHTML = '';
  createBackgroundLayer(container);
  for (let i = 0; i < count; i++) createLayer(container, i);
  updateCanvasVisibility();
}

export function createLayer(container, index) {
  console.log('[createLayer] index =', index);
  if (!container) return;
  const canvasEl = document.createElement('canvas');
  canvasEl.width = DEFAULT_CANVAS_WIDTH;
  canvasEl.height = DEFAULT_CANVAS_HEIGHT;

  const layerCanvas = new fabric.Canvas(canvasEl, {
    isDrawingMode: index === 0,
    backgroundColor: 'transparent',
    preserveObjectStacking: true,
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT
  });

  layerCanvas.lowerCanvasEl.classList.add('layer-canvas');
  layerCanvas.upperCanvasEl.classList.add('layer-canvas');
  container.appendChild(layerCanvas.lowerCanvasEl);
  container.appendChild(layerCanvas.upperCanvasEl);

  const initialState = JSON.stringify(layerCanvas.toJSON());
  console.log('[createLayer] initialState =', initialState);
  layers.push({
    canvas: layerCanvas,
    undoStack: [initialState],
    redoStack: [],
    name: `Layer ${layers.length + 1}`,
    visible: true
  });
  console.log('[createLayer] layers.length =', layers.length);

  attachCanvasEvents(layerCanvas);
  fitCanvasToContainer(layerCanvas);
}

export function updateCanvasVisibility() {
  layers.forEach((layer, i) => {
    const canvas = layer.canvas;
    const isActive = i === activeLayerIndex;
    const fillingNow = isFilling && isBucketActive;
    canvas.isDrawingMode = isActive && globalDrawingMode && layer.visible && !fillingNow;
    canvas.selection = isActive && !fillingNow;
    canvas.skipTargetFind = fillingNow ? false : !canvas.selection;
    canvas.lowerCanvasEl.style.display = layer.visible ? 'block' : 'none';
    canvas.upperCanvasEl.style.display = isActive ? 'block' : 'none';
    canvas.getObjects().forEach(obj => {
      obj.selectable = canvas.selection;
      obj.evented = true;
    });
  });
}

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

export function fitCanvasToContainer(canvas) {
  const container = document.querySelector('.canvas-container');
  const cw = container.clientWidth;
  const ch = container.clientHeight - 40;
  const vw = canvas.getWidth();
  const vh = canvas.getHeight();
  const containerRatio = cw / ch;
  const canvasRatio = vw / vh;
  let scale, dw, dh, mx = 0, my = 20;
  if (containerRatio > canvasRatio) {
    scale = ch / vh;
    dw = vw * scale;
    dh = ch;
    mx = (cw - dw) / 2;
  } else {
    scale = cw / vw;
    dw = cw;
    dh = vh * scale;
    my += (ch - dh) / 2;
  }
  const corrected = scale / 1.25;
  [canvas.lowerCanvasEl, canvas.upperCanvasEl].forEach(el => {
    el.style.width = `${dw}px`;
    el.style.height = `${dh}px`;
    el.style.marginLeft = `${mx}px`;
    el.style.marginTop = `${my}px`;
  });
  canvas.setZoom(corrected);
  canvas.setViewportTransform([corrected, 0, 0, corrected, 0, 0]);
  canvas.renderAll();
}

export function getBackgroundCanvas() { return backgroundCanvas; }
export function createBackgroundLayer(container) {
  backgroundCanvas = new fabric.Canvas(document.createElement('canvas'), {
    backgroundColor: 'white', isDrawingMode: false,
    width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT,
    selection: false
  });
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