import { getActiveLayer } from './canvas.js';
import { layers } from './canvas.js';
import { getBackgroundCanvas } from './canvas.js';
import { getCurrentCanvasState } from './storage.js';
import { loadProject } from './projects.js';
import { updateStates, getCurrentProjectId } from './state.js';

const backendUrl = 'https://musebrush.onrender.com';

export function initGallery() {
  document.getElementById('saveCanvasBtn').onclick = () => {
    const name = document.getElementById('projectNameInput').value.trim();
    if (!name) return showGalleryMessage('📛 Inserisci un nome progetto.');
    saveProjectToBackend(name);
  };

  document.getElementById('updateProjectBtn').onclick = () => {
    const projectId = getCurrentProjectId();
    if (!projectId) return showGalleryMessage('⚠️ Nessun progetto selezionato per aggiornare.');
    const name = document.getElementById('projectNameInput').value.trim();
    updateProjectToBackend(projectId, name);
  };

  document.getElementById('galleryBtn').onclick = () => {
    document.getElementById('galleryModal').classList.remove('hidden');
    loadProjectsFromBackend();
  };

  document.getElementById('closeGalleryBtn').onclick = () => {
    document.getElementById('galleryModal').classList.add('hidden');
  };
}

function buildProjectData(name) {
  return {
    nome: name,
    layers: getCurrentCanvasState(),
    preview: generateProjectPreview(),
    timestamp: Date.now()
  };
}

async function getCsrfToken() {
  const res = await fetch(`${backendUrl}/api/csrf-token`, {
    credentials: 'include'
  });
  const { csrfToken } = await res.json();
  return csrfToken;
}

async function saveProjectToBackend(projectName) {
  const project = buildProjectData(projectName);
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${backendUrl}/api/saveProject`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ project })
    });
    const data = await res.json();
    showGalleryMessage(data.message);
  } catch (error) {
    showGalleryMessage('❌ Errore salvataggio: ' + error.message);
  }
}

async function updateProjectToBackend(projectId, projectName) {
  const project = buildProjectData(projectName);
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${backendUrl}/api/updateProject`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ projectId, project })
    });
    const data = await res.json();
    showGalleryMessage(data.message);
  } catch (error) {
    showGalleryMessage('❌ Errore aggiornamento: ' + error.message);
  }
}

async function loadProjectsFromBackend() {
  const projectList = document.getElementById('projectList');
  if (!projectList) return;
  projectList.innerHTML = '<p>⏳ Caricamento...</p>';
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${backendUrl}/api/loadProjects`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-CSRF-Token': csrfToken
      }
    });
    const data = await res.json();
    projectList.innerHTML = '';
    if (!data) return showGalleryMessage('📭 Nessun progetto trovato.');
    Object.entries(data).forEach(([id, progetto]) => {
      const div = document.createElement('div');
      div.className = 'project';

      const img = document.createElement('img');
      img.src = progetto.preview;
      img.width = 100;
      img.height = 75;
      img.alt = progetto.nome;
      div.appendChild(img);

      const title = document.createElement('strong');
      title.textContent = progetto.nome;
      div.appendChild(title);
      div.appendChild(document.createElement('br'));

      const openBtn = document.createElement('button');
      openBtn.textContent = '📂 Apri';
      openBtn.onclick = () => {
        loadProject({ ...progetto, id });
        updateStates({ currentProjectName: progetto.nome, currentProjectId: id });
        document.getElementById('galleryModal').classList.add('hidden');
      };
      div.appendChild(openBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️ Elimina';
      deleteBtn.style.marginLeft = '5px';
      deleteBtn.onclick = () => {
        if (confirm(`Vuoi davvero eliminare il progetto "${progetto.nome}"?`)) {
          deleteProjectFromBackend(id);
        }
      };
      div.appendChild(deleteBtn);

      projectList.appendChild(div);
    });
  } catch (error) {
    showGalleryMessage('❌ Errore caricamento progetti: ' + error.message);
  }
}

async function deleteProjectFromBackend(projectId) {
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${backendUrl}/api/deleteProject`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ projectId })
    });
    const data = await res.json();
    showGalleryMessage(data.message);
    loadProjectsFromBackend();
  } catch (error) {
    showGalleryMessage('❌ Errore eliminazione: ' + error.message);
  }
}

function showGalleryMessage(message) {
  const projectList = document.getElementById('projectList');
  if (projectList) {
    projectList.innerHTML = `<p style="padding:10px; text-align:center;">${message}</p>`;
  }
}

function generateProjectPreview() {
  const background = getBackgroundCanvas();
  if (!background) return '';

  const width = background.getWidth();
  const height = background.getHeight();

  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = width;
  mergedCanvas.height = height;
  const ctx = mergedCanvas.getContext('2d');

  ctx.drawImage(background.lowerCanvasEl, 0, 0);

  layers.forEach(layer => {
    if (!layer.visible) return;
    ctx.drawImage(layer.canvas.lowerCanvasEl, 0, 0);
  });

  return mergedCanvas.toDataURL('image/jpeg', 0.6);
}
