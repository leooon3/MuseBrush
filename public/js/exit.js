// exit.js

import { saveProjectToBackend } from './gallery.js';
import { getCurrentProjectName } from './state.js';

/**
 * Handler per beforeunload, dichiarato una volta per poterlo rimuovere correttamente.
 */
function beforeUnloadHandler(e) {
  e.preventDefault();
  e.returnValue = '';
}

/**
 * Rimuove il listener di beforeunload per permettere l’uscita senza avvisi.
 */
function cleanupExitHandlers() {
  window.removeEventListener('beforeunload', beforeUnloadHandler);
}

/**
 * Azione per uscire senza salvare: rimuove il listener e ricarica la pagina.
 */
function handleExitWithoutSaving() {
  cleanupExitHandlers();
  window.location.reload();
}

/**
 * Azione per salvare e poi uscire:
 * - Verifica che l’utente sia loggato
 * - Chiede (prompt) il nome del progetto
 * - Chiama saveProjectToBackend in modalità async/await
 * - Solo al successo rimuove beforeunload e ricarica
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
    // Se l’utente annulla o lascia vuoto, esci senza fare nulla
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
 * Inizializza tutti i listener per la gestione dell’uscita.
 */
export function initExitHandlers() {
  // 1️⃣ Mostra la finestra di conferma se l’utente cerca di chiudere / ricaricare
  window.addEventListener('beforeunload', beforeUnloadHandler);

  // 2️⃣ Bottone "Esci senza salvare"
  document
    .getElementById('exitWithoutSavingBtn')
    .addEventListener('click', handleExitWithoutSaving);

  // 3️⃣ Bottone "Annulla"
  document
    .getElementById('cancelExitBtn')
    .addEventListener('click', () => {
      document.getElementById('exitModal').classList.add('hidden');
    });

  // 4️⃣ Bottone "Salva e esci"
  document
    .getElementById('confirmSaveExitBtn')
    .addEventListener('click', handleSaveAndExit);
}
