// actions.js
import { getActiveLayer } from './canvas.js';

/**
 * Perform a deep equality check between two objects or arrays
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (let k of ka)
    if (!kb.includes(k) || !deepEqual(a[k], b[k])) return false;
  return true;
}

/**
 * Save the current canvas state to the undo stack
 * If the state is different from the last one, push it and reset redo stack
 */
export function saveState() {
  const layer = getActiveLayer();
  if (!layer) {
    console.log('[saveState] no layer');
    return;
  }
  console.log('[saveState]');
  const cur = layer.canvas.toJSON();
  const last = layer.undoStack[layer.undoStack.length - 1];
  console.log('[saveState] last=', last, 'cur=', cur);
  if (!deepEqual(last, cur)) {
    layer.undoStack.push(cur);
    layer.redoStack.length = 0;
    console.log('[saveState] pushed, undo=', layer.undoStack.length);
  }
}

/**
 * Undo the last canvas action by reverting to the previous state
 */
export function undo() {
  const layer = getActiveLayer();
  console.log('[undo] undo=', layer.undoStack.length, 'redo=', layer.redoStack.length);
  if (layer && layer.undoStack.length > 1) {
    const curr = layer.undoStack.pop();
    layer.redoStack.push(curr);
    const prev = layer.undoStack[layer.undoStack.length - 1];
    console.log('[undo] prev=', prev);
    layer.canvas.loadFromJSON(prev, () => {
      layer.canvas.renderAll();
      console.log('[undo] done');
    });
  } else {
    console.log('[undo] none');
  }
}

/**
 * Redo the last undone action by applying the next state
 */
export function redo() {
  const layer = getActiveLayer();
  console.log('[redo] redo=', layer.redoStack.length);
  if (layer && layer.redoStack.length > 0) {
    const nxt = layer.redoStack.pop();
    console.log('[redo] nxt=', nxt);
    layer.canvas.loadFromJSON(nxt, () => {
      layer.canvas.renderAll();
      console.log('[redo] done');
    });
    layer.undoStack.push(nxt);
    console.log('[redo] pushed, undo=', layer.undoStack.length);
  } else {
    console.log('[redo] none');
  }
}

/**
 * Convert a screen pointer position to canvas coordinates
 * Takes zoom and viewport transform into account
 * @param {fabric.Canvas} canvas - The canvas to convert coordinates for
 * @param {{ x: number, y: number }} pointer - The raw pointer coordinates
 * @returns {{ x: number, y: number }} - The adjusted canvas coordinates
 */
export function fabricToCanvasCoords(canvas, pointer) {
  const vt   = canvas.viewportTransform;
  const zoom = canvas.getZoom();
  const x    = (pointer.x * zoom + vt[4]) / zoom;
  const y    = (pointer.y * zoom + vt[5]) / zoom;
  return { x: Math.floor(x), y: Math.floor(y) };
}
