import { layers } from './canvas.js';
import { initLayers } from './canvas.js';
import { setDrawingMode, setBrush } from './tool.js';
import {
  currentBrush,
  globalDrawingMode,
  updateStates
} from './state.js';
import { renderLayerList } from './layers.js';

export function setupNewCanvas() { // the function to eliminate everything and restart everything
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert("🔒 Devi essere autenticato per creare un nuovo canvas.");
    return;
  }

  if (!confirm("⚠️ Vuoi davvero creare un nuovo canvas? Tutte le modifiche attuali andranno perse.")) return;
  layers.length = 0;
  initLayers(1);

  updateStates({
    activeLayerIndex: 0,
    currentProjectName: null,
    globalDrawingMode: globalDrawingMode
  });

  renderLayerList();
  setDrawingMode(globalDrawingMode);
  setBrush(currentBrush);

  alert("🆕 Nuovo canvas creato!");
}
