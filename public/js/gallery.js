import { getActiveLayer } from './canvas.js';
import { layers } from './canvas.js';
import { getBackgroundCanvas } from './canvas.js';
import { getCurrentCanvasState } from './storage.js';
import { loadProject } from './projects.js';
import { updateStates, getCurrentProjectId } from './state.js';
const backendUrl = 'https://musebrush.onrender.com';

export function initGallery() { // connects the modal to the functions
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

function buildProjectData(name) { //makes the project data
  return {
    nome: name,
    layers: getCurrentCanvasState(),
    preview: generateProjectPreview(),
    timestamp: Date.now()
  };
}

export function saveProjectToBackend(userId, projectName) { // talks to backend to save the project
  const project = buildProjectData(projectName);

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

function updateProjectToBackend(userId, projectId, projectName) { // talks to backend to update the project info, such as data ,ect
  const project = buildProjectData(projectName);

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

function loadProjectsFromBackend(userId) { // loads the project into the canva 
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
          loadProject({ ...progetto, id });
          updateStates({ currentProjectName: progetto.nome, currentProjectId: id });
          document.getElementById("galleryModal").classList.add("hidden");
        };
        div.appendChild(openBtn);
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️ Elimina";
        deleteBtn.style.marginLeft = "5px";
        deleteBtn.onclick = () => {
          if (confirm(`Vuoi davvero eliminare il progetto "${progetto.nome}"?`)) {
            deleteProjectFromBackend(userId, id);
          }
        };
        div.appendChild(deleteBtn);
        projectList.appendChild(div);
      });
    })
    .catch(error => showGalleryMessage('❌ Errore caricamento progetti: ' + error.message));
}

function showGalleryMessage(message) { // shows the message of the gallery, errors, updates, ect
  const projectList = document.getElementById("projectList");
  if (projectList) {
    projectList.innerHTML = `<p style="padding:10px; text-align:center;">${message}</p>`;
  }
}

function deleteProjectFromBackend(userId, projectId) { // deletes the projects form the database
  fetch(`${backendUrl}/api/deleteProject`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: userId, projectId })
  })
    .then(async res => {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return res.json();
      } else {
        throw new Error('Risposta non JSON dal server');
      }
    })
    .then(data => {
      showGalleryMessage(data.message);
      loadProjectsFromBackend(userId);
    })
    .catch(error => showGalleryMessage('❌ Errore eliminazione: ' + error.message));
}

function generateProjectPreview() { //creates the preview to show in the gallery
  const background = getBackgroundCanvas();
  if (!background) return "";

  const width = background.getWidth();
  const height = background.getHeight();

  const mergedCanvas = document.createElement("canvas");
  mergedCanvas.width = width;
  mergedCanvas.height = height;
  const ctx = mergedCanvas.getContext("2d");

  ctx.drawImage(background.lowerCanvasEl, 0, 0);

  layers.forEach(layer => {
    if (!layer.visible) return;
    ctx.drawImage(layer.canvas.lowerCanvasEl, 0, 0);
  });

  return mergedCanvas.toDataURL("image/jpeg", 0.6);
}