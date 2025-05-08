import { getActiveLayer } from './canvas.js';
import { getCurrentCanvasState } from './storage.js';
import { loadProject } from './projects.js';
import { setCurrentProjectName, getCurrentProjectId, setCurrentProjectId } from './state.js';

const backendUrl = 'https://musebrush.onrender.com';

export function initGallery() {
  document.getElementById("saveCanvasBtn").onclick = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return showGalleryMessage("🔒 Devi essere loggato per salvare.");
    const name = document.getElementById("projectNameInput").value.trim();
    if (!name) return showGalleryMessage("📛 Inserisci un nome progetto.");
    saveProjectToBackend(userId, name);
  };

  document.getElementById("updateProjectBtn").onclick = () => {
    const userId = localStorage.getItem('userId');
    const projectId = getCurrentProjectId();
    if (!userId || !projectId) return showGalleryMessage("⚠️ Nessun progetto selezionato per aggiornare.");
    const name = document.getElementById("projectNameInput").value.trim();
    updateProjectToBackend(userId, projectId, name);
  };

  document.getElementById("galleryBtn").onclick = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      showGalleryMessage("🔒 Devi essere loggato per aprire la galleria.");
      return;
    }
    document.getElementById("galleryModal").classList.remove("hidden");
    loadProjectsFromBackend(userId);
  };

  document.getElementById("closeGalleryBtn").onclick = () => {
    document.getElementById("galleryModal").classList.add("hidden");
  };
}

export function saveProjectToBackend(userId, projectName) {
  const project = {
    nome: projectName,
    layers: getCurrentCanvasState(),
    preview: getActiveLayer().canvas.toDataURL({ format: "jpeg", quality: 0.6, multiplier: 0.25 }),
    timestamp: Date.now()
  };

  fetch(`${backendUrl}/api/saveProject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: userId, project })
  })
  .then(async res => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    } else {
      throw new Error('Risposta non JSON dal server');
    }
  })
  .then(data => showGalleryMessage(data.message))
  .catch(error => showGalleryMessage('❌ Errore salvataggio: ' + error.message));
}

function updateProjectToBackend(userId, projectId, projectName) {
  const project = {
    nome: projectName,
    layers: getCurrentCanvasState(),
    preview: getActiveLayer().canvas.toDataURL({ format: "jpeg", quality: 0.6, multiplier: 0.25 }),
    timestamp: Date.now()
  };

  fetch(`${backendUrl}/api/updateProject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: userId, projectId, project })
  })
  .then(async res => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    } else {
      throw new Error('Risposta non JSON dal server');
    }
  })
  .then(data => showGalleryMessage(data.message))
  .catch(error => showGalleryMessage('❌ Errore aggiornamento: ' + error.message));
}

function loadProjectsFromBackend(userId) {
  const projectList = document.getElementById("projectList");
  if (!projectList) return;
  projectList.innerHTML = "<p>⏳ Caricamento...</p>";

  fetch(`${backendUrl}/api/loadProjects?uid=${userId}`)
    .then(res => res.json())
    .then(data => {
      projectList.innerHTML = '';
      if (!data) return showGalleryMessage("📭 Nessun progetto trovato.");

      Object.entries(data).forEach(([id, progetto]) => {
        const div = document.createElement("div");
        div.className = "project";
        div.innerHTML = `<img src="${progetto.preview}" width="100" height="75" />
                         <strong>${progetto.nome}</strong><br>`;
        const openBtn = document.createElement("button");
        openBtn.textContent = "📂 Apri";
        openBtn.onclick = () => {
          loadProject(progetto);
          setCurrentProjectName(progetto.nome);
          setCurrentProjectId(id); // ✅ salva correttamente l'ID del progetto
          document.getElementById("galleryModal").classList.add("hidden");
        };
        div.appendChild(openBtn);
        projectList.appendChild(div);
      });
    })
    .catch(error => showGalleryMessage('❌ Errore caricamento progetti: ' + error.message));
}

function showGalleryMessage(message) {
  const projectList = document.getElementById("projectList");
  if (projectList) {
    projectList.innerHTML = `<p style="padding:10px; text-align:center;">${message}</p>`;
  }
}
