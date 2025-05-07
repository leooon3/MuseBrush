import { authInit } from './auth.js';
import { initAuthUI } from './auth-ui.js';
import { initUIControls } from './ui.js';
import { initLayerPanel } from './layers.js';
import { initStorage } from './storage.js';
import { initGallery } from './gallery.js';
import { initExitHandlers } from './exit.js';
import { setupNewCanvas } from './canvas-utils.js';
import { updateMenuHeight } from './ui.js';
import { 
  setGlobalDrawingMode, 
  setIsInsertingText, 
  setDrawingShape, 
  setActiveLayerIndex,
  currentBrush 
} from './state.js';
import { initLayers, layers, fitCanvasToContainer, updateCanvasVisibility } from './canvas.js';
import { attachCanvasEvents } from './events.js';
import { setDrawingMode, setBrush } from './tool.js';

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById("newCanvasBtn").onclick = setupNewCanvas;

  authInit();
  initAuthUI();
  initUIControls();
  initLayerPanel();
  initStorage();
  initGallery();
  initExitHandlers();

  // Settiamo prima lo stato globale
  setGlobalDrawingMode(true);
  setIsInsertingText(false);
  setDrawingShape(null);

  initLayers(1);

  setTimeout(() => {
    if (layers.length > 0) {
      setActiveLayerIndex(0);
      const firstLayer = layers[0];
      attachCanvasEvents(firstLayer.canvas);
      setDrawingMode(true);
      setBrush(currentBrush);
      updateCanvasVisibility();
    }
  }, 0);
});

document.addEventListener('DOMContentLoaded', function() {
  updateMenuHeight();
  window.addEventListener('resize', updateMenuHeight);
});

window.addEventListener('resize', () => {
  layers.forEach(layer => fitCanvasToContainer(layer.canvas));
});
