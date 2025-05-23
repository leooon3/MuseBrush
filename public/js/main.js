// main.js

import { authInit, updateAuthIcon } from './auth.js';
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

const backendUrl = 'https://musebrush.onrender.com';

/**
 * Initial setup after DOM is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('storage', event => {
  if (event.key === 'googleLoginUid' && event.newValue) {
    const uid = event.newValue;
    // Clear the storage key
    localStorage.removeItem('googleLoginUid');

    // Process login
    localStorage.setItem('userId', uid);
    updateAuthIcon(true);
    initGallery();
    // Reload page to finalize state
    window.location.reload();
  }
});
const urlParams = new URLSearchParams(window.location.search);
const uidFromQuery = urlParams.get('uid');
if (uidFromQuery) {
  localStorage.setItem('userId', uidFromQuery);
  updateAuthIcon(true);
  initGallery();
  window.history.replaceState({}, '', '/'); // pulisce la query
}
  registerMessageListener();
  setupNewCanvasButton();
  initializeServicesAndUI();
  initializeCanvasState();
  initializeResponsiveLayout();
});

/**
 * Listen for Google login messages from the popup and handle authentication.
 */
function registerMessageListener() {
  window.addEventListener('message', event => {
    if (event.origin !== backendUrl) return;

    const { type, uid } = event.data || {};
    if (type === 'google-login' && uid) {
      localStorage.setItem('userId', uid);
      updateAuthIcon(true);
      initGallery();
      window.location.reload();
    }
  });
}

/**
 * Attach event listener to the "New Canvas" button.
 */
function setupNewCanvasButton() {
  const btn = document.getElementById('newCanvasBtn');
  if (btn) btn.addEventListener('click', setupNewCanvas);
}

/**
 * Initialize authentication, UI controls, panels, and storage.
 */
function initializeServicesAndUI() {
  authInit();
  initUIControls();
  initLayerPanel();
  initStorage();
  initGallery();
  initExitHandlers();
}

/**
 * Set up canvas layers, state, and attach events.
 */
function initializeCanvasState() {
  updateStates({
    globalDrawingMode: true,
    isInsertingText: false,
    drawingShape: null,
  });

  initLayers(1);

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
}


/**
 * Handle responsive menus and canvas resizing on window events.
 */
function initializeResponsiveLayout() {
  initResponsiveMenus();
  updateMenuHeight();

  window.addEventListener('resize', () => {
    updateMenuHeight();
    layers.forEach(layer => fitCanvasToContainer(layer.canvas));
  });
}
