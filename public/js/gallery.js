import { layers, getBackgroundCanvas } from './canvas.js';
import { getCurrentCanvasState } from './storage.js';
import { loadProject } from './projects.js';
import { updateStates, getCurrentProjectId } from './state.js';
import { showConfirm } from './canvas-utils.js';

const backendUrl = 'https://musebrush.onrender.com';
const frontendLogin = `${window.location.origin}`;

async function getCsrfToken() {
  const res = await fetch(`${backendUrl}/api/csrf-token`, { credentials: 'include' });
  if (!res.ok) throw new Error('Impossibile ottenere CSRF token');
  const { csrfToken } = await res.json();
  return csrfToken;
}

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

  document.getElementById('saveCanvasBtn').addEventListener('click', () => {
    const projectName = document.getElementById('projectNameInput').value;
    if (!projectName) return alert('Inserisci un nome per il progetto!');
    saveProjectToBackend(projectName);
  });

  document.getElementById('updateProjectBtn').addEventListener('click', () => {
    const projectId = getCurrentProjectId();
    const projectName = document.getElementById('projectNameInput').value;
    if (!projectId) return alert('Nessun progetto da aggiornare!');
    if (!projectName) return alert('Inserisci un nome per aggiornare il progetto!');
    updateProjectOnBackend(projectId, projectName);
  });
}

export async function loadProjectsFromBackend() {
  const listEl = document.getElementById('projectList');
  if (!listEl) return;
  listEl.innerHTML = '<p>⏳ Caricamento...</p>';

  let token;
  try {
    token = await getCsrfToken();
  } catch {
    return (window.location.href = frontendLogin);
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
    return (window.location.href = frontendLogin);
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

export async function deleteProjectFromBackend(projectId) {
  const token = await getCsrfToken();
  await fetch(`${backendUrl}/api/deleteProject`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    body: JSON.stringify({ projectId })
  });
  loadProjectsFromBackend();
}

export async function saveProjectToBackend(projectName) {
  const project = {
    nome: projectName,
    layers: getCurrentCanvasState(),
    preview: generateProjectPreview(),
    timestamp: Date.now()
  };
  const token = await getCsrfToken();
  await fetch(`${backendUrl}/api/saveProject`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    body: JSON.stringify({ project })
  });
  loadProjectsFromBackend();
}

export async function updateProjectOnBackend(projectId, projectName) {
  const token = await getCsrfToken();
  await fetch(`${backendUrl}/api/updateProject`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    body: JSON.stringify({ projectId, project: { nome: projectName, layers: getCurrentCanvasState(), preview: generateProjectPreview() } })
  });
  loadProjectsFromBackend();
}

function generateProjectPreview() {
  const background = getBackgroundCanvas();
  if (!background) return '';
  const canvas = document.createElement('canvas');
  canvas.width = background.getWidth();
  canvas.height = background.getHeight();
  const ctx = canvas.getContext('2d');
  ctx.drawImage(background.lowerCanvasEl, 0, 0);
  layers.forEach(layer => layer.visible && ctx.drawImage(layer.canvas.lowerCanvasEl, 0, 0));
  return canvas.toDataURL('image/jpeg', 0.6);
}