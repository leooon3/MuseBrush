import { layers, fitCanvasToContainer } from './canvas.js';
import { updateCanvasVisibility } from './canvas.js';
import { attachCanvasEvents } from './events.js';
import { setCurrentProjectName, setActiveLayerIndex } from './state.js';

export function loadProject(proj) {
  const container = document.querySelector('.canvas-container');
  container.innerHTML = '';

  const overlay = document.createElement('canvas');
  overlay.id = 'eraser-preview';
  overlay.style.position = 'absolute';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.pointerEvents = 'none';
  overlay.width = window.innerWidth;
  overlay.height = window.innerHeight * 0.85;
  overlay.style.zIndex = 9999;
  container.appendChild(overlay);

  layers.length = 0;
  setActiveLayerIndex(0);
  setCurrentProjectName(proj.name);

  proj.layers.forEach((layerData, index) => {
    const layerCanvasEl = document.createElement('canvas');
    layerCanvasEl.classList.add('layer-canvas');

    const originalWidth = layerData.width || 1920;
    const originalHeight = layerData.height || 1080;
    layerCanvasEl.width = originalWidth;
    layerCanvasEl.height = originalHeight;

    const canvas = new fabric.Canvas(layerCanvasEl, {
      backgroundColor: index === 0 ? 'white' : 'transparent',
      width: originalWidth,
      height: originalHeight
    });

    container.appendChild(canvas.lowerCanvasEl);
    container.appendChild(canvas.upperCanvasEl);

    layers.push({
      canvas: canvas,
      undoStack: [],
      redoStack: [],
      name: layerData.name,
      visible: layerData.visible
    });

    canvas.loadFromJSON(layerData.json, () => {
      canvas.getObjects().forEach(obj => {
        if (obj.type === 'line' && obj.fill === null) {
          obj.set({ fill: 'transparent' });
        }
      });
      canvas.renderAll();
      fitCanvasToContainer(canvas);
      attachCanvasEvents(canvas);
    });

    // Fallback di sicurezza
    canvas.getObjects().forEach(obj => {
      if (obj.type === 'path') {
        obj.set({ fill: null });
      }
    });
  });

  updateCanvasVisibility();
}
