// canvas-utils.js

import { layers, initLayers } from './canvas.js';
import { setDrawingMode, setBrush } from './tool.js';
import { currentBrush, globalDrawingMode, updateStates } from './state.js';
import { renderLayerList } from './layers.js';

/**
 * showConfirm: Promise-based wrapper per dialog di conferma.
 * Sostituisci con un modal custom se preferisci.
 * @param {string} message - Testo del dialog.
 * @returns {Promise<boolean>}
 */
export function showConfirm(message) {
  return new Promise(resolve => {
    const result = window.confirm(message);
    resolve(result);
  });
}

/**
 * setupNewCanvas: elimina il canvas corrente e ne crea uno nuovo.
 * - Verifica autenticazione
 * - Chiede conferma all'utente
 * - Inizializza un nuovo layer
 * - Resetta undo/redo stack per ogni layer
 * - Aggiorna lo stato e la UI
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

  // Svuota i layers e reinizializza uno nuovo
  layers.length = 0;
  initLayers(1);

  // Reset undo/redo stack a stato iniziale per ogni layer
  layers.forEach(layer => {
    const initialState = layer.canvas.toJSON();
    layer.undoStack = [initialState];
    layer.redoStack = [];
  });

  // Aggiorna lo stato globale dell'app
  updateStates({
    activeLayerIndex: 0,
    currentProjectName: null,
    globalDrawingMode: globalDrawingMode
  });

  // Aggiorna la lista dei layers e la modalità di disegno
  renderLayerList();
  setDrawingMode(globalDrawingMode);
  setBrush(currentBrush);

  alert("🆕 Nuovo canvas creato!");
}
