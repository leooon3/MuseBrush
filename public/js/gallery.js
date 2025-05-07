// ================================
// 8. Gallery UI
// ================================
import { getActiveLayer, layers } from './canvas.js';
import { getCurrentCanvasState } from './storage.js';
import { loadProject } from './projects.js';
import { currentProjectName, setCurrentProjectName } from './state.js';

export function initGallery() {
  document.getElementById("saveCanvasBtn").onclick = () => {
    const name = document.getElementById("projectNameInput").value.trim();
    if (!name) return alert("📛 Inserisci un nome progetto.");
    salvaProgettoFirebase(name);
    setCurrentProjectName(name);
    document.getElementById("saveConfirmation").classList.remove("hidden");
    setTimeout(() => document.getElementById("saveConfirmation").classList.add("hidden"), 2000);
  };

  document.getElementById("updateProjectBtn").onclick = () => {
    const user = firebase.auth().currentUser;
    if (!user || user.isAnonymous) return alert("⚠️ Login richiesto.");
    const preview = getActiveLayer().canvas.toDataURL({ format: "jpeg", quality: 0.6, multiplier: 0.25 });

    const ref = firebase.database().ref("progetti/" + user.uid);
    ref.orderByChild("nome").equalTo(currentProjectName).once("value", snapshot => {
      const updates = snapshot.val();
      if (!updates) return alert("⚠️ Progetto non trovato.");
      const firstKey = Object.keys(updates)[0];
      const updated = {
        nome: currentProjectName,
        layers: getCurrentCanvasState(),
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        preview
      };
      firebase.database().ref(`progetti/${user.uid}/${firstKey}`).set(updated)
        .then(() => alert("✅ Progetto aggiornato!"));
    });
  };

  document.getElementById("galleryBtn").onclick = () => {
    const user = firebase.auth().currentUser;
    if (!user || user.isAnonymous) {
      alert("🔒 Login richiesto.");
      return;
    }

    document.getElementById("galleryModal").classList.remove("hidden");
    caricaProgettiFirebase(); // ✅ usa la nuova funzione modulare
  };

  document.getElementById("closeGalleryBtn").onclick = () => {
    document.getElementById("galleryModal").classList.add("hidden");
  };
}
export function salvaProgettoFirebase(nomeProgetto) {
  const user = firebase.auth().currentUser;
  if (!user || user.isAnonymous) return alert("⚠️ Devi essere autenticato per salvare.");

  const preview = getActiveLayer().canvas.toDataURL({
    format: "jpeg",
    quality: 0.6,
    multiplier: 0.25
  });

  const progetto = {
    nome: nomeProgetto,
    layers: getCurrentCanvasState(),
    autore: user.email,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    preview
  };

  firebase.database().ref("progetti/" + user.uid).push(progetto)
    .then(() => alert("✅ Progetto salvato nella galleria!"));
}
export function caricaProgettiFirebase() {
  const user = firebase.auth().currentUser;
  if (!user || user.isAnonymous) return alert("⚠️ Login richiesto.");

  const projectList = document.getElementById("projectList");
  projectList.innerHTML = "<p>⏳ Caricamento...</p>";

  firebase.database().ref("progetti/" + user.uid).once("value")
    .then(snapshot => {
      const progetti = snapshot.val();
      projectList.innerHTML = '';
      if (!progetti) return (projectList.innerHTML = "<p>📭 Nessun progetto trovato.</p>");

      Object.entries(progetti).forEach(([id, progetto]) => {
        const div = document.createElement("div");
        div.className = "project";
        div.innerHTML = `
          <img src="${progetto.preview}" width="100" height="75" />
          <strong>${progetto.nome}</strong><br>
        `;

        const openBtn = document.createElement("button");
        openBtn.textContent = "📂 Apri";
        openBtn.onclick = () => loadProjectFirebase(id, progetto);

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️ Elimina";
        delBtn.onclick = () => deleteProjectFirebase(id);

        div.appendChild(openBtn);
        div.appendChild(delBtn);
        projectList.appendChild(div);
      });
    });
}
export function loadProjectFirebase(id, proj) {
  if (confirm(`Vuoi aprire "${proj.nome}"?`)) {
    loadProject(proj);
    setCurrentProjectName(proj.nome);
    document.getElementById("galleryModal").classList.add("hidden");
  }
}
export function deleteProjectFirebase(id) {
  const user = firebase.auth().currentUser;
  if (!user || user.isAnonymous) return alert("⚠️ Login richiesto.");
  if (!confirm("Vuoi davvero eliminare questo progetto?")) return;

  firebase.database().ref("progetti/" + user.uid + "/" + id).remove()
    .then(() => {
      alert("✅ Progetto eliminato.");
      caricaProgettiFirebase(); // aggiorna lista
    });
}
