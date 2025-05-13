// ================================
// 4. UI Controls: Buttons, Dropdowns, Sliders
// ================================
import { setBrush, setDrawingMode, disableDrawingSilently } from './tool.js';
import { getActiveLayer, layers, initLayers } from './canvas.js';
import { undo, redo, saveState } from './actions.js';
import {
  currentBrush, brushColor, brushSize, globalDrawingMode,
  setCurrentBrush, setBrushColor, setBrushSize,
  setGlobalDrawingMode, setDrawingShape, setIsInsertingText, setIsFilling,
  setIsBucketActive, setPreviousDrawingMode
} from './state.js';
import { setIsPointerMode, getIsPointerMode } from './state.js';

export function initUIControls() {
  const brushButton = document.getElementById("brushes_tab");
  const brushDropdown = document.getElementById("brushDropdown");
  const downloadBtn = document.getElementById("download_tab");
  const downloadDropdown = document.getElementById("downloadDropdown");
  const shapesButton = document.getElementById("shapes_tab");
  const shapeDropdown = document.getElementById("shapeDropdown");
  const eraserButton = document.getElementById("eraser_tab");
  const eraserDropdown = document.getElementById("eraserDropdown");

  // Brush dropdown toggle
  brushButton.onclick = () => {
    brushDropdown.style.display = brushDropdown.style.display === "block" ? "none" : "block";
  };

  downloadBtn.onclick = () => {
    downloadDropdown.style.display=downloadDropdown.style.display === "block" ? "none" : "block";
  }
  document.querySelectorAll(".download-option").forEach(button => {
    button.addEventListener("click", function () {
      const format = this.getAttribute("value");
      const width = window.innerWidth;
      const height = window.innerHeight * 0.85;
      const mergedCanvas = document.createElement("canvas");
      mergedCanvas.width = width;
      mergedCanvas.height = height;
      const ctx = mergedCanvas.getContext("2d");
      layers.forEach(layer => {
        if (!layer.visible) return;
        const layerEl = layer.canvas.lowerCanvasEl;
        ctx.drawImage(layerEl, 0, 0);
      });
      const dataURL = mergedCanvas.toDataURL(`image/${format}`, 1.0);
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `drawing.${format}`;
      link.click();
    });
  })

  // Shape tool selection
  shapesButton.onclick = () => {
    shapeDropdown.style.display = shapeDropdown.style.display === "block" ? "none" : "block";
  };

  document.querySelectorAll(".shape-option").forEach(button => {
    button.addEventListener("click", () => {
      setDrawingShape(button.getAttribute("data-shape"));
      setPreviousDrawingMode(globalDrawingMode);
      setIsFilling(false);
      setIsInsertingText(false);
      setDrawingMode(false);
      highlightTool("shapes_tab");
      shapeDropdown.style.display = "none";
    });
  });

  document.querySelectorAll(".brush-option").forEach(button => {
    button.addEventListener("click", () => {
        const selected = button.getAttribute("data");
        setIsFilling(false);
        if (selected !== "Eraser") {
            setCurrentBrush(selected);
        }
        setBrush(selected);
        if (selected !== "Eraser") {
            setGlobalDrawingMode(true);
            setDrawingMode(true);
            document.getElementById("pointerIcon").src = "./images/pencil-icon.png";
        }
        import('./canvas.js').then(({ updateCanvasVisibility }) => {
            updateCanvasVisibility();
        });
        highlightTool("brushes_tab");
        brushDropdown.style.display = "none";
    });
});


  // Eraser tool selection
  eraserButton.onclick = () => {
    eraserDropdown.style.display = eraserDropdown.style.display === "block" ? "none" : "block";
  };

document.querySelectorAll(".eraser-option").forEach(button => {
  button.addEventListener("click", () => {
    const selected = button.getAttribute("data");
    setIsPointerMode(false); // ✅ Disattiva modalità selezione
    setGlobalDrawingMode(true);
    setIsFilling(false);
    setIsInsertingText(false);
    setDrawingShape(null);
    setDrawingMode(true);
    setBrush(selected);
    document.getElementById("pointerIcon").src = "./images/pencil-icon.png";
    highlightTool("eraser_tab");
    eraserDropdown.style.display = "none";
  });
});


  // Close dropdowns on click outside
  document.addEventListener("click", function (e) {
    if (!eraserButton.contains(e.target) && !eraserDropdown.contains(e.target)) {
      eraserDropdown.style.display = "none";
    }
    if (!downloadBtn.contains(e.target) && !downloadDropdown.contains(e.target)) {
      downloadDropdown.style.display = "none";
    }
  });


document.getElementById("pointerToggleBtn").onclick = () => {
  const newPointerState = !getIsPointerMode();
  setIsPointerMode(newPointerState);
  setGlobalDrawingMode(!newPointerState); // disattiva drawing se pointer è attivo
  setIsFilling(false);
  setDrawingShape(null);
  setIsInsertingText(false);

  setDrawingMode(!newPointerState); // attivo solo se non siamo in pointer
  setBrush(currentBrush);

  document.getElementById("pointerIcon").src = newPointerState
    ? "./images/pointer-icon.png"
    : "./images/pencil-icon.png";
};


  // Sliders
  document.getElementById("thicknessSlider").addEventListener("input", function () {
    setBrushSize(parseInt(this.value));
    setBrush(currentBrush);
  });

  document.getElementById("colorInput").addEventListener("input", function () {
    setBrushColor(this.value);
    setBrush(currentBrush);
    addRecentColor(this.value);
  });

  // Undo/Redo/Clear
  document.getElementById("undoBtn").onclick = undo;
  document.getElementById("redoBtn").onclick = redo;

document.getElementById("clearBtn").onclick = () => {
  layers.forEach((layer, i) => {
    layer.canvas.clear();
    layer.canvas.backgroundColor = 'transparent';
    saveState();
    layer.canvas.renderAll();
  });
};


  // Text tool
  document.getElementById("text_tab").onclick = () => {
    setPreviousDrawingMode(getActiveLayer().canvas.isDrawingMode);
    disableDrawingSilently();
    setDrawingShape(null);
    setIsInsertingText(true);
    setIsFilling(false);
    highlightTool("text_tab");
  };

  // Bucket tool
  document.getElementById("bucket_tab").onclick = () => {
    setIsFilling(true);
    setIsBucketActive(true);
    setGlobalDrawingMode(false);
    setDrawingShape(null);
    setIsInsertingText(false);
    setDrawingMode(false);
    highlightTool("bucket_tab");
  };
}

