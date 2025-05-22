// tool.js

import { getActiveLayer, layers } from './canvas.js';
import {
  currentBrush,
  brushColor,
  brushSize,
  isFilling,
  isInsertingText,
  drawingShape,
  globalDrawingMode,
  isDrawingShape,
  getIsPointerMode,
  updateStates
} from './state.js';

/**
 * setBrush: configura il pennello selezionato dall'utente.
 * Supporta diversi tipi, incluso eraser che rimuove gli oggetti intersecati.
 */
export function setBrush(type) {
  const layer = getActiveLayer();
  updateStates({ currentBrush: type });
  if (!layer || !layer.canvas) return;

  let brush = null;
  const realColor = type === 'Eraser' ? 'rgba(0,0,0,0)' : brushColor;
  const canvas = layer.canvas;

  switch (type) {
    case 'Basic':
      brush = new fabric.PencilBrush(canvas);
      brush.width = brushSize;
      brush.color = brushColor;
      break;
    case 'Smooth':
      brush = new fabric.PencilBrush(canvas);
      brush.width = brushSize * 1.5;
      brush.color = brushColor;
      break;
    case 'Thick':
      brush = new fabric.PencilBrush(canvas);
      brush.width = brushSize * 3;
      brush.color = brushColor;
      break;
    case 'Spray':
      brush = new fabric.SprayBrush(canvas);
      brush.width = brushSize;
      brush.density = 20;
      brush.color = realColor;
      break;
    case 'Calligraphy':
      brush = new fabric.PencilBrush(canvas);
      brush.width = brushSize * 1.5;
      brush.color = realColor;
      brush.strokeLineCap = 'square';
      break;
    case 'Dotted':
      brush = new fabric.CircleBrush(canvas);
      brush.width = brushSize;
      brush.color = realColor;
      break;
    case 'PixelEraser':
      brush = new fabric.PencilBrush(canvas);
      brush.width = brushSize;
      brush.color = 'white';
      break;
    case 'Eraser':
      // Modalità gomma: disabilita selezione e path di gomma rimuove oggetti
      canvas.selection = false;
      canvas.skipTargetFind = true;
      canvas.getObjects().forEach(obj => {
        obj.selectable = false;
        obj.evented = false;
      });
      brush = new fabric.PencilBrush(canvas);
      brush.width = brushSize;
      brush.color = 'rgba(0,0,0,0)';
      // Mantieni il listener attivo per tutta la sessione
      canvas.on('path:created', function handleEraserPath(e) {
        const path = e.path;
        const toRemove = canvas.getObjects().filter(obj => obj !== path && path.intersectsWithObject(obj));
        toRemove.forEach(obj => canvas.remove(obj));
        canvas.remove(path);
        canvas.requestRenderAll();
      });
      break;
  }

  if (brush) {
    canvas.freeDrawingBrush = brush;
    if (!getIsPointerMode()) {
      canvas.isDrawingMode = true;
    }
  }
}

/**
 * setDrawingMode: abilita/disabilita la modalità di disegno su tutti i layers.
 * @param {boolean} active
 */
export function setDrawingMode(active) {
  layers.forEach((layer, index) => {
    const isActive = index === activeLayerIndex;
    const canvas = layer.canvas;
    const fillingNow = isFilling;
    const drawing = isActive && active && layer.visible && !getIsPointerMode();

    canvas.isDrawingMode = drawing && !drawingShape && !isInsertingText;
    canvas.selection = !(drawing || fillingNow);
    canvas.skipTargetFind = drawing || fillingNow;

    canvas.getObjects().forEach(obj => {
      obj.selectable = canvas.selection;
    });
  });
  document.getElementById('pointerIcon').src =
    active ? './images/pencil-icon.png' : './images/pointer-icon.png';
}

/**
 * disableDrawingSilently: disabilita drawingMode senza alterare la UI.
 */
export function disableDrawingSilently() {
  layers.forEach(layer => {
    layer.canvas.isDrawingMode = false;
  });
}
