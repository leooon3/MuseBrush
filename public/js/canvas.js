// ================================
// 2. Canvas Constants & Init
// ================================
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
export function getActiveLayer() {
  return layers[activeLayerIndex];
}

export function initLayers(initialLayerCount = 1) {
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
    createLayer(container, i);
  }

  updateCanvasVisibility();
  import('./tool.js').then(({ setDrawingMode, setBrush }) => {
    setDrawingMode(true);
    setBrush(currentBrush);
  });
}

export function createLayer(container, index) {
  if (!container) {
    console.error("❌ .canvas-container not found!");
    return;
  }

  const layerCanvas = new fabric.Canvas(document.createElement('canvas'), {
    isDrawingMode: index === 1,
    backgroundColor: index === 0 ? 'white' : 'transparent',
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

export function updateCanvasVisibility() {
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

export function fitCanvasToContainer(canvas) {
  const container = document.querySelector('.canvas-container');
  if (!container) return;

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight - 40; // lascia spazio per 20px sopra e sotto

  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  const containerRatio = containerWidth / containerHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let scale;
  let displayWidth;
  let displayHeight;
  let marginX = 0;
  let marginY = 20; // 20px top gap

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

  // Aggiorna dimensioni e margini DOM
  canvas.lowerCanvasEl.style.width = `${displayWidth}px`;
  canvas.lowerCanvasEl.style.height = `${displayHeight}px`;
  canvas.upperCanvasEl.style.width = `${displayWidth}px`;
  canvas.upperCanvasEl.style.height = `${displayHeight}px`;

  canvas.lowerCanvasEl.style.marginLeft = `${marginX}px`;
  canvas.upperCanvasEl.style.marginLeft = `${marginX}px`;
  canvas.lowerCanvasEl.style.marginTop = `${marginY}px`;
  canvas.upperCanvasEl.style.marginTop = `${marginY}px`;

  // Applica solo lo zoom
  canvas.setZoom(scale);
  canvas.setViewportTransform([scale, 0, 0, scale, 0, 0]);
  canvas.renderAll();
}








