// ================================
// 5. Layers: Add, Select, Rename, Delete
// ================================
import { createLayer, updateCanvasVisibility , updateCanvasStacking} from './canvas.js';
import { setBrush } from './tool.js';
import {
  activeLayerIndex,
  setActiveLayerIndex,
  currentBrush,
  globalDrawingMode
} from './state.js';

const layersTab = document.getElementById('layers_tab');
const layersPanel = document.getElementById('layersPanel');

export function renderLayerList() {
  const list = document.getElementById("layersList");
  list.innerHTML = '';

  import('./canvas.js').then(({ layers }) => {
    // ✅ Aggiungi il pulsante sopra
    const addBtn = document.createElement('button');
    addBtn.textContent = "+ Nuovo Livello";
    addBtn.className = 'add-layer-btn';
    addBtn.style.marginBottom = "10px";
    addBtn.onclick = () => {
      const container = document.querySelector('.canvas-container');
      createLayer(container, layers.length);
      setActiveLayerIndex(layers.length - 1);
      updateCanvasVisibility();
      renderLayerList();
      setBrush(currentBrush);
    };
    list.appendChild(addBtn); // ✅ Prima della lista

    // Aggiungi i layer sotto
    layers.forEach((layer, index) => {
      const li = document.createElement('li');
      li.className = index === activeLayerIndex ? 'active' : '';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = layer.name;
      nameSpan.style.flexGrow = '1';
      nameSpan.style.cursor = 'pointer';
      nameSpan.onclick = (e) => {
        e.stopPropagation();
        const newName = prompt("Inserisci un nuovo nome per il layer:", layer.name);
        if (newName && newName.trim()) {
          layer.name = newName.trim();
          renderLayerList();
        }
      };

      const controls = document.createElement('div');
      controls.className = 'layer-controls';
      const upBtn = document.createElement('button');
      upBtn.textContent = '⬆️';
      upBtn.onclick = (e) => {
        e.stopPropagation();
        if (index > 0) {
          [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
          renderLayerList();
          updateCanvasStacking();
        }
      };

      const downBtn = document.createElement('button');
      downBtn.textContent = '⬇️';
      downBtn.onclick = (e) => {
        e.stopPropagation();
        if (index < layers.length - 1) {
          [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
          renderLayerList();
          updateCanvasStacking();
        }
      };
      const visibilityBtn = document.createElement('button');
      visibilityBtn.textContent = layer.visible ? '👁️' : '🚫';
      visibilityBtn.onclick = (e) => {
        e.stopPropagation();
        layer.visible = !layer.visible;
        updateCanvasVisibility();
        renderLayerList();
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (layers.length === 1) return alert("Non puoi eliminare l'unico layer.");
        if (confirm(`Vuoi davvero eliminare "${layer.name}"?`)) {
          const container = document.querySelector('.canvas-container');
          container.removeChild(layer.canvas.lowerCanvasEl);
          container.removeChild(layer.canvas.upperCanvasEl);
          layers.splice(index, 1);
          setActiveLayerIndex(Math.max(0, activeLayerIndex - 1));
          updateCanvasVisibility();
          renderLayerList();
          setBrush(currentBrush);
        }
      };
      controls.appendChild(upBtn);
      controls.appendChild(downBtn);
      controls.appendChild(visibilityBtn);
      controls.appendChild(deleteBtn);
      li.appendChild(nameSpan);
      li.appendChild(controls);
      li.onclick = () => {
        setActiveLayerIndex(index);
        updateCanvasVisibility();
        renderLayerList();
        const isVisible = layers[index].visible;
        import('./tool.js').then(({ setDrawingMode }) => {
          setDrawingMode(globalDrawingMode && isVisible);
          setTimeout(() => setBrush(currentBrush), 0);
        });
      };
      list.appendChild(li);
    });
  });
}



export function initLayerPanel() {
  layersTab.onclick = () => {
    layersPanel.classList.toggle("visible");
    renderLayerList();
    const disable = layersPanel.classList.contains("visible");

    document.querySelectorAll(".layer-canvas").forEach(c => {
      c.style.pointerEvents = disable ? "none" : "auto";
    });

    if (!disable) {
      updateCanvasVisibility();
      setBrush(currentBrush);
    }
  };
}
