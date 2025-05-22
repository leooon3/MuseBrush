// fill.js

import { saveState } from './actions.js';
import { updateStates } from './state.js';

/**
 * Converte un colore esadecimale in un array RGBA.
 * @param {string} hex – E.g. "#ff0000"
 * @returns {[number,number,number,number]}
 */
function hexToRgba(hex) {
  const bigint = parseInt(hex.replace(/^#/, ''), 16);
  return [
    (bigint >> 16) & 0xFF,
    (bigint >>  8) & 0xFF,
     bigint        & 0xFF,
    0xFF
  ];
}

/**
 * Legge il colore di un pixel in ImageData.
 */
function getPixelColor(imgData, x, y) {
  const idx = (y * imgData.width + x) * 4;
  return imgData.data.slice(idx, idx + 4);
}

/**
 * Scrive un colore RGBA in ImageData.
 */
function setPixelColor(imgData, x, y, [r, g, b, a]) {
  const idx = (y * imgData.width + x) * 4;
  imgData.data[idx    ] = r;
  imgData.data[idx + 1] = g;
  imgData.data[idx + 2] = b;
  imgData.data[idx + 3] = a;
}

/**
 * Confronta due colori RGBA entro una tolleranza.
 */
function colorsMatch(a, b, tol = 32) {
  return Math.abs(a[0] - b[0]) < tol &&
         Math.abs(a[1] - b[1]) < tol &&
         Math.abs(a[2] - b[2]) < tol &&
         Math.abs(a[3] - b[3]) < tol;
}

/**
 * Esegue il flood-fill a partire dal punto (x,y) nel fabricCanvas.
 * @param {fabric.Canvas} fabricCanvas
 * @param {number} x – coordinata canvas
 * @param {number} y – coordinata canvas
 * @param {string} fillColorHex – es. "#00ff00"
 */
export function floodFillFromPoint(fabricCanvas, x, y, fillColorHex) {
  const width  = fabricCanvas.getWidth();
  const height = fabricCanvas.getHeight();

  // canvas offscreen per lettura e scrittura pixel
  const readCanvas  = document.createElement('canvas');
  const writeCanvas = document.createElement('canvas');
  [readCanvas, writeCanvas].forEach(c => {
    c.width  = width;
    c.height = height;
  });
  const readCtx  = readCanvas.getContext('2d');
  const writeCtx = writeCanvas.getContext('2d');

  // Disegna lo snapshot del fabricCanvas in readCanvas
  const dataUrl = fabricCanvas.toDataURL({ format: 'png' });
  const img = new Image();
  img.onload = () => {
    readCtx.drawImage(img, 0, 0, width, height);
    writeCtx.drawImage(img, 0, 0, width, height);

    const srcData = readCtx.getImageData(0, 0, width, height);
    const dstData = writeCtx.getImageData(0, 0, width, height);

    // Calcola coordinate reali considerando zoom e viewport
    const [vt0, , , , vt4, vt5] = fabricCanvas.viewportTransform;
    const zoom = fabricCanvas.getZoom();
    const startX = Math.round(x * zoom + vt4);
    const startY = Math.round(y * zoom + vt5);

    const targetColor = getPixelColor(srcData, startX, startY);
    const fillColor   = hexToRgba(fillColorHex);
    if (colorsMatch(targetColor, fillColor)) return;

    // BFS per flood-fill
    const queue   = [[startX, startY]];
    const visited = new Uint8Array(width * height);

    while (queue.length) {
      const [cx, cy] = queue.shift();
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
      const idx = cy * width + cx;
      if (visited[idx]) continue;

      const current = getPixelColor(srcData, cx, cy);
      if (!colorsMatch(current, targetColor)) continue;

      setPixelColor(dstData, cx, cy, fillColor);
      visited[idx] = 1;

      queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    // Trova il bounding box dell’area riempita
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        if (dstData.data[(py * width + px) * 4 + 3] !== 0) {
          if (px < minX) minX = px;
          if (py < minY) minY = py;
          if (px > maxX) maxX = px;
          if (py > maxY) maxY = py;
        }
      }
    }
    const boxW = maxX - minX + 1;
    const boxH = maxY - minY + 1;

    // Crea un canvas ritagliato con solo l’area riempita
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width  = boxW;
    cropCanvas.height = boxH;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.putImageData(
      writeCtx.getImageData(minX, minY, boxW, boxH),
      0, 0
    );

    // Aggiunge l’immagine ritagliata al fabricCanvas
    const croppedDataUrl = cropCanvas.toDataURL();
    fabric.Image.fromURL(croppedDataUrl, fillImg => {
      // Posiziona e scala correttamente l’overlay
      const left = (minX - vt4) / zoom;
      const top  = (minY - vt5) / zoom;
      fillImg.set({
        left, top,
        originX: 'left', originY: 'top',
        scaleX: 1 / zoom, scaleY: 1 / zoom,
        selectable: true, evented: true
      });

      // Seleziona un oggetto vettoriale sotto il punto per raggrupparlo
      const targetObj = fabricCanvas
        .getObjects()
        .filter(o => o.type !== 'image')
        .find(o => {
          const b = o.getBoundingRect(true);
          return x >= b.left && x <= b.left + b.width &&
                 y >= b.top  && y <= b.top  + b.height;
        });

      if (targetObj) {
        const origLeft = targetObj.left, origTop = targetObj.top;
        targetObj.set({ left: 0, top: 0 });
        fillImg.set({ left: left - origLeft, top: top - origTop });
        const group = new fabric.Group([targetObj, fillImg], {
          left: origLeft, top: origTop,
          originX: 'left', originY: 'top',
          selectable: true, evented: true
        });
        fabricCanvas.remove(targetObj);
        fabricCanvas.add(group);
        fabricCanvas.setActiveObject(group);
      } else {
        fabricCanvas.add(fillImg);
      }

      fabricCanvas.requestRenderAll();
      saveState();
      updateStates({
        isFilling:      false,
        isBucketActive: false,
        globalDrawingMode: true
      });
    });
  };

  img.src = dataUrl;
}
