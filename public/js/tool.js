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
 * Applica il pennello selezionato o la gomma sul layer attivo.
 * @param {'Basic'|'Smooth'|'Thick'|'Spray'|'Dotted'|'Calligraphy'|'Eraser'|'PixelEraser'} type
 */
export function setBrush(type) {
  const layer = getActiveLayer();
  if (!layer) return;
  const canvas = layer.canvas;

  // Disabilita drawing mode e rimuove handler precedenti
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

  // Riattiva drawing mode se consentito
  canvas.isDrawingMode = !getIsPointerMode() && !drawingShape && !isInsertingText && !isFilling;

  // Riattacca saveState per tutti i brush (eccetto eraser gestito sopra)
  canvas.on('path:created', () => {
    saveState();
  });
}

/**
 * Abilita o disabilita la modalità di disegno sul layer attivo.
 * @param {boolean} active
 */
export function setDrawingMode(active) {
  const layer = getActiveLayer();
  if (!layer) return;
  const canvas = layer.canvas;

  const allowDraw = active && layer.visible && !getIsPointerMode();
  const drawing = allowDraw && !drawingShape && !isInsertingText && !isFilling;

  canvas.isDrawingMode = drawing;
  canvas.selection      = !drawing;
  canvas.skipTargetFind = drawing;

  canvas.getObjects().forEach(obj => {
    obj.selectable = !canvas.isDrawingMode;
    obj.evented    = !canvas.isDrawingMode;
  });
}

/**
 * Pulisce il contenuto del layer attivo e ripristina lo sfondo.
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
 * Disabilita drawing mode su tutti i layer.
 */
export function disableDrawingSilently() {
  layers.forEach(l => l.canvas.isDrawingMode = false);
}
