import {
  currentBrush, brushColor, brushSize, globalDrawingMode,
  isFilling, isBucketActive, isInsertingText,
  drawingShape, previousDrawingMode, isDrawingShape,
  shapeObject, shapeOrigin
} from './state.js';
import { attachCanvasEvents } from './events.js';
import { activeLayerIndex } from './state.js';

export const layers = [];
const DEFAULT_CANVAS_WIDTH = 1920;
const DEFAULT_CANVAS_HEIGHT = 1080;
let backgroundCanvas = null;
export function getActiveLayer() {  // return the active layer for functions
  return layers[activeLayerIndex];
}
export function initLayers(initialLayerCount = 1) { //functions for starting the layers
  const container = document.querySelector('.canvas-container');
  container.innerHTML = '';

  createBackgroundLayer(container); // 🎯 Sfondo prima di tutto

  for (let i = 0; i < initialLayerCount; i++) {
    createLayer(container, i);
  }

  updateCanvasVisibility();
  import('./tool.js').then(({ setDrawingMode, setBrush }) => {
    setDrawingMode(true);
    setBrush(currentBrush);
  });

  // Overlay per anteprima gomma
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
export function createBackgroundLayer(container) { // creates the background that is not in the layers array
  backgroundCanvas = new fabric.Canvas(document.createElement('canvas'), {
    backgroundColor: 'white',
    isDrawingMode: false,
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
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
export function createLayer(container, index) { // create layer
  if (!container) {
    console.error("❌ .canvas-container not found!");
    return;
  }

  const layerCanvas = new fabric.Canvas(document.createElement('canvas'), {
    isDrawingMode: index === 1,
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
    undoStack: [JSON.stringify(layerCanvas)],
    redoStack: [],
    name: `Livello ${layers.length + 1}`,
    visible: true
  });

  attachCanvasEvents(layerCanvas);
  fitCanvasToContainer(layerCanvas);
}
export function updateCanvasVisibility() { // makes sure i see the right canva
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

    canvas.lowerCanvasEl.style.opacity = 1;
    canvas.upperCanvasEl.style.opacity = 1;

    canvas.lowerCanvasEl.classList.toggle('active', isActive);
    canvas.upperCanvasEl.classList.toggle('active', isActive);

    const isFillingNow = isFilling && isBucketActive;
    canvas.upperCanvasEl.style.pointerEvents = isFillingNow ? 'none' : 'auto';

    canvas.isDrawingMode = isActive && globalDrawingMode && layer.visible && !isFillingNow;
    canvas.selection = isActive && !isFillingNow;
    canvas.skipTargetFind = isFilling && isBucketActive ? false : !canvas.selection;

    canvas.getObjects().forEach(obj => {
      obj.selectable = canvas.selection;
      obj.evented = true;
    });
  });
}
export function updateCanvasStacking() { 
  const container = document.querySelector('.canvas-container');
  container.innerHTML = '';

  // 🔁 Aggiungi sfondo prima
  if (backgroundCanvas) {
    container.appendChild(backgroundCanvas.lowerCanvasEl);
    container.appendChild(backgroundCanvas.upperCanvasEl);
  }

  const overlay = document.getElementById('eraser-preview');
  if (overlay) container.appendChild(overlay);

  layers.forEach((layer) => {
    container.appendChild(layer.canvas.lowerCanvasEl);
    container.appendChild(layer.canvas.upperCanvasEl);
  });

  updateCanvasVisibility();
}
export function fitCanvasToContainer(canvas) {
  const container = document.querySelector('.canvas-container');
  if (!container) return;

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight - 40;

  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  const containerRatio = containerWidth / containerHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let scale;
  let displayWidth;
  let displayHeight;
  let marginX = 0;
  let marginY = 20;

  if (containerRatio > canvasRatio) {
    scale = containerHeight / canvasHeight;
    displayWidth = canvasWidth * scale;
    displayHeight = containerHeight;
    marginX = (containerWidth - displayWidth) / 2;
  } else {
    scale = containerWidth / canvasWidth;
    displayWidth = containerWidth;
    displayHeight = canvasHeight * scale;
    marginY += (containerHeight - displayHeight) / 2;
  }

  // ✅ FORZA simulazione DPI 1.25 su tutti gli schermi
  const simulatedDeviceRatio = 1.25;
  const correctedScale = scale / simulatedDeviceRatio;

  canvas.lowerCanvasEl.style.width = `${displayWidth}px`;
  canvas.lowerCanvasEl.style.height = `${displayHeight}px`;
  canvas.upperCanvasEl.style.width = `${displayWidth}px`;
  canvas.upperCanvasEl.style.height = `${displayHeight}px`;

  canvas.lowerCanvasEl.style.marginLeft = `${marginX}px`;
  canvas.upperCanvasEl.style.marginLeft = `${marginX}px`;
  canvas.lowerCanvasEl.style.marginTop = `${marginY}px`;
  canvas.upperCanvasEl.style.marginTop = `${marginY}px`;

  canvas.setZoom(correctedScale);
  canvas.setViewportTransform([correctedScale, 0, 0, correctedScale, 0, 0]);
  canvas.renderAll();
}
export function getBackgroundCanvas() {
  return backgroundCanvas;
}
