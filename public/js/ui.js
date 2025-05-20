// here there is all the function that manage what every button does 

import { setBrush, setDrawingMode, disableDrawingSilently } from './tool.js';
import { getActiveLayer, layers, initLayers } from './canvas.js';
import { undo, redo, saveState } from './actions.js';
import {
  currentBrush, brushColor, brushSize, globalDrawingMode,
  setCurrentBrush, setBrushColor, setBrushSize,
  setPreviousDrawingMode, getIsPointerMode, updateStates
} from './state.js';

export function initUIControls() { // this function links every button with their own functions
  const brushButton = document.getElementById("brushes_tab");
  const brushDropdown = document.getElementById("brushDropdown");
  const downloadBtn = document.getElementById("download_tab");
  const downloadDropdown = document.getElementById("downloadDropdown");
  const shapesButton = document.getElementById("shapes_tab");
  const shapeDropdown = document.getElementById("shapeDropdown");
  const eraserButton = document.getElementById("eraser_tab");
  const eraserDropdown = document.getElementById("eraserDropdown");

  brushButton.onclick = () => {
    brushDropdown.style.display = brushDropdown.style.display === "block" ? "none" : "block";
  };

  downloadBtn.onclick = () => {
    downloadDropdown.style.display = downloadDropdown.style.display === "block" ? "none" : "block";
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
  });

  shapesButton.onclick = () => {
    shapeDropdown.style.display = shapeDropdown.style.display === "block" ? "none" : "block";
  };

  document.querySelectorAll(".shape-option").forEach(button => {
    button.addEventListener("click", () => {
      updateStates({
        drawingShape: button.getAttribute("data-shape"),
        previousDrawingMode: globalDrawingMode,
        isFilling: false,
        isInsertingText: false
      });
      setDrawingMode(false);
      highlightTool("shapes_tab");
      shapeDropdown.style.display = "none";
    });
  });

  document.querySelectorAll(".brush-option").forEach(button => {
    button.addEventListener("click", () => {
      const selected = button.getAttribute("data");
      updateStates({ isFilling: false });
      if (selected !== "Eraser") updateStates({ currentBrush: selected });
      setBrush(selected);
      if (selected !== "Eraser") {
        updateStates({ globalDrawingMode: true });
        setDrawingMode(true);
        document.getElementById("pointerIcon").src = "./images/pencil-icon.png";
      }
      import('./canvas.js').then(({ updateCanvasVisibility }) => updateCanvasVisibility());
      highlightTool("brushes_tab");
      brushDropdown.style.display = "none";
    });
  });

  eraserButton.onclick = () => {
    eraserDropdown.style.display = eraserDropdown.style.display === "block" ? "none" : "block";
  };

  document.querySelectorAll(".eraser-option").forEach(button => {
    button.addEventListener("click", () => {
      const selected = button.getAttribute("data");
      updateStates({
        isPointerMode: false,
        globalDrawingMode: true,
        isFilling: false,
        isInsertingText: false,
        drawingShape: null
      });
      setDrawingMode(true);
      setBrush(selected);
      document.getElementById("pointerIcon").src = "./images/pencil-icon.png";
      highlightTool("eraser_tab");
      eraserDropdown.style.display = "none";
    });
  });

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
    updateStates({
      isPointerMode: newPointerState,
      globalDrawingMode: !newPointerState,
      isFilling: false,
      drawingShape: null,
      isInsertingText: false
    });
    setDrawingMode(!newPointerState);
    setBrush(currentBrush);
    document.getElementById("pointerIcon").src = newPointerState
      ? "./images/pointer-icon.png"
      : "./images/pencil-icon.png";
  };

  document.getElementById("thicknessSlider").addEventListener("input", function () {
    updateStates({ brushSize: parseInt(this.value) });
    setBrush(currentBrush);
  });

  document.getElementById("colorInput").addEventListener("input", function () {
    updateStates({ brushColor: this.value });
    setBrush(currentBrush);
    addRecentColor(this.value);
  });

  document.getElementById("undoBtn").onclick = undo;
  document.getElementById("redoBtn").onclick = redo;

  document.getElementById("clearBtn").onclick = () => {
    layers.forEach(layer => {
      layer.canvas.clear();
      layer.canvas.backgroundColor = 'transparent';
      saveState();
      layer.canvas.renderAll();
    });
  };

  document.getElementById("text_tab").onclick = () => {
    updateStates({
      previousDrawingMode: getActiveLayer().canvas.isDrawingMode,
      drawingShape: null,
      isInsertingText: true,
      isFilling: false
    });
    disableDrawingSilently();
    highlightTool("text_tab");
  };

  document.getElementById("bucket_tab").onclick = () => {
    updateStates({
      isFilling: true,
      isBucketActive: true,
      globalDrawingMode: false,
      drawingShape: null,
      isInsertingText: false
    });
    setDrawingMode(false);
    highlightTool("bucket_tab");
  };
}

function highlightTool(buttonId) { // blue margin effect that let you know when your button is on
  document.querySelectorAll(".menu-left button").forEach(btn => btn.classList.remove("tool-active"));
  const btn = document.getElementById(buttonId);
  if (btn) btn.classList.add("tool-active");
}

function addRecentColor(color) { // add the most recent colors
  const recentColors = JSON.parse(localStorage.getItem("recentColors") || "[]");
  const filtered = recentColors.filter(c => c !== color);
  filtered.unshift(color);
  const limited = filtered.slice(0, 6);
  localStorage.setItem("recentColors", JSON.stringify(limited));
  renderRecentColors();
}

function renderRecentColors() { // is the list of the most recent colors 
  const container = document.getElementById("recentColors");
  container.innerHTML = "";
  const recentColors = JSON.parse(localStorage.getItem("recentColors") || "[]");
  recentColors.forEach(color => {
    const btn = document.createElement("button");
    btn.style.backgroundColor = color;
    btn.title = color;
    btn.onclick = () => {
      updateStates({ brushColor: color });
      document.getElementById("colorInput").value = color;
      setBrush(color);
      addRecentColor(color);
    };
    container.appendChild(btn);
  });
}

export function updateMenuHeight() { // with this function we are sure that the menu pf all the tools, doesn't cover the space of the other things
  const menu = document.querySelector('#menu');
  if (menu) {
    const height = menu.offsetHeight + 'px';
    document.documentElement.style.setProperty('--menu-height', height);
    console.log('Impostato --menu-height a:', height);
  }
}
