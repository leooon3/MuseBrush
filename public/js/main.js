// main.js

import { authInit } from './auth.js';
import { initUIControls, updateMenuHeight, initResponsiveMenus } from './ui.js';
import { initLayerPanel } from './layers.js';
import { initStorage } from './storage.js';
import { initGallery } from './gallery.js';
import { initExitHandlers } from './exit.js';
import { setupNewCanvas } from './canvas-utils.js';
import { updateStates, currentBrush, isPointerMode } from './state.js';
import { initLayers, layers, fitCanvasToContainer, updateCanvasVisibility } from './canvas.js';
import { attachCanvasEvents } from './events.js';
import { setDrawingMode, setBrush } from './tool.js';

/**
 * Initial setup after DOM is loaded.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // --- Gestione messaggio di login dal popup Google ---
  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'google-login' && event.data.uid) {
      // Salva uid e ricarica l’app
      localStorage.setItem('userId', event.data.uid);
      window.location.reload();
    }
  });
  // New canvas button
  const newCanvasBtn = document.getElementById('newCanvasBtn');
  if (newCanvasBtn) {
    newCanvasBtn.onclick = setupNewCanvas;
  }

  // Initialize services and UI
  authInit();
  initUIControls();
  initLayerPanel();
  initStorage();
  initGallery();
  initExitHandlers();

  // Initial state
  updateStates({
    globalDrawingMode: true,
    isInsertingText: false,
    drawingShape: null
  });

  // Initialize layers
  initLayers(1);

  // Setup first layer if exists
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

  // Responsive menus and layout
  initResponsiveMenus();
  updateMenuHeight();
  window.addEventListener('resize', updateMenuHeight);

  // Canvas resize on window resize
  window.addEventListener('resize', () => {
    layers.forEach(layer => fitCanvasToContainer(layer.canvas));
  });
});