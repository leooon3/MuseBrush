// layers.js

import {
  layers,
  createBackgroundLayer,
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

const layersTab    = document.getElementById('layers_tab');
const layersPanel  = document.getElementById('layersPanel');
const layersList   = document.getElementById('layersList');

/**
 * Ricostruisce la lista dei layer nel pannello.
 */
export function renderLayerList() {
  if (!layersList) return;
  layersList.innerHTML = '';

  // ➕ Pulsante “Nuovo Livello”
  const addBtn = document.createElement('button');
  addBtn.textContent   = '+ Nuovo Livello';
  addBtn.className     = 'add-layer-btn';
  addBtn.style.margin  = '10px 0';
  addBtn.addEventListener('click', () => {
    const container = document.querySelector('.canvas-container');
    createLayer(container, layers.length);
    updateStates({ activeLayerIndex: layers.length - 1 });
    updateCanvasVisibility();
    renderLayerList();
    setBrush(currentBrush);
  });
  layersList.appendChild(addBtn);

  // ➖ Per ogni layer, un <li> con controlli
  layers.forEach((layer, index) => {
    const li = document.createElement('li');
    li.className = index === activeLayerIndex ? 'active' : '';

    // Nome layer (cliccabile per rinominare)
    const nameSpan = document.createElement('span');
    nameSpan.textContent  = layer.name;
    nameSpan.style.flexGrow = '1';
    nameSpan.style.cursor  = 'pointer';
    nameSpan.addEventListener('click', e => {
      e.stopPropagation();
      const newName = prompt('Inserisci nuovo nome per il layer:', layer.name);
      if (newName && newName.trim()) {
        layer.name = newName.trim();
        renderLayerList();
      }
    });
    li.appendChild(nameSpan);

    // Contenitore bottoni azioni
    const controls = document.createElement('div');
    controls.className = 'layer-controls';

    // Sposta su
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

    // Sposta giù
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

    // Toggle visibilità
    const visBtn = document.createElement('button');
    visBtn.textContent = layer.visible ? '👁️' : '🚫';
    visBtn.addEventListener('click', e => {
      e.stopPropagation();
      layer.visible = !layer.visible;
      updateCanvasVisibility();
      renderLayerList();
    });
    controls.appendChild(visBtn);

    // Elimina layer
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if (layers.length === 1) {
        return alert("Non puoi eliminare l'unico layer.");
      }
      const ok = await showConfirm(`Vuoi davvero eliminare il layer "${layer.name}"?`);
      if (!ok) return;
      // Rimuovi canvas dal DOM
      const container = document.querySelector('.canvas-container');
      container.removeChild(layer.canvas.lowerCanvasEl);
      container.removeChild(layer.canvas.upperCanvasEl);
      layers.splice(index, 1);
      // Aggiorna activeLayerIndex
      const newIndex = Math.min(index, layers.length - 1);
      updateStates({ activeLayerIndex: newIndex });
      updateCanvasVisibility();
      renderLayerList();
      setBrush(currentBrush);
    });
    controls.appendChild(delBtn);

    li.appendChild(controls);

    // Seleziona layer
    li.addEventListener('click', () => {
      updateStates({ activeLayerIndex: index });
      updateCanvasVisibility();
      renderLayerList();
      // Imposta modalità e brush sul layer selezionato
      const isVisible = layers[index].visible;
      setDrawingMode(globalDrawingMode && isVisible);
      // piccolo delay per assicurarsi che il canvas sia pronto
      setTimeout(() => setBrush(currentBrush), 0);
    });

    layersList.appendChild(li);
  });
}

/**
 * Inizializza il pannello layer (mostra/nasconde e render).
 */
export function initLayerPanel() {
  if (!layersTab || !layersPanel) return;

  layersTab.addEventListener('click', () => {
    layersPanel.classList.toggle('visible');
    renderLayerList();

    const disable = layersPanel.classList.contains('visible');
    document.querySelectorAll('.layer-canvas').forEach(el => {
      el.style.pointerEvents = disable ? 'none' : 'auto';
    });

    if (!disable) {
      updateCanvasVisibility();
      setBrush(currentBrush);
    }
  });
}
