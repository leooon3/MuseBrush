// exit.js

import { saveProjectToBackend } from './gallery.js';
import { getCurrentProjectName } from './state.js';

/**
 * Handler to prompt the user with a confirmation before leaving the page
 * Used for the 'beforeunload' event to prevent accidental loss of work
 */
function beforeUnloadHandler(e) {
  e.preventDefault();
  e.returnValue = '';
}

/**
 * Remove the 'beforeunload' event listener to allow clean exit without prompt
 */
function cleanupExitHandlers() {
  window.removeEventListener('beforeunload', beforeUnloadHandler);
}

/**
 * Reload the page without saving the current project
 */
function handleExitWithoutSaving() {
  cleanupExitHandlers();
  window.location.reload();
}

/**
 * Prompt user for a project name, save it to backend, and exit if successful
 */
async function handleSaveAndExit() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('🔒 Devi essere loggato per salvare.');
    return;
  }

  const currentName = getCurrentProjectName() || 'progetto-musebrush';
  const name = prompt('Inserisci il nome del progetto prima di uscire:', currentName);
  if (!name) {
    return;
  }

  try {
    await saveProjectToBackend(userId, name);
  } catch (err) {
    console.error('Errore nel salvataggio del progetto:', err);
    alert('❌ Errore nel salvataggio. Riprova prima di uscire.');
    return;
  }

  cleanupExitHandlers();
  window.location.reload();
}

/**
 * Set up event listeners for the exit modal buttons and the page unload event
 */
export function initExitHandlers() {
  window.addEventListener('beforeunload', beforeUnloadHandler);

  document
    .getElementById('exitWithoutSavingBtn')
    .addEventListener('click', handleExitWithoutSaving);

  document
    .getElementById('cancelExitBtn')
    .addEventListener('click', () => {
      document.getElementById('exitModal').classList.add('hidden');
    });

  document
    .getElementById('confirmSaveExitBtn')
    .addEventListener('click', handleSaveAndExit);
}
