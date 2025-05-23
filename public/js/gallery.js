// gallery.js

import { layers, getBackgroundCanvas } from './canvas.js';
import { getCurrentCanvasState } from './storage.js';
import { loadProject } from './projects.js';
import { updateStates, getCurrentProjectId } from './state.js';
import { showConfirm } from './canvas-utils.js';

const backendUrl = 'https://musebrush.onrender.com';
const frontendLogin = `${window.location.origin}`;

/**
 * Recupera e ritorna il token CSRF per le chiamate protette.
 */
async function getCsrfToken() {
  const res = await fetch(`${backendUrl}/api/csrf-token`, {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Impossibile ottenere CSRF token');
  const { csrfToken } = await res.json();
  return csrfToken;
}

/**
 * Inizializza il gallery modal e il bottone di apertura.
 */
export function initGallery() {
  const openBtn = document.getElementById('galleryBtn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      document.getElementById('galleryModal').classList.remove('hidden');
      loadProjectsFromBackend();
    });
  }

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('galleryModal');
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
}


/**
 * Carica la lista dei progetti da backend e la renderizza.
 */
export async function loadProjectsFromBackend() {
  const listEl = document.getElementById('projectList');
  if (!listEl) return console.error('projectList non trovato in DOM');
  listEl.innerHTML = '<p>⏳ Caricamento...</p>';

  let token;
  try {
    token = await getCsrfToken();
  } catch {
    return window.location.href = frontendLogin;
  }

  let res;
  try {
    res = await fetch(`${backendUrl}/api/loadProjects`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'X-CSRF-Token': token }
    });
  } catch (err) {
    listEl.innerHTML = `<p>Errore di rete</p>`;
    return;
  }

  if (res.status === 401 || res.status === 403) {
    return window.location.href = frontendLogin;
  }
  if (!res.ok) {
    listEl.innerHTML = `<p>Errore ${res.status}</p>`;
    return;
  }

  const data = await res.json();
  listEl.innerHTML = '';
  if (!data || Object.keys(data).length === 0) {
    listEl.innerHTML = '<p>📭 Nessun progetto trovato.</p>';
    return;
  }

  Object.entries(data).forEach(([id, project]) => {
    const item = createProjectItem(id, project);
    listEl.appendChild(item);
  });
}

/**
 * Crea e ritorna l’elemento DOM per un singolo progetto.
 */
function createProjectItem(id, project) {
  const div = document.createElement('div');
  div.className = 'project';

  const img = document.createElement('img');
  img.src = project.preview;
  img.width = 100;
  img.height = 75;
  img.alt = project.nome;
  div.appendChild(img);

  const title = document.createElement('strong');
  title.textContent = project.nome;
  div.appendChild(title);
  div.appendChild(document.createElement('br'));

  const openBtn = document.createElement('button');
  openBtn.textContent = '📂 Apri';
  openBtn.addEventListener('click', () => {
    loadProject({ id, ...project });
    updateStates({ currentProjectName: project.nome, currentProjectId: id });
    document.getElementById('galleryModal').classList.add('hidden');
  });
  div.appendChild(openBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️ Elimina';
  deleteBtn.style.marginLeft = '5px';
  deleteBtn.addEventListener('click', async () => {
    const ok = await showConfirm(`Vuoi davvero eliminare il progetto "${project.nome}"?`);
    if (ok) await deleteProjectFromBackend(id);
  });
  div.appendChild(deleteBtn);

  return div;
}

/**
 * Elimina un progetto su backend e ricarica la lista.
 */
async function deleteProjectFromBackend(projectId) {
  let token;
  try {
    token = await getCsrfToken();
  } catch {
    return window.location.href = frontendLogin;
  }

  const res = await fetch(`${backendUrl}/api/deleteProject`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token
    },
    body: JSON.stringify({ projectId })
  });

  if (res.status === 401 || res.status === 403) {
    return window.location.href = frontendLogin;
  }
  const { message } = await res.json();
  showGalleryMessage(message);
  loadProjectsFromBackend();
}

/**
 * Salva un nuovo progetto su backend.
 */
export async function saveProjectToBackend(projectName) {
  const project = {
    nome: projectName,
    layers: getCurrentCanvasState(),
    preview: generateProjectPreview(),
    timestamp: Date.now()
  };
  let token;
  try {
    token = await getCsrfToken();
  } catch {
    return window.location.href = frontendLogin;
  }

  const res = await fetch(`${backendUrl}/api/saveProject`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token
    },
    body: JSON.stringify({ project })
  });

  if (res.status === 401 || res.status === 403) {
    return window.location.href = frontendLogin;
  }
  const { message } = await res.json();
  showGalleryMessage(message);
  loadProjectsFromBackend();
}

/**
 * Genera il preview JPEG unendo background e layers visibili.
 */
function generateProjectPreview() {
  const background = getBackgroundCanvas();
  if (!background) return '';
  const width = background.getWidth();
  const height = background.getHeight();
  const merged = document.createElement('canvas');
  merged.width = width;
  merged.height = height;
  const ctx = merged.getContext('2d');
  ctx.drawImage(background.lowerCanvasEl, 0, 0);
  layers.forEach(layer => {
    if (layer.visible) {
      ctx.drawImage(layer.canvas.lowerCanvasEl, 0, 0);
    }
  });
  return merged.toDataURL('image/jpeg', 0.6);
}

/**
 * Mostra un messaggio all’interno del gallery modal.
 */
function showGalleryMessage(msg) {
  const listEl = document.getElementById('projectList');
  if (listEl) {
    listEl.innerHTML = `<p style="padding:10px; text-align:center;">${msg}</p>`;
  }
}
