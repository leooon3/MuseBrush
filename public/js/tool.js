// tool.js

import { getActiveLayer, layers } from './canvas.js';
import {
  activeLayerIndex,
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

  const canvas = layer.canvas;
  // Rimuovo eventuali listener eraser precedenti per evitare duplicazioni
  canvas.off('path:created');

  let brush;
  const realColor = type === 'Eraser' ? 'rgba(0,0,0,0)' : brushColor;

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
      // Gomma: disabilito selezione e lascio il listener per rimuovere oggetti
      canvas.selection = false;
      canvas.skipTargetFind = true;
      canvas.getObjects().forEach(obj => {
        obj.selectable = false;
        obj.evented    = false;
      });
      brush = new fabric.PencilBrush(canvas);
      brush.width = brushSize;
      brush.color = 'rgba(0,0,0,0)';
      // Listener che rimuove oggetti intersecati al path creato
      canvas.on('path:created', function handleEraserPath(e) {
        const path = e.path;
        const toRemove = canvas.getObjects().filter(obj =>
          obj !== path && path.intersectsWithObject(obj)
        );
        toRemove.forEach(obj => canvas.remove(obj));
        canvas.remove(path);
        canvas.requestRenderAll();
      });
      break;
    default:
      // Se tipo non riconosciuto, fallback pencil
      brush = new fabric.PencilBrush(canvas);
      brush.width = brushSize;
      brush.color = brushColor;
  }

  // Applica il brush e attiva isDrawingMode se non in pointer mode
  canvas.freeDrawingBrush = brush;
  if (!getIsPointerMode()) {
    canvas.isDrawingMode = true;
  }
}

/**
 * setDrawingMode: abilita/disabilita la modalità di disegno sul layer attivo.
 * @param {boolean} active
 */
export function setDrawingMode(active) {
  const layer = layers[activeLayerIndex];
  if (!layer) return;

  const canvas = layer.canvas;
  const fillingNow = isFilling;
  const allowDraw = active && layer.visible && !getIsPointerMode();

  canvas.isDrawingMode = allowDraw && !drawingShape && !isInsertingText;
  canvas.selection      = !(canvas.isDrawingMode || fillingNow);
  canvas.skipTargetFind = canvas.isDrawingMode || fillingNow;

  // Aggiorna selettabilità degli oggetti
  canvas.getObjects().forEach(obj => {
    obj.selectable = canvas.selection;
    obj.evented    = canvas.selection;
  });

  // Aggiorna icona puntatore
  const pointerIcon = document.getElementById('pointerIcon');
  if (pointerIcon) {
    pointerIcon.src = active
      ? './images/pencil-icon.png'
      : './images/pointer-icon.png';
  }
}

/**
 * disableDrawingSilently: disabilita drawingMode su tutti i layer
 * senza modificare la UI (icone, dropdown, ecc.).
 */
export function disableDrawingSilently() {
  layers.forEach(({ canvas }) => {
    canvas.isDrawingMode = false;
  });
}
