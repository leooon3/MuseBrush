import { saveProjectToBackend } from './gallery.js';
import { getCurrentProjectName } from './state.js';

export function initExitHandlers() { // the exit modal with all the checks
  window.addEventListener("beforeunload", function (e) {
    e.preventDefault();
    e.returnValue = '';
  });

  document.getElementById("exitWithoutSavingBtn").onclick = () => {
    window.removeEventListener("beforeunload", () => {});
    window.location.reload();
  };

  document.getElementById("cancelExitBtn").onclick = () => {
    document.getElementById("exitModal").classList.add("hidden");
  };
  
  document.getElementById("confirmSaveExitBtn").onclick = () => {
    const userId = localStorage.getItem('userId');
    const currentProjectName = getCurrentProjectName() || "progetto-musebrush";
    const name = prompt("Inserisci il nome del progetto prima di uscire:", currentProjectName);
    if (!userId) return alert("🔒 Devi essere loggato per salvare.");
    if (name) {
      saveProjectToBackend(userId, name);
      window.removeEventListener("beforeunload", () => {});
      window.location.reload();
    }
  };
}
