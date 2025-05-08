import { layers } from './canvas.js';
import { initLayers } from './canvas.js';
import { setDrawingMode, setBrush } from './tool.js';
import {
  currentBrush,
  globalDrawingMode,
  setCurrentProjectName,
  setActiveLayerIndex
} from './state.js';
import { renderLayerList } from './layers.js';

export function setupNewCanvas() {
  const user = window.firebase?.auth().currentUser;
  if (!user || user.isAnonymous) {
    alert("🔒 Devi essere autenticato per creare un nuovo canvas.");
    return;
  }

  const confirmReset = confirm("⚠️ Vuoi davvero creare un nuovo canvas? Tutte le modifiche attuali andranno perse.");
  if (!confirmReset) return;

  const container = document.querySelector('.canvas-container');
  if (container) {
    container.innerHTML = '';
  }

  layers.length = 0;
  setActiveLayerIndex(0);
  setCurrentProjectName(null);

  initLayers(1);
  renderLayerList();
  setDrawingMode(globalDrawingMode);
  setBrush(currentBrush);

  alert("🆕 Nuovo canvas creato!");
}
