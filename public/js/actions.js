// actions.js

import { getActiveLayer } from './canvas.js';

/**
 * deepEqual: semplice confronto ricorsivo di oggetti/array.
 * @param {*} a 
 * @param {*} b 
 * @returns {boolean}
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null
   || typeof b !== 'object' || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

/**
 * saveState: salva lo stato corrente per le funzionalità di undo/redo.
 */
export function saveState() {
  const layer = getActiveLayer();

  // Serializziamo con toJSON(), non con JSON.stringify, per evitare riferimenti circolari
  const currentState = layer.canvas.toJSON();
  const lastState    = layer.undoStack[layer.undoStack.length - 1];

  // Confronto profondo degli oggetti JSON per decidere se pushare un nuovo snapshot
  if (!deepEqual(lastState, currentState)) {
    layer.undoStack.push(currentState);
    layer.redoStack.length = 0; // resetto il redoStack quando c'è una nuova azione
  }
}

/**
 * undo: torna allo stato precedente.
 */
export function undo() {
  const layer = getActiveLayer();
  if (layer.undoStack.length > 1) {
    // Sposto lo stato corrente nel redoStack
    layer.redoStack.push(layer.undoStack.pop());

    // Ripristino l’ultimo stato utile
    const previousState = layer.undoStack[layer.undoStack.length - 1];
    layer.canvas.loadFromJSON(previousState, () => {
      layer.canvas.renderAll();
    });
  }
}

/**
 * redo: riapplica l’ultima azione annullata.
 */
export function redo() {
  const layer = getActiveLayer();
  if (layer.redoStack.length > 0) {
    const nextState = layer.redoStack.pop();

    // Ripristino lo stato e lo salvo di nuovo nell’undoStack
    layer.canvas.loadFromJSON(nextState, () => {
      layer.canvas.renderAll();
    });
    layer.undoStack.push(nextState);
  }
}

/**
 * fabricToCanvasCoords: converte le coordinate del puntatore nelle coordinate del canvas,
 * tenendo conto di zoom e trasformazioni.
 * @param {fabric.Canvas} canvas
 * @param {{ x: number, y: number }} pointer
 * @returns {{ x: number, y: number }}
 */
export function fabricToCanvasCoords(canvas, pointer) {
  const vt   = canvas.viewportTransform;
  const zoom = canvas.getZoom();
  const x    = (pointer.x * zoom + vt[4]) / zoom;
  const y    = (pointer.y * zoom + vt[5]) / zoom;
  return { x: Math.floor(x), y: Math.floor(y) };
}
