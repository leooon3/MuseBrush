// ui.js

import { setBrush, setDrawingMode, disableDrawingSilently } from './tool.js';
import { getActiveLayer, layers, updateCanvasVisibility } from './canvas.js';
import { undo, redo, saveState } from './actions.js';
import {
  currentBrush,
  brushColor,
  brushSize,
  globalDrawingMode,
  getIsPointerMode,
  updateStates
} from './state.js';
import { showConfirm } from './canvas-utils.js';

/** Rimuove .tool-active da tutti e aggiunge a buttonId */
function highlightTool(buttonId) {
  document.querySelectorAll('button.tool-active')
    .forEach(btn => btn.classList.remove('tool-active'));
  const btn = document.getElementById(buttonId);
  if (btn) btn.classList.add('tool-active');
}

/** Gestisce apertura/chiusura dropdown (escluso layersPanel) */
function toggleDropdown(btnId, ddId) {
  const btn = document.getElementById(btnId);
  const dd  = document.getElementById(ddId);
  if (!btn || !dd) return;
  btn.addEventListener('click', e => {
    e.stopPropagation();
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
  });
}

/** Chiude tutti i dropdown passati */
function closeAll(ids) {
  ids.forEach(id => {
    const dd = document.getElementById(id);
    if (dd) dd.style.display = 'none';
  });
}

export function initUIControls() {
  // Dropdowns
  toggleDropdown('brushes_tab',  'brushDropdown');
  toggleDropdown('shapes_tab',   'shapeDropdown');
  toggleDropdown('eraser_tab',   'eraserDropdown');
  toggleDropdown('download_tab', 'downloadDropdown');

  // Clic fuori chiude dropdown
  document.addEventListener('click', () => {
    closeAll(['brushDropdown','shapeDropdown','eraserDropdown','downloadDropdown']);
  });

  // Brush & Eraser
  document.querySelectorAll('.brush-option, .eraser-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const brush = btn.dataset.brush;
      updateStates({
        currentBrush: brush,
        isFilling: false,
        drawingShape: null,
        isInsertingText: false
      });
      setBrush(brush);
      highlightTool('brushes_tab');
      document.getElementById('brushDropdown').style.display = 'none';
    });
  });

  // Shapes
  document.querySelectorAll('.shape-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const shape = btn.dataset.shape;
      updateStates({
        drawingShape: shape,
        previousDrawingMode: globalDrawingMode,
        isFilling: false,
        isInsertingText: false
      });
      setDrawingMode(false);
      highlightTool('shapes_tab');
      document.getElementById('shapeDropdown').style.display = 'none';
    });
  });

  // Bucket
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

  // Text
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

  // Pointer toggle
  document.getElementById('pointerToggleBtn')?.addEventListener('click', () => {
    const newPtr = !getIsPointerMode();
    updateStates({
      isPointerMode: newPtr,
      globalDrawingMode: !newPtr,
      isFilling: false,
      drawingShape: null,
      isInsertingText: false
    });
    setDrawingMode(!newPtr);
    highlightTool('pointerToggleBtn');
  });

  // Color picker
  document.getElementById('colorInput')?.addEventListener('input', e => {
    updateStates({ brushColor: e.target.value });
    setBrush(currentBrush);
  });

  // Thickness slider
  document.getElementById('thicknessSlider')?.addEventListener('input', e => {
    updateStates({ brushSize: parseInt(e.target.value, 10) });
    setBrush(currentBrush);
  });

  // Download options
  document.querySelectorAll('.download-option').forEach(btn => {
    btn.addEventListener('click', () => {
      highlightTool('download_tab');
      document.getElementById('downloadDropdown').style.display = 'none';
    });
  });

  // Undo / Redo / Clear
  document.getElementById('undoBtn')?.addEventListener('click', undo);
  document.getElementById('redoBtn')?.addEventListener('click', redo);
  document.getElementById('clearBtn')?.addEventListener('click', async () => {
    if (await showConfirm('Cancella tutti i layer?')) {
      layers.forEach(l => {
        l.canvas.clear();
        saveState();
      });
      updateCanvasVisibility();
    }
  });
}

/**
 * Calcola e imposta la variabile CSS --menu-height in base al menu corrente.
 */
export function updateMenuHeight() {
  const isMobile = window.innerWidth <= 1068;
  const menuEl = document.querySelector(isMobile ? '#responsiveTopMenu' : '#menu');
  if (!menuEl) return;
  document.documentElement.style.setProperty(
    '--menu-height',
    `${menuEl.offsetHeight}px`
  );
}

/**
 * Inizializza i menu responsive (mobile).
 */
export function initResponsiveMenus() {
  const leftMenu   = document.getElementById('responsiveLeftMenu');
  const rightMenu  = document.getElementById('responsiveRightMenu');
  const topMenu    = document.getElementById('responsiveTopMenu');

  if (!(leftMenu && rightMenu && topMenu)) return;

  document.getElementById('toggleLeftMenu')?.addEventListener('click', () => {
    leftMenu.classList.toggle('hidden');
    rightMenu.classList.add('hidden');
  });
  document.getElementById('toggleRightMenu')?.addEventListener('click', () => {
    rightMenu.classList.toggle('hidden');
    leftMenu.classList.add('hidden');
  });

  // Mappa desktop ↔ mobile per tutti i bottoni (inclusi auth e gallery)
  const mapping = [
    'brushes_tab', 'brushes_tab_mobile',
    'shapes_tab', 'shapes_tab_mobile',
    'bucket_tab', 'bucket_tab_mobile',
    'text_tab', 'text_tab_mobile',
    'eraser_tab', 'eraser_tab_mobile',
    'pointerToggleBtn', 'pointerToggleBtn_mobile',
    'download_tab', 'download_tab_mobile',
    'layers_tab', 'layers_tab_mobile',
    'galleryBtn', 'galleryBtn_mobile',
    'authToggleBtn', 'authToggleBtn_mobile',
    'newCanvasBtn', 'newCanvasBtn_mobile',
    'loginBtn', 'loginBtn_mobile',
    'signupBtn', 'signupBtn_mobile',
    'googleLoginBtn', 'googleLoginBtn_mobile',
    'forgotPasswordBtn', 'forgotPasswordBtn_mobile',
    'resendVerificationBtn', 'resendVerificationBtn_mobile',
    'logoutBtn', 'logoutBtn_mobile',
    'undoBtn', 'undoBtn_mobile',
    'redoBtn', 'redoBtn_mobile',
    'clearBtn', 'clearBtn_mobile',
    'exportProjectBtn', 'exportProjectBtn_mobile',
    'saveCanvasBtn', 'saveCanvasBtn_mobile',
    'updateProjectBtn', 'updateProjectBtn_mobile'
  ];

  // Crea i bottoni nella UI mobile e collega i click
  function populate() {
    // ... (come prima) ...
    // dopodiché:
    for (let i = 0; i < mapping.length; i += 2) {
      const desk = document.getElementById(mapping[i]);
      const mob  = document.getElementById(mapping[i+1]);
      if (desk && mob) {
        mob.addEventListener('click', () => desk.click());
      }
    }
    // Assicuriamoci che anche i dropdown mobile funzionino:
    // chiamiamo initUIControls() per ricollegare gli eventi ai nuovi elementi
    initUIControls();
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
      // reset su desktop
      document.documentElement.style.setProperty('--menu-height', `${document.getElementById('menu').offsetHeight}px`);
      closeAll(['brushDropdown','shapeDropdown','eraserDropdown','downloadDropdown']);
    }
  }

  window.addEventListener('resize', handleResize);
  handleResize();
}
