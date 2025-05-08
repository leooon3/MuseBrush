import { getActiveLayer } from './canvas.js';
import { getCurrentCanvasState } from './storage.js';
import { loadProject } from './projects.js';
import { setCurrentProjectName } from './state.js';

const backendUrl = 'https://musebrush.onrender.com';

export function initGallery() {
  document.getElementById("saveCanvasBtn").onclick = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert("🔒 Devi essere loggato per salvare.");
    const name = document.getElementById("projectNameInput").value.trim();
    if (!name) return alert("📛 Inserisci un nome progetto.");
    saveProjectToBackend(userId, name);
  };

  document.getElementById("galleryBtn").onclick = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert("🔒 Devi essere loggato per aprire la galleria.");
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
    .then(res => res.json())
    .then(data => alert(data.message))
    .catch(error => alert('Errore salvataggio: ' + error.message));
}

function loadProjectsFromBackend(userId) {
  fetch(`${backendUrl}/api/loadProjects?uid=${userId}`)
    .then(res => res.json())
    .then(data => {
      const projectList = document.getElementById("projectList");
      if (!projectList) return;
      projectList.innerHTML = '';
      if (!data) return (projectList.innerHTML = "<p>📭 Nessun progetto trovato.</p>");
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
          document.getElementById("galleryModal").classList.add("hidden");
        };
        div.appendChild(openBtn);
        projectList.appendChild(div);
      });
    })
    .catch(error => alert('Errore caricamento progetti: ' + error.message));
}
