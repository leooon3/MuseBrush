import { getActiveLayer } from './canvas.js';

export function saveState() { // saves the action just made for undo and redo
  const layer = getActiveLayer();
  const current = JSON.stringify(layer.canvas);
  if (layer.undoStack[layer.undoStack.length - 1] !== current) {
    layer.undoStack.push(current);
    layer.redoStack.length = 0;
  }
}

export function undo() { //delete last action
  const layer = getActiveLayer();
  if (layer.undoStack.length > 1) {
    layer.redoStack.push(layer.undoStack.pop());
    const previous = layer.undoStack[layer.undoStack.length - 1];
    layer.canvas.loadFromJSON(previous, () => layer.canvas.renderAll());
  }
}

export function redo() { // make happen last action deleted
  const layer = getActiveLayer();
  if (layer.redoStack.length > 0) {
    const next = layer.redoStack.pop();
    layer.undoStack.push(next);
    layer.canvas.loadFromJSON(next, () => layer.canvas.renderAll());
  }
}

export function fabricToCanvasCoords(canvas, pointer) { // adapting the canvas coordinates
  const vt = canvas.viewportTransform;
  const zoom = canvas.getZoom();
  const x = (pointer.x * zoom + vt[4]) / zoom;
  const y = (pointer.y * zoom + vt[5]) / zoom;
  return { x: Math.floor(x), y: Math.floor(y) };
}