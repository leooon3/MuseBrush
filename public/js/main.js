import { authInit } from './auth.js';
import { initUIControls } from './ui.js';
import { initLayerPanel } from './layers.js';
import { initStorage } from './storage.js';
import { initGallery } from './gallery.js';
import { initExitHandlers } from './exit.js';
import { setupNewCanvas } from './canvas-utils.js';
import { updateMenuHeight } from './ui.js';
import { 
  updateStates, 
  currentBrush, 
  isPointerMode 
} from './state.js';
import { initLayers, layers, fitCanvasToContainer, updateCanvasVisibility } from './canvas.js';
import { attachCanvasEvents } from './events.js';
import { setDrawingMode, setBrush } from './tool.js';
import { initResponsiveMenus } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById("newCanvasBtn").onclick = setupNewCanvas;
  
  authInit();
  initUIControls();
  initLayerPanel();
  initStorage();
  initGallery();
  initExitHandlers();

  // Stato iniziale raggruppato
  updateStates({
    globalDrawingMode: true,
    isInsertingText: false,
    drawingShape: null
  });

  initLayers(1);

  setTimeout(() => {
    if (layers.length > 0) {
      updateStates({ activeLayerIndex: 0 });
      const firstLayer = layers[0];
      attachCanvasEvents(firstLayer.canvas);
      if (!isPointerMode) {
        setDrawingMode(true);
        setBrush(currentBrush);
      }
      updateCanvasVisibility();
    }
  }, 0);
    initResponsiveMenus();
});

document.addEventListener('DOMContentLoaded', function() {
  updateMenuHeight();
  window.addEventListener('resize', updateMenuHeight);
});

window.addEventListener('resize', () => {
  layers.forEach(layer => fitCanvasToContainer(layer.canvas));
});
