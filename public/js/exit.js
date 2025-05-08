// ================================
// 9. Exit Modal & Window Events
// ================================
import { saveProjectToBackend } from './gallery.js';

export function initExitHandlers() {
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
    const name = prompt("Inserisci il nome del progetto prima di uscire:", currentProjectName || "progetto-musebrush");
    if (name) {
      saveProjectToBackend(userId, name);
      window.removeEventListener("beforeunload", () => {});
      window.location.reload();
    }
  };
}
