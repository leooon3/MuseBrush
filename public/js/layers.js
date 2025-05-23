// layers.js

import {
  layers,
  createLayer,
  updateCanvasVisibility,
  updateCanvasStacking
} from './canvas.js';
import { setBrush, setDrawingMode } from './tool.js';
import {
  activeLayerIndex,
  currentBrush,
  globalDrawingMode,
  updateStates
} from './state.js';
import { showConfirm } from './canvas-utils.js';

const layersTab   = document.getElementById('layers_tab');
const layersPanel = document.getElementById('layersPanel');
const layersList  = document.getElementById('layersList');

/**
 * Render the list of layers in the UI and setup control buttons.
 */
export function renderLayerList() {
  if (!layersList) return;
  layersList.innerHTML = '';

  // Button to add a new layer
  const addBtn = document.createElement('button');
  addBtn.textContent  = '+ Nuovo Livello';
  addBtn.className    = 'add-layer-btn';
  addBtn.style.margin = '10px 0';
  addBtn.addEventListener('click', () => {
    const container = document.querySelector('.canvas-container');
    createLayer(container, layers.length);
    updateStates({ activeLayerIndex: layers.length - 1 });
    updateCanvasVisibility();
    renderLayerList();
    setBrush(currentBrush);
  });
  layersList.appendChild(addBtn);

  // Create each layer entry
  layers.forEach((layer, index) => {
    const li = document.createElement('li');
    li.className = index === activeLayerIndex ? 'active' : '';

    // Editable layer name
    const nameSpan = document.createElement('span');
    nameSpan.textContent  = layer.name;
    nameSpan.style.flexGrow = '1';
    nameSpan.style.cursor  = 'pointer';
    nameSpan.addEventListener('click', e => {
      e.stopPropagation();
      const newName = prompt('Nuovo nome per il layer:', layer.name);
      if (newName && newName.trim()) {
        layer.name = newName.trim();
        renderLayerList();
      }
    });
    li.appendChild(nameSpan);

    // Layer controls: up, down, visibility, delete
    const controls = document.createElement('div');
    controls.className = 'layer-controls';

    const upBtn = document.createElement('button');
    upBtn.textContent = '⬆️';
    upBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (index > 0) {
        [layers[index - 1], layers[index]] = [layers[index], layers[index - 1]];
        updateCanvasStacking();
        renderLayerList();
      }
    });
    controls.appendChild(upBtn);

    const downBtn = document.createElement('button');
    downBtn.textContent = '⬇️';
    downBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (index < layers.length - 1) {
        [layers[index + 1], layers[index]] = [layers[index], layers[index + 1]];
        updateCanvasStacking();
        renderLayerList();
      }
    });
    controls.appendChild(downBtn);

    const visBtn = document.createElement('button');
    visBtn.textContent = layer.visible ? '👁️' : '🚫';
    visBtn.addEventListener('click', e => {
      e.stopPropagation();
      layer.visible = !layer.visible;
      updateCanvasVisibility();
      renderLayerList();
    });
    controls.appendChild(visBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if (layers.length === 1) {
        return alert("Non puoi eliminare l'unico layer.");
      }
      const ok = await showConfirm(`Eliminare il layer "${layer.name}"?`);
      if (!ok) return;
      const container = document.querySelector('.canvas-container');
      container.removeChild(layer.canvas.lowerCanvasEl);
      container.removeChild(layer.canvas.upperCanvasEl);
      layers.splice(index, 1);
      const newIndex = Math.min(index, layers.length - 1);
      updateStates({ activeLayerIndex: newIndex });
      updateCanvasVisibility();
      renderLayerList();
      setBrush(currentBrush);
    });
    controls.appendChild(delBtn);

    li.appendChild(controls);

    // Selecting a layer
    li.addEventListener('click', () => {
      updateStates({ activeLayerIndex: index });
      updateCanvasVisibility();
      renderLayerList();
      setDrawingMode(globalDrawingMode && layer.visible);
      setTimeout(() => setBrush(currentBrush), 0);
    });

    layersList.appendChild(li);
  });
}

/**
 * Initialize the layer panel toggle button
 */
export function initLayerPanel() {
  if (!layersTab || !layersPanel) return;

  layersTab.addEventListener('click', () => {
    layersPanel.classList.toggle('visible');
    renderLayerList();
  });
}