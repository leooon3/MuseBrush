import { layers, fitCanvasToContainer, updateCanvasVisibility } from './canvas.js';
import { attachCanvasEvents } from './events.js';
import { updateStates } from './state.js';
import { updateMenuHeight } from './ui.js';
import { createBackgroundLayer } from './canvas.js';

export function loadProject(proj) {
  const container = document.querySelector('.canvas-container');
  container.innerHTML = '';
  createBackgroundLayer(container);
  layers.length = 0;
  updateStates({
    activeLayerIndex: 0,
    currentProjectName: proj.nome
  });
  proj.layers.forEach(layerData => {
    const layerCanvasEl = document.createElement('canvas');
    layerCanvasEl.classList.add('layer-canvas');
    layerCanvasEl.width = layerData.width || 1920;
    layerCanvasEl.height = layerData.height || 1080;
    const canvas = new fabric.Canvas(layerCanvasEl, {
      backgroundColor: 'transparent',
      width: layerCanvasEl.width,
      height: layerCanvasEl.height,
      preserveObjectStacking: true
    });
    container.appendChild(canvas.lowerCanvasEl);
    container.appendChild(canvas.upperCanvasEl);
    canvas.lowerCanvasEl.style.position = 'relative';
    canvas.upperCanvasEl.style.position = 'relative';
    layers.push({
      canvas: canvas,
      undoStack: [],
      redoStack: [],
      name: layerData.name,
      visible: layerData.visible
    });
    canvas.loadFromJSON(layerData.json, () => {
      canvas.getObjects().forEach(obj => {
        if (
          (['line','rect','circle','polygon'].includes(obj.type)) &&
          (!obj.fill || obj.fill === 'rgba(0,0,0,1)')
        ) {
          obj.set({ fill: 'transparent' });
        }
      });
      canvas.renderAll();
      fitCanvasToContainer(canvas);
      attachCanvasEvents(canvas);
    });
    canvas.getObjects().forEach(obj => {
      if (obj.type === 'path') obj.set({ fill: null });
    });
  });
  updateCanvasVisibility();
  updateMenuHeight();
}
