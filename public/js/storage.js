// ================================
// 6. Project Save/Load/Export/Import (Local & Firebase)
// ================================
import { layers } from './canvas.js';
import { loadProject } from './projects.js';

export function initStorage() {
  document.getElementById("exportProjectBtn").onclick = () => {
    const name = prompt("Nome file da esportare:", currentProjectName || "progetto-musebrush");
    if (!name) return;

    try {
      const data = {
        name: name,
        layers: layers.map(layer => ({
          name: layer.name,
          visible: layer.visible,
          json: layer.canvas.toJSON(),
          width: layer.canvas.getWidth(),
          height: layer.canvas.getHeight()
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name + ".musebrush.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("❌ Errore durante l'esportazione: " + error.message);
    }
  };

  document.getElementById("importProjectInput").onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const proj = JSON.parse(event.target.result);
        if (!proj.layers) throw new Error("Formato non valido");

        if (confirm(`Vuoi caricare il progetto "${proj.name}"?`)) {
          loadProject(proj);
          currentProjectName = proj.name;
        }
      } catch (err) {
        alert("Errore nel caricamento del file: " + err.message);
      }
    };
    reader.readAsText(file);
  };
}

export function getCurrentCanvasState() {
  return layers.map(layer => ({
    json: layer.canvas.toJSON(),
    visible: layer.visible,
    name: layer.name
  }));
}
