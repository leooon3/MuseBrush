// projects.js

import {
  layers,
  fitCanvasToContainer,
  updateCanvasVisibility,
  createBackgroundLayer,
  createLayer
} from './canvas.js';
import { attachCanvasEvents } from './events.js';
import { updateStates } from './state.js';
import { updateMenuHeight } from './ui.js';

/**
 * Loads a saved project into the canvas.
 * @param {Object} proj - The project data to load.
 */
export async function loadProject(proj) {
  const container = document.querySelector('.canvas-container');
  if (!container) {
    console.error('Container .canvas-container non trovato.');
    return;
  }

  // Clear current canvas and layer data
  container.innerHTML = '';
  layers.length = 0;

  // Create the background layer
  createBackgroundLayer(container);

  // Update global state with project info
  updateStates({
    activeLayerIndex: 0,
    currentProjectName: proj.name || proj.nome
  });

  // Load each layer
  proj.layers.forEach((layerData, idx) => {
    createLayer(container, idx);
    const layer = layers[idx];

    layer.name = layerData.name;
    layer.visible = !!layerData.visible;

    // Load layer content and clean up object fills
    layer.canvas.loadFromJSON(layerData.json, () => {
      layer.canvas.getObjects().forEach(obj => {
        // Set transparent fill if object had default fill
        if (['line', 'rect', 'circle', 'polygon'].includes(obj.type) &&
            (!obj.fill || obj.fill === 'rgba(0,0,0,1)')) {
          obj.set({ fill: 'transparent' });
        }
        if (obj.type === 'path') {
          obj.set({ fill: null });
        }
      });
      layer.canvas.renderAll();
      fitCanvasToContainer(layer.canvas);
      attachCanvasEvents(layer.canvas);
    });
  });

  updateCanvasVisibility();
  updateMenuHeight();
}