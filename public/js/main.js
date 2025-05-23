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
 * Perform the full initialization of the app after DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Setup the "New Canvas" button
  const newCanvasBtn = document.getElementById('newCanvasBtn');
  if (newCanvasBtn) {
    newCanvasBtn.onclick = setupNewCanvas;
  }

  // Initialize authentication, UI controls, gallery, exit handlers, etc.
  authInit();
  initUIControls();
  initLayerPanel();
  initStorage();
  initGallery();
  initExitHandlers();

  // Set initial state values
  updateStates({
    globalDrawingMode: true,
    isInsertingText: false,
    drawingShape: null
  });

  // Create initial layer
  initLayers(1);

  // Setup drawing and event handling for the first layer
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

  // Setup responsive menu and layout handling
  initResponsiveMenus();
  updateMenuHeight();
  window.addEventListener('resize', updateMenuHeight);

  // Resize canvas on window resize
  window.addEventListener('resize', () => {
    layers.forEach(layer => fitCanvasToContainer(layer.canvas));
  });
});