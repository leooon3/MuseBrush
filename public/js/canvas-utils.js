// canvas-utils.js

import { layers, initLayers } from './canvas.js';
import { setDrawingMode, setBrush } from './tool.js';
import { currentBrush, globalDrawingMode, updateStates } from './state.js';
import { renderLayerList } from './layers.js';

/**
 * Display a confirmation dialog with a message
 * @param {string} message - The message to display in the confirmation
 * @returns {Promise<boolean>} - Resolves with true if confirmed, false otherwise
 */
export function showConfirm(message) {
  return new Promise(resolve => {
    const result = window.confirm(message);
    resolve(result);
  });
}

/**
 * Clears existing canvas layers and initializes a new canvas session
 * Requires the user to be authenticated
 */
export async function setupNewCanvas() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert("🔒 Devi essere autenticato per creare un nuovo canvas.");
    return;
  }

  const confirmed = await showConfirm(
    "⚠️ Vuoi davvero creare un nuovo canvas? Tutte le modifiche attuali andranno perse."
  );
  if (!confirmed) return;

  // Reset the layers array
  layers.length = 0;
  initLayers(1);

  // Reset undo/redo stacks for all new layers
  layers.forEach(layer => {
    const initialState = layer.canvas.toJSON();
    layer.undoStack = [initialState];
    layer.redoStack = [];
  });

  // Reset application state to default
  updateStates({
    activeLayerIndex: 0,
    currentProjectName: null,
    globalDrawingMode: globalDrawingMode
  });

  // Update UI and enable drawing tools
  renderLayerList();
  setDrawingMode(globalDrawingMode);
  setBrush(currentBrush);

  alert("🆕 Nuovo canvas creato!");
}