function highlightTool(buttonId) {
  document.querySelectorAll(".menu-left button").forEach(btn => {
    btn.classList.remove("tool-active");
  });
  const btn = document.getElementById(buttonId);
  if (btn) btn.classList.add("tool-active");
}

function addRecentColor(color) {
  const recentColors = JSON.parse(localStorage.getItem("recentColors") || "[]");
  const filtered = recentColors.filter(c => c !== color);
  filtered.unshift(color);
  const limited = filtered.slice(0, 6);
  localStorage.setItem("recentColors", JSON.stringify(limited));
  renderRecentColors();
}

function renderRecentColors() {
  const container = document.getElementById("recentColors");
  container.innerHTML = "";
  const recentColors = JSON.parse(localStorage.getItem("recentColors") || "[]");
  recentColors.forEach(color => {
    const btn = document.createElement("button");
    btn.style.backgroundColor = color;
    btn.title = color;
    btn.onclick = () => {
      setBrushColor(color);
      document.getElementById("colorInput").value = color;
      setBrush(color);
      addRecentColor(color);
    };
    container.appendChild(btn);
  });
}
export function updateMenuHeight() {
  const menu = document.querySelector('#menu');
  if (menu) {
    const height = menu.offsetHeight + 'px';
    document.documentElement.style.setProperty('--menu-height', height);
    console.log('Impostato --menu-height a:', height);
  }
}
