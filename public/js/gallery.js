import { layers, getBackgroundCanvas } from './canvas.js';
import { getCurrentCanvasState } from './storage.js';
import { loadProject } from './projects.js';
import { updateStates, getCurrentProjectId } from './state.js';

const backendUrl = 'https://musebrush.onrender.com';
const frontendLogin = `${window.location.origin}/login`;

export function initGallery() {
  document.getElementById('galleryBtn').onclick = () => {
    document.getElementById('galleryModal').classList.remove('hidden');
    loadProjectsFromBackend();
  };
}

async function getCsrfToken() {
  const res = await fetch(`${backendUrl}/api/csrf-token`, { credentials: 'include' });
  const { csrfToken } = await res.json();
  return csrfToken;
}

export async function loadProjectsFromBackend() {
  const projectList = document.getElementById('projectList');
  projectList.innerHTML = '<p>⏳ Caricamento...</p>';
  const token = await getCsrfToken();
  const res = await fetch(`${backendUrl}/api/loadProjects`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'X-CSRF-Token': token }
  });
  if (res.status === 401 || res.status === 403) {
    window.location.href = frontendLogin;
    return;
  }
  if (!res.ok) {
    projectList.innerHTML = `<p>Errore ${res.status}</p>`;
    return;
  }
  const data = await res.json();
  projectList.innerHTML = '';
  if (!data || Object.keys(data).length === 0) {
    projectList.innerHTML = '<p>📭 Nessun progetto trovato.</p>';
    return;
  }
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
      loadProject({ id, ...progetto });
      updateStates({ currentProjectName: progetto.nome, currentProjectId: id });
      document.getElementById('galleryModal').classList.add('hidden');
    };
    div.appendChild(openBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Elimina';
    deleteBtn.style.marginLeft = '5px';
    deleteBtn.onclick = async () => {
      if (confirm(`Vuoi davvero eliminare il progetto "${progetto.nome}"?`)) {
        await deleteProjectFromBackend(id);
      }
    };
    div.appendChild(deleteBtn);

    projectList.appendChild(div);
  });
}

export async function saveProjectToBackend(projectName) {
  const project = {
    nome: projectName,
    layers: getCurrentCanvasState(),
    preview: generateProjectPreview(),
    timestamp: Date.now()
  };
  const csrfToken = await getCsrfToken();
  const res = await fetch(`${backendUrl}/api/saveProject`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ project })
  });
  if (res.status === 401 || res.status === 403) {
    window.location.href = frontendLogin;
    return;
  }
  const data = await res.json();
  showGalleryMessage(data.message);
  loadProjectsFromBackend();
}

async function updateProjectToBackend(projectId, projectName) {
  const project = {
    nome: projectName,
    layers: getCurrentCanvasState(),
    preview: generateProjectPreview(),
    timestamp: Date.now()
  };
  const csrfToken = await getCsrfToken();
  const res = await fetch(`${backendUrl}/api/updateProject`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ projectId, project })
  });
  if (res.status === 401 || res.status === 403) {
    window.location.href = frontendLogin;
    return;
  }
  const data = await res.json();
  showGalleryMessage(data.message);
  loadProjectsFromBackend();
}

async function deleteProjectFromBackend(projectId) {
  const csrfToken = await getCsrfToken();
  const res = await fetch(`${backendUrl}/api/deleteProject`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ projectId })
  });
  if (res.status === 401 || res.status === 403) {
    window.location.href = frontendLogin;
    return;
  }
  const data = await res.json();
  showGalleryMessage(data.message);
  loadProjectsFromBackend();
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
