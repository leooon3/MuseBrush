import { initLayers } from './canvas.js';
import { loadProject } from './projects.js';
import { authInit } from './auth.js';
import { initAuthUI } from './auth-ui.js';
import { initUIControls } from './ui.js';
import { initLayerPanel } from './layers.js';
import { initStorage } from './storage.js';
import { initGallery } from './gallery.js';
import { initExitHandlers } from './exit.js';
import { setupNewCanvas } from './canvas-utils.js';


window.addEventListener('DOMContentLoaded', () => {
  document.getElementById("newCanvasBtn").onclick = setupNewCanvas;
  authInit();
  initAuthUI();
  initUIControls();
  initLayerPanel();
  initStorage();
  initGallery();
  initExitHandlers();

  initLayers(1);

  const autosave = JSON.parse(localStorage.getItem("autosaveProject") || "null");
  if (autosave && confirm("Hai un salvataggio automatico. Vuoi ripristinarlo?")) {
    loadProject(autosave);
  }
});
