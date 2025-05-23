// tool.js

import { getActiveLayer, layers } from './canvas.js';
import {
  getBrushColor,
  getBrushSize,
  getIsPointerMode,
  isFilling,
  isInsertingText,
  drawingShape,
  currentBrush,
  updateStates
} from './state.js';
import { saveState } from './actions.js';

/**
 * Set the current drawing brush on the active canvas layer.
 * @param {'Basic'|'Smooth'|'Thick'|'Spray'|'Dotted'|'Calligraphy'|'Eraser'|'PixelEraser'} type - The brush type to apply.
 */
export function setBrush(type) {
  const layer = getActiveLayer();
  if (!layer) return;
  const canvas = layer.canvas;

  canvas.isDrawingMode = false;
  canvas.off('path:created');

  const color = getBrushColor();
  const size  = getBrushSize();
  let brush;

  switch (type) {
    case 'Basic':
      brush = new fabric.PencilBrush(canvas);
      brush.color = color;
      brush.width = size;
      break;
    case 'Smooth':
      brush = new fabric.PencilBrush(canvas);
      brush.color = color;
      brush.width = size * 1.5;
      break;
    case 'Thick':
      brush = new fabric.PencilBrush(canvas);
      brush.color = color;
      brush.width = size * 3;
      break;
    case 'Spray':
      brush = new fabric.SprayBrush(canvas);
      brush.color = color;
      brush.width = size;
      brush.density = 20;
      break;
    case 'Dotted':
      brush = new fabric.CircleBrush(canvas);
      brush.color = color;
      brush.width = size;
      break;
    case 'Calligraphy':
      brush = new fabric.PencilBrush(canvas);
      brush.color = color;
      brush.width = size * 1.5;
      brush.strokeLineCap = 'square';
      break;
    case 'PixelEraser':
      brush = new fabric.PencilBrush(canvas);
      brush.color = '#ffffff';
      brush.width = size;
      break;
    case 'Eraser':
      brush = new fabric.PencilBrush(canvas);
      brush.color = 'rgba(0,0,0,0)';
      brush.width = size;
      canvas.on('path:created', e => {
        const path = e.path;
        layers.forEach(l => {
          l.canvas.getObjects().forEach(obj => {
            if (obj !== path && path.intersectsWithObject(obj)) {
              canvas.remove(obj);
            }
          });
        });
        canvas.remove(path);
        saveState();
      });
      break;
    default:
      brush = new fabric.PencilBrush(canvas);
      brush.color = color;
      brush.width = size;
  }

  updateStates({ currentBrush: type });
  canvas.freeDrawingBrush = brush;

  // Activate drawing mode if not in pointer or other special modes
  canvas.isDrawingMode = !getIsPointerMode() && !drawingShape && !isInsertingText && !isFilling;

  // Save state on drawing completion
  canvas.on('path:created', () => {
    saveState();
  });
}

/**
 * Enable or disable drawing mode on the current layer
 * @param {boolean} active - True to enable drawing mode
 */
export function setDrawingMode(active) {
  const layer = getActiveLayer();
  if (!layer) return;
  const canvas = layer.canvas;

  const allowDraw = active && layer.visible && !getIsPointerMode();
  const drawing = allowDraw && !drawingShape && !isInsertingText && !isFilling;

  canvas.isDrawingMode = drawing;
  canvas.selection = !drawing;
  canvas.skipTargetFind = drawing;

  canvas.getObjects().forEach(obj => {
    obj.selectable = !canvas.isDrawingMode;
    obj.evented = !canvas.isDrawingMode;
  });
}

/**
 * Clears all objects from the current layer canvas.
 */
export function clearCanvas() {
  const layer = getActiveLayer();
  if (!layer) return;
  const canvas = layer.canvas;
  canvas.clear();
  if (canvas.backgroundColor) {
    canvas.setBackgroundColor(canvas.backgroundColor, () => canvas.renderAll());
  }
}

/**
 * Disables drawing mode on all canvas layers silently.
 */
export function disableDrawingSilently() {
  layers.forEach(l => l.canvas.isDrawingMode = false);
}