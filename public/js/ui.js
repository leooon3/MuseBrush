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
  const layersButton    = document.getElementById("layers_tab");
  const layersPanel     = document.getElementById("layersPanel");
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


  const pointerBtn = document.getElementById("pointerToggleBtn");
pointerBtn.onclick = () => {
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

  const iconSrc = newPointerState
    ? "./images/pointer-icon.png"
    : "./images/pencil-icon.png";

  document.getElementById("pointerIcon").src = iconSrc;
  const mobileIcon = document.getElementById("pointerIcon_mobile");
  if (mobileIcon) mobileIcon.src = iconSrc;
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
  document.addEventListener('click', function(e) {
    if (
      !e.target.closest('#brushes_tab') &&
      !e.target.closest('#brushDropdown') &&
      !e.target.closest('#brushes_tab_mobile')
    ) {
      document.getElementById('brushDropdown').style.display = 'none';
    }
    if (
      !e.target.closest('#shapes_tab') &&
      !e.target.closest('#shapeDropdown') &&
      !e.target.closest('#shapes_tab_mobile')
    ) {
      document.getElementById('shapeDropdown').style.display = 'none';
    }
    if (
      !e.target.closest('#eraser_tab') &&
      !e.target.closest('#eraserDropdown') &&
      !e.target.closest('#eraser_tab_mobile')
    ) {
      document.getElementById('eraserDropdown').style.display = 'none';
    }
    if (
      !e.target.closest('#download_tab') &&
      !e.target.closest('#downloadDropdown') &&
      !e.target.closest('#download_tab_mobile')
    ) {
      document.getElementById('downloadDropdown').style.display = 'none';
    }
    if (
      !e.target.closest('#layers_tab') &&
      !e.target.closest('#layersPanel') &&
      !e.target.closest('#layers_tab_mobile')
    ) {
      document.getElementById('layersPanel').classList.remove('visible');
    }
  });
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

export function updateMenuHeight() {
  // Sceglie quale menu misurare a seconda del breakpoint 1068px
  const isMobile = window.innerWidth <= 1068;
  const menuEl  = document.querySelector(isMobile ? '#responsiveTopMenu' : '#menu');
  if (menuEl) {
    const height = menuEl.offsetHeight + 'px';
    document.documentElement.style.setProperty('--menu-height', height);
    console.log('Impostato --menu-height a:', height);
  }
}

export function initResponsiveMenus() {
  const leftMenu  = document.getElementById("responsiveLeftMenu");
  const rightMenu = document.getElementById("responsiveRightMenu");
  const topMenu   = document.getElementById("responsiveTopMenu");
  document.getElementById("toggleLeftMenu").onclick = () => {
    leftMenu .classList.toggle("hidden");
    rightMenu.classList.add("hidden");
  };
  document.getElementById("toggleRightMenu").onclick = () => {
    rightMenu.classList.toggle("hidden");
    leftMenu .classList.add("hidden");
  };

function populateResponsiveMenus() {
  leftMenu.innerHTML = `
    <button id="brushes_tab_mobile">
      <img src="./images/brush.png"/><span class="btn-label">Brushes</span>
    </button>
    <button id="shapes_tab_mobile">
      <img src="./images/square.png"/><span class="btn-label">Shapes</span>
    </button>
    <button id="bucket_tab_mobile">
      <img src="./images/bucket.png"/><span class="btn-label">Bucket</span>
    </button>
    <button id="text_tab_mobile">
      <img src="./images/text.png"/><span class="btn-label">Text</span>
    </button>
    <button id="eraser_tab_mobile">
      <img src="./images/eraser.png"/><span class="btn-label">Eraser</span>
    </button>
    <button id="pointerToggleBtn_mobile">
      <img id="pointerIcon_mobile" src="./images/pointer-icon.png"/><span class="btn-label">Pointer</span>
    </button>
    <input type="color" id="colorInput_mobile" class="color-picker"/>
  `;
  rightMenu.innerHTML = `
    <button id="download_tab_mobile">
      <img src="./images/downloads.png"/><span class="btn-label">Download</span>
    </button>
    <button id="layers_tab_mobile">
      <img src="./images/layers.png"/><span class="btn-label">Layers</span>
    </button>
    <button id="galleryBtn_mobile">
      <img src="./images/gallery.png"/><span class="btn-label">Gallery</span>
    </button>
    <button id="authToggleBtn_mobile">
      <img src="./images/user.png"/><span class="btn-label">User</span>
    </button>
    <button id="newCanvasBtn_mobile">
      <img src="./images/new-canva.png"/><span class="btn-label">New Canvas</span>
    </button>
    <button id="undoBtn_mobile">
      <img src="./images/undo.png"/><span class="btn-label">Undo</span>
    </button>
    <button id="redoBtn_mobile">
      <img src="./images/arrow.png"/><span class="btn-label">Redo</span>
    </button>
    <button id="clearBtn_mobile">
      <img src="https://icons.veryicon.com/png/o/miscellaneous/flat-wireframe-library/trash-bin-3.png"/>
      <span class="btn-label">Clear</span>
    </button>
  `;
  [
    ["brushes_tab_mobile", "brushDropdown"],
    ["shapes_tab_mobile",  "shapeDropdown"],
    ["eraser_tab_mobile",  "eraserDropdown"],
    ["download_tab_mobile","downloadDropdown"]
  ].forEach(([btnId, ddId]) => {
    const btn = document.getElementById(btnId);
    btn.onclick = e => {
      const dd = document.getElementById(ddId);
      const portal = document.getElementById("globalDropdowns");
      if (dd.parentElement !== portal) portal.appendChild(dd);
      const { left, bottom } = e.currentTarget.getBoundingClientRect();
      dd.style.position = "fixed";
      dd.style.top      = `${bottom}px`;
      dd.style.left     = `${left}px`;
      dd.style.zIndex   = "2000";
      dd.style.display  = dd.style.display === "block" ? "none" : "block";
    };
  });

  [
    ["bucket_tab",       "bucket_tab_mobile"],
    ["pointerToggleBtn", "pointerToggleBtn_mobile"],
    ["layers_tab",       "layers_tab_mobile"],
    ["galleryBtn",       "galleryBtn_mobile"],
    ["authToggleBtn",    "authToggleBtn_mobile"],
    ["newCanvasBtn",     "newCanvasBtn_mobile"],
    ["undoBtn",          "undoBtn_mobile"],
    ["redoBtn",          "redoBtn_mobile"],
    ["clearBtn",         "clearBtn_mobile"],
    ["text_tab",         "text_tab_mobile"]
  ].forEach(([deskId, mobId]) => {
    const desk = document.getElementById(deskId);
    const mob  = document.getElementById(mobId);
    if (desk && mob) mob.onclick = () => desk.click();
  });
  const cm = document.getElementById("colorInput_mobile");
  const co = document.getElementById("colorInput");
  if (cm && co) {
    cm.value   = co.value;
    cm.oninput = e => {
      co.value = e.target.value;
      co.dispatchEvent(new Event("input"));
    };
  }
}
function resetDropdowns() {
  const leftWrappers = Array.from(
    document.querySelectorAll('#menu .menu-left > .dropdown-wrapper')
  );
  const rightWrapper = document.querySelector(
    '#menu .menu-right > .dropdown-wrapper'
  );

  const mappings = [
    { id: 'brushDropdown',  wrapper: leftWrappers[0] },
    { id: 'shapeDropdown',  wrapper: leftWrappers[1] },
    { id: 'eraserDropdown', wrapper: leftWrappers[2] },
    { id: 'downloadDropdown', wrapper: rightWrapper }
  ];

  mappings.forEach(({ id, wrapper }) => {
    const dd = document.getElementById(id);
    if (dd && wrapper && dd.parentElement !== wrapper) {
      ['position', 'top', 'left', 'zIndex', 'display']
        .forEach(prop => dd.style[prop] = '');
      wrapper.appendChild(dd);
    }
  });
}

  function handleResponsive() {
    if (window.innerWidth <= 1068) {
      topMenu .classList.remove("hidden");
      leftMenu.classList.remove("hidden");
      rightMenu.classList.remove("hidden");
      populateResponsiveMenus();
    } else {
      topMenu .classList.add("hidden");
      leftMenu.classList.add("hidden");
      rightMenu.classList.add("hidden");
      resetDropdowns();
    }
  }

  window.addEventListener("resize", handleResponsive);
  handleResponsive();
}