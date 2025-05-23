// storage.js

import { layers } from './canvas.js';
import { loadProject } from './projects.js';
import { updateStates } from './state.js';
import { showConfirm } from './canvas-utils.js';

/**
 * Exports the current project data to a downloadable JSON file.
 */
async function handleExportProject() {
  const defaultName = localStorage.getItem('currentProjectName') || 'progetto-musebrush';
  const name = prompt('Nome file da esportare:', defaultName);
  if (!name) return;

  try {
    const data = {
      name,
      layers: layers.map(layer => ({
        name: layer.name,
        visible: layer.visible,
        json: layer.canvas.toJSON(),
        width: layer.canvas.getWidth(),
        height: layer.canvas.getHeight()
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name}.musebrush.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    alert(`❌ Errore durante l'esportazione: ${error.message}`);
  }
}

/**
 * Imports project data from a JSON file selected by the user.
 * @param {Event} event - Change event from file input element.
 */
async function handleImportProject(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const proj = JSON.parse(e.target.result);
      if (!Array.isArray(proj.layers)) throw new Error('Formato file non valido');

      const confirmed = await showConfirm(`Vuoi caricare il progetto "${proj.name}"?`);
      if (!confirmed) return;

      loadProject(proj);
      updateStates({ currentProjectName: proj.name });
    } catch (err) {
      alert(`❌ Errore nel caricamento del file: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

/**
 * Initializes import/export button handlers for project file management.
 */
export function initStorage() {
  const exportBtn = document.getElementById('exportProjectBtn');
  const importInput = document.getElementById('importProjectInput');

  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportProject);
  } else {
    console.warn('exportProjectBtn non trovato in DOM');
  }

  if (importInput) {
    importInput.addEventListener('change', handleImportProject);
  } else {
    console.warn('importProjectInput non trovato in DOM');
  }
}

/**
 * Returns the current canvas state, used for saving the project.
 */
export function getCurrentCanvasState() {
  return layers.map(layer => ({
    name: layer.name,
    visible: layer.visible,
    json: layer.canvas.toJSON()
  }));
}