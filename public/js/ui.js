// ui.js

import { setBrush, setDrawingMode, disableDrawingSilently } from './tool.js';
import { getActiveLayer, layers, initLayers, updateCanvasVisibility } from './canvas.js';
import { undo, redo, saveState } from './actions.js';
import {
  currentBrush,
  brushColor,
  brushSize,
  globalDrawingMode,
  setCurrentBrush,
  setBrushColor,
  setBrushSize,
  setPreviousDrawingMode,
  getIsPointerMode,
  updateStates
} from './state.js';
import { showConfirm } from './canvas-utils.js';

/**
 * Evidenzia lo strumento attivo aggiungendo/rimuovendo la classe.
 */
function highlightTool(buttonId) {
  document.querySelectorAll('.menu-left button, .menu-right button')
    .forEach(btn => btn.classList.remove('tool-active'));
  const btn = document.getElementById(buttonId);
  if (btn) btn.classList.add('tool-active');
}

/**
 * Gestisce l’apertura/chiusura di un dropdown a partire da due elementi.
 */
function toggleDropdown(buttonId, dropdownId) {
  const btn = document.getElementById(buttonId);
  const dd  = document.getElementById(dropdownId);
  if (!btn || !dd) return;

  btn.addEventListener('click', () => {
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
  });
}

/**
 * Chiude tutti i dropdown specificati (usato in click fuori).
 */
function closeAllDropdowns(dropdownIds) {
  dropdownIds.forEach(id => {
    const dd = document.getElementById(id);
    if (dd) dd.style.display = 'none';
  });
}

/**
 * Inizializza tutti i controlli UI: bottoni, slider, menu, ecc.
 */
export function initUIControls() {
  // dropdown toggle
  toggleDropdown('brushes_tab',    'brushDropdown');
  toggleDropdown('shapes_tab',     'shapeDropdown');
  toggleDropdown('eraser_tab',     'eraserDropdown');
  toggleDropdown('download_tab',   'downloadDropdown');
  toggleDropdown('layers_tab',     'layersPanel');

  // click fuori per chiudere i dropdown
  document.addEventListener('click', e => {
    if (!e.target.closest('#brushes_tab, #brushDropdown')) {
      closeAllDropdowns(['brushDropdown']);
    }
    if (!e.target.closest('#shapes_tab, #shapeDropdown')) {
      closeAllDropdowns(['shapeDropdown']);
    }
    if (!e.target.closest('#eraser_tab, #eraserDropdown')) {
      closeAllDropdowns(['eraserDropdown']);
    }
    if (!e.target.closest('#download_tab, #downloadDropdown')) {
      closeAllDropdowns(['downloadDropdown']);
    }
    if (!e.target.closest('#layers_tab, #layersPanel')) {
      const panel = document.getElementById('layersPanel');
      if (panel) panel.classList.remove('visible');
    }
  });

  // download formati immagine
  document.querySelectorAll('.download-option').forEach(button => {
    button.addEventListener('click', () => {
      const format = button.getAttribute('value');
      const width  = window.innerWidth;
      const height = window.innerHeight * 0.85;
      const merged = document.createElement('canvas');
      merged.width  = width;
      merged.height = height;
      const ctx = merged.getContext('2d');
      layers.forEach(layer => {
        if (layer.visible) {
          ctx.drawImage(layer.canvas.lowerCanvasEl, 0, 0);
        }
      });
      const dataURL = merged.toDataURL(`image/${format}`, 1.0);
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `drawing.${format}`;
      link.click();
    });
  });

  // selezione shape
  document.querySelectorAll('.shape-option').forEach(button => {
    button.addEventListener('click', () => {
      updateStates({
        drawingShape: button.dataset.shape,
        previousDrawingMode: globalDrawingMode,
        isFilling: false,
        isInsertingText: false
      });
      setDrawingMode(false);
      highlightTool('shapes_tab');
      document.getElementById('shapeDropdown').style.display = 'none';
    });
  });

  // selezione brush / gomma
  document.querySelectorAll('.brush-option').forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.brush || button.getAttribute('data');
      updateStates({ isFilling: false });
      if (selected !== 'Eraser') {
        updateStates({ currentBrush: selected, globalDrawingMode: true });
        setCurrentBrush(selected);
        setDrawingMode(true);
        document.getElementById('pointerIcon').src = './images/pencil-icon.png';
      } else {
        updateStates({ currentBrush: selected });
        setCurrentBrush(selected);
        setDrawingMode(true);
      }
      updateCanvasVisibility();
      highlightTool('brushes_tab');
      document.getElementById('brushDropdown').style.display = 'none';
    });
  });

  // gomma: singolo pulsante (separato se necessario)
  // già gestito dalle brush-option con brush="Eraser"

  // toggle puntatore vs disegno
  const pointerBtn = document.getElementById('pointerToggleBtn');
  if (pointerBtn) {
    pointerBtn.addEventListener('click', () => {
      const newPointer = !getIsPointerMode();
      updateStates({
        isPointerMode: newPointer,
        globalDrawingMode: !newPointer,
        isFilling: false,
        drawingShape: null,
        isInsertingText: false
      });
      setDrawingMode(!newPointer);
      setCurrentBrush(currentBrush);
      const icon = newPointer ? 'pointer-icon.png' : 'pencil-icon.png';
      document.getElementById('pointerIcon').src = `./images/${icon}`;
      const mobileIcon = document.getElementById('pointerIcon_mobile');
      if (mobileIcon) mobileIcon.src = `./images/${icon}`;
    });
  }

  // slider spessore
  const thickness = document.getElementById('thicknessSlider');
  if (thickness) {
    thickness.addEventListener('input', () => {
      const size = parseInt(thickness.value, 10);
      updateStates({ brushSize: size });
      setBrush(currentBrush);
    });
  }

  // selettore colore
  const colorInput = document.getElementById('colorInput');
  if (colorInput) {
    colorInput.addEventListener('input', () => {
      const col = colorInput.value;
      updateStates({ brushColor: col });
      setBrush(col);
      addRecentColor(col);
    });
  }

  // undo / redo
  document.getElementById('undoBtn')?.addEventListener('click', undo);
  document.getElementById('redoBtn')?.addEventListener('click', redo);

  // clear con conferma
  document.getElementById('clearBtn')?.addEventListener('click', async () => {
    const ok = await showConfirm('Sei sicuro di voler cancellare tutti i layer?');
    if (!ok) return;
    layers.forEach(layer => {
      layer.canvas.clear();
      layer.canvas.backgroundColor = 'transparent';
      saveState();
      layer.canvas.renderAll();
    });
  });

  // testo
  document.getElementById('text_tab')?.addEventListener('click', () => {
    updateStates({
      previousDrawingMode: getActiveLayer().canvas.isDrawingMode,
      drawingShape: null,
      isInsertingText: true,
      isFilling: false
    });
    disableDrawingSilently();
    highlightTool('text_tab');
  });

  // secchiello
  document.getElementById('bucket_tab')?.addEventListener('click', () => {
    updateStates({
      isFilling: true,
      isBucketActive: true,
      globalDrawingMode: false,
      drawingShape: null,
      isInsertingText: false
    });
    setDrawingMode(false);
    highlightTool('bucket_tab');
  });

  // inizializza recent colors
  renderRecentColors();
}

/**
 * Gestisce la lista dei colori recenti.
 */
function addRecentColor(color) {
  const recent = JSON.parse(localStorage.getItem('recentColors') || '[]')
    .filter(c => c !== color);
  recent.unshift(color);
  localStorage.setItem('recentColors', JSON.stringify(recent.slice(0, 6)));
  renderRecentColors();
}

function renderRecentColors() {
  const container = document.getElementById('recentColors');
  if (!container) return;
  container.innerHTML = '';
  JSON.parse(localStorage.getItem('recentColors') || '[]')
    .forEach(col => {
      const btn = document.createElement('button');
      btn.style.backgroundColor = col;
      btn.title = col;
      btn.addEventListener('click', () => {
        updateStates({ brushColor: col });
        document.getElementById('colorInput').value = col;
        setBrush(col);
        addRecentColor(col);
      });
      container.appendChild(btn);
    });
}

/**
 * Imposta la variabile CSS --menu-height in base al menu attivo.
 */
export function updateMenuHeight() {
  const isMobile = window.innerWidth <= 1068;
  const menuEl = document.querySelector(isMobile ? '#responsiveTopMenu' : '#menu');
  if (!menuEl) return;
  const h = menuEl.offsetHeight + 'px';
  document.documentElement.style.setProperty('--menu-height', h);
}

/**
 * Inizializza i menu responsive (mobile).
 */
export function initResponsiveMenus() {
  const leftMenu  = document.getElementById('responsiveLeftMenu');
  const rightMenu = document.getElementById('responsiveRightMenu');
  const topMenu   = document.getElementById('responsiveTopMenu');

  if (!(leftMenu && rightMenu && topMenu)) return;

  // toggle di visibilità
  document.getElementById('toggleLeftMenu')?.addEventListener('click', () => {
    leftMenu.classList.toggle('hidden');
    rightMenu.classList.add('hidden');
  });
  document.getElementById('toggleRightMenu')?.addEventListener('click', () => {
    rightMenu.classList.toggle('hidden');
    leftMenu.classList.add('hidden');
  });

  function populate() {
    leftMenu.innerHTML = `
      <button id="brushes_tab_mobile">Brushes</button>
      <button id="shapes_tab_mobile">Shapes</button>
      <button id="bucket_tab_mobile">Bucket</button>
      <button id="text_tab_mobile">Text</button>
      <button id="eraser_tab_mobile">Eraser</button>
      <button id="pointerToggleBtn_mobile">Pointer</button>
      <input type="color" id="colorInput_mobile" class="color-picker"/>
    `;
    rightMenu.innerHTML = `
      <button id="download_tab_mobile">Download</button>
      <button id="layers_tab_mobile">Layers</button>
      <button id="galleryBtn_mobile">Gallery</button>
      <button id="authToggleBtn_mobile">User</button>
      <button id="newCanvasBtn_mobile">New Canvas</button>
      <button id="undoBtn_mobile">Undo</button>
      <button id="redoBtn_mobile">Redo</button>
      <button id="clearBtn_mobile">Clear</button>
    `;
    // mappa mobile→desktop
    [
      ['brushes_tab',    'brushes_tab_mobile'],
      ['shapes_tab',     'shapes_tab_mobile'],
      ['bucket_tab',     'bucket_tab_mobile'],
      ['text_tab',       'text_tab_mobile'],
      ['eraser_tab',     'eraser_tab_mobile'],
      ['pointerToggleBtn','pointerToggleBtn_mobile'],
      ['download_tab',   'download_tab_mobile'],
      ['layers_tab',     'layers_tab_mobile'],
      ['galleryBtn',     'galleryBtn_mobile'],
      ['authToggleBtn',  'authToggleBtn_mobile'],
      ['newCanvasBtn',   'newCanvasBtn_mobile'],
      ['undoBtn',        'undoBtn_mobile'],
      ['redoBtn',        'redoBtn_mobile'],
      ['clearBtn',       'clearBtn_mobile']
    ].forEach(([desk, mob]) => {
      const d = document.getElementById(desk);
      const m = document.getElementById(mob);
      if (d && m) m.addEventListener('click', () => d.click());
    });
    // sincronizza color picker mobile→desktop
    const cm = document.getElementById('colorInput_mobile');
    const cd = document.getElementById('colorInput');
    if (cm && cd) {
      cm.value = cd.value;
      cm.addEventListener('input', e => {
        cd.value = e.target.value;
        cd.dispatchEvent(new Event('input'));
      });
    }
  }

  function handleResize() {
    if (window.innerWidth <= 1068) {
      topMenu.classList.remove('hidden');
      leftMenu.classList.remove('hidden');
      rightMenu.classList.remove('hidden');
      populate();
    } else {
      topMenu.classList.add('hidden');
      leftMenu.classList.add('hidden');
      rightMenu.classList.add('hidden');
      // rimetti i dropdown sui wrapper originali
      updateMenuHeight();
      closeAllDropdowns(['brushDropdown','shapeDropdown','eraserDropdown','downloadDropdown']);
    }
  }

  window.addEventListener('resize', handleResize);
  handleResize();
}
