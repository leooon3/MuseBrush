import { saveState } from './actions.js';
import { updateStates } from './state.js';

function hexToRgba(hex) { //transform the hexadecimal to rgba data
  const bigint = parseInt(hex.replace('#', ''), 16);
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255,
    255
  ];
}

function getPixelColor(imgData, x, y) { // takes the color of the pixel 
  const index = (y * imgData.width + x) * 4;
  return imgData.data.slice(index, index + 4);
}

function setPixelColor(imgData, x, y, [r, g, b, a]) { // modify the pixel
  const index = (y * imgData.width + x) * 4;
  imgData.data[index] = r;
  imgData.data[index + 1] = g;
  imgData.data[index + 2] = b;
  imgData.data[index + 3] = a;
}

function colorsMatch(a, b, tolerance = 32) { // checks if the color is equal with a margin
  return Math.abs(a[0] - b[0]) < tolerance &&
         Math.abs(a[1] - b[1]) < tolerance &&
         Math.abs(a[2] - b[2]) < tolerance &&
         Math.abs(a[3] - b[3]) < tolerance;
}

export function floodFillFromPoint(fabricCanvas, x, y, fillColorHex) { // the function to actually fill the space
  const width = fabricCanvas.getWidth();
  const height = fabricCanvas.getHeight();

  const fillCanvas = document.createElement("canvas");
  fillCanvas.width = width;
  fillCanvas.height = height;
  const fillCtx = fillCanvas.getContext("2d");

  const renderCanvas = document.createElement("canvas");
  renderCanvas.width = width;
  renderCanvas.height = height;
  const renderCtx = renderCanvas.getContext("2d");

  const renderDataUrl = fabricCanvas.toDataURL({ format: 'png' });
  const img = new Image();

  img.onload = () => {
    renderCtx.drawImage(img, 0, 0);
    const renderData = renderCtx.getImageData(0, 0, width, height);
    const fillData = fillCtx.getImageData(0, 0, width, height);

    const vt = fabricCanvas.viewportTransform;
    const zoom = fabricCanvas.getZoom();
    const rawX = Math.round(x * zoom + vt[4]);
    const rawY = Math.round(y * zoom + vt[5]);

    const startColor = getPixelColor(renderData, rawX, rawY);
    const fillColor = hexToRgba(fillColorHex);
    if (colorsMatch(startColor, fillColor)) return;

    const queue = [[rawX, rawY]];
    const visited = new Uint8Array(width * height);

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;

      const idx = cy * width + cx;
      if (visited[idx]) continue;

      const currentColor = getPixelColor(renderData, cx, cy);
      if (!colorsMatch(currentColor, startColor)) continue;

      setPixelColor(fillData, cx, cy, fillColor);
      visited[idx] = 1;

      queue.push([cx + 1, cy]);
      queue.push([cx - 1, cy]);
      queue.push([cx, cy + 1]);
      queue.push([cx, cy - 1]);
    }

    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4 + 3;
        if (fillData.data[i] !== 0) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    const fillWidth = maxX - minX + 1;
    const fillHeight = maxY - minY + 1;

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = fillWidth;
    croppedCanvas.height = fillHeight;
    const croppedCtx = croppedCanvas.getContext("2d");

    const croppedImageData = croppedCtx.createImageData(fillWidth, fillHeight);
    for (let y = 0; y < fillHeight; y++) {
      for (let x = 0; x < fillWidth; x++) {
        const srcIndex = ((y + minY) * width + (x + minX)) * 4;
        const dstIndex = (y * fillWidth + x) * 4;
        croppedImageData.data[dstIndex]     = fillData.data[srcIndex];
        croppedImageData.data[dstIndex + 1] = fillData.data[srcIndex + 1];
        croppedImageData.data[dstIndex + 2] = fillData.data[srcIndex + 2];
        croppedImageData.data[dstIndex + 3] = fillData.data[srcIndex + 3];
      }
    }

    croppedCtx.putImageData(croppedImageData, 0, 0);

    fabric.Image.fromURL(croppedCanvas.toDataURL(), (fillImg) => {
      const adjustedLeft = (minX - vt[4]) / zoom;
      const adjustedTop = (minY - vt[5]) / zoom;

      fillImg.set({
        left: adjustedLeft,
        top: adjustedTop,
        originX: 'left',
        originY: 'top',
        scaleX: 1 / zoom,
        scaleY: 1 / zoom,
        selectable: true,
        evented: true
      });

      let target = fabricCanvas.getObjects()
        .filter(obj => obj.type !== 'image')
        .find(obj => {
          const bounds = obj.getBoundingRect(true);
          return (
            x >= bounds.left &&
            x <= bounds.left + bounds.width &&
            y >= bounds.top &&
            y <= bounds.top + bounds.height
          );
        });

      if (target && fabricCanvas.getObjects().includes(target)) {
        const originalLeft = target.left;
        const originalTop = target.top;

        target.set({ left: 0, top: 0, originX: 'left', originY: 'top' });

        fillImg.set({
          left: adjustedLeft - originalLeft,
          top: adjustedTop - originalTop
        });

        const group = new fabric.Group([target, fillImg], {
          left: originalLeft,
          top: originalTop,
          originX: 'left',
          originY: 'top',
          selectable: true,
          evented: true
        });

        fabricCanvas.remove(target);
        fabricCanvas.add(group);
        fabricCanvas.setActiveObject(group);
      } else {
        fabricCanvas.add(fillImg);
      }

      fabricCanvas.requestRenderAll();
      saveState();
      updateStates({
        isFilling: false,
        isBucketActive: false,
        globalDrawingMode: true
      });
    });
  };

  img.src = renderDataUrl;
}