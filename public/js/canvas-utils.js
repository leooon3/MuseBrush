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
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert("🔒 Devi essere autenticato per creare un nuovo canvas.");
    return;
  }

  if (!confirm("⚠️ Vuoi davvero creare un nuovo canvas? Tutte le modifiche attuali andranno perse.")) return;

  initLayers(1); // include già lo sfondo

  setActiveLayerIndex(0);
  setCurrentProjectName(null);
  renderLayerList();
  setDrawingMode(globalDrawingMode);
  setBrush(currentBrush);

  alert("🆕 Nuovo canvas creato!");
}
