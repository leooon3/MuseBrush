// ================================
// 3. Drawing Tools: Brush, Shapes, Text, Events
// ================================
import { getActiveLayer } from './canvas.js';
import {
  currentBrush, brushColor, brushSize, isFilling, isInsertingText,
  drawingShape, globalDrawingMode, isDrawingShape,
  setCurrentBrush, setIsDrawingShape
} from './state.js';

export function setBrush(type) {
  const layer = getActiveLayer();
  setCurrentBrush(type);

  if (!layer.canvas.isDrawingMode) return;

  let brush = null;
  const realColor = type === 'Eraser' ? 'rgba(0,0,0,0)' : brushColor;

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
      brush.color = 'rgba(0,0,0,0)';
      break;
  }

  if (brush) {
    layer.canvas.freeDrawingBrush = brush;
  }
}

export function setDrawingMode(active) {
  import('./canvas.js').then(({ layers, activeLayerIndex }) => {
    layers.forEach((layer, i) => {
      const isActive = i === activeLayerIndex;
      const canvas = layer.canvas;
      const isDrawing = isActive && active && layer.visible;
      const isFillingNow = isFilling;

      canvas.isDrawingMode = isDrawing && !drawingShape && !isInsertingText;
      canvas.selection = !(isDrawing || isFillingNow);
      canvas.skipTargetFind = isDrawing || isFillingNow;

      canvas.getObjects().forEach(obj => {
        obj.selectable = !(isDrawing || isFillingNow);
      });
    });
  });

  document.getElementById('pointerIcon').src = active
    ? './images/pencil-icon.png'
    : './images/pointer-icon.png';
}

export function disableDrawingSilently() {
  import('./canvas.js').then(({ layers }) => {
    layers.forEach(layer => layer.canvas.isDrawingMode = false);
  });
}
