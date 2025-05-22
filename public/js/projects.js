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
 * Carica un progetto nel canvas:
 * - Pulisce il container
 * - Inizializza il background
 * - Resetta l’array layers e lo stato
 * - Ricrea ogni layer con createLayer, assegna nome/visibilità
 * - Carica il JSON, sistema i fill e ridimensiona
 */
export async function loadProject(proj) {
  const container = document.querySelector('.canvas-container');
  if (!container) {
    console.error('Container .canvas-container non trovato.');
    return;
  }

  // Pulisce il DOM e resetta layers
  container.innerHTML = '';
  layers.length = 0;

  // Background e stato iniziale
  createBackgroundLayer(container);
  updateStates({
    activeLayerIndex: 0,
    currentProjectName: proj.name || proj.nome
  });

  // Ricrea i layer utente
  proj.layers.forEach((layerData, idx) => {
    // Crea il layer con configurazione standard
    createLayer(container, idx);
    const layer = layers[idx];

    // Imposta nome e visibilità dal progetto
    layer.name = layerData.name;
    layer.visible = !!layerData.visible;

    // Carica lo stato JSON e applica correzioni
    layer.canvas.loadFromJSON(layerData.json, () => {
      layer.canvas.getObjects().forEach(obj => {
        // Oggetti shape senza fill diventano trasparenti
        if (['line', 'rect', 'circle', 'polygon'].includes(obj.type) &&
            (!obj.fill || obj.fill === 'rgba(0,0,0,1)')) {
          obj.set({ fill: 'transparent' });
        }
        // Percorsi (path) ripristinati senza fill
        if (obj.type === 'path') {
          obj.set({ fill: null });
        }
      });
      layer.canvas.renderAll();
      fitCanvasToContainer(layer.canvas);
      attachCanvasEvents(layer.canvas);
    });
  });

  // Aggiorna visibilità e UI
  updateCanvasVisibility();
  updateMenuHeight();
}
