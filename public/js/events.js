// ✅ events.js aggiornato con updateStates

import {
  currentBrush, brushColor, brushSize, isFilling, isBucketActive, isInsertingText,
  drawingShape, previousDrawingMode, shapeObject, shapeOrigin, isDrawingShape,
  updateStates
} from './state.js';

import { fabricToCanvasCoords, saveState } from './actions.js';
import { floodFillFromPoint } from './fill.js';
import { setBrush, setDrawingMode } from './tool.js';

export function attachCanvasEvents(canvas) {
  canvas.on("path:created", (opt) => {
    const path = opt.path;
    canvas.renderAll();
    saveState();
  });

  canvas.on("mouse:down", function (opt) {
    const pointer = canvas.getPointer(opt.e, false);

    if (isFilling && isBucketActive) {
      const canvasCoords = fabricToCanvasCoords(canvas, pointer);
      floodFillFromPoint(canvas, canvasCoords.x, canvasCoords.y, brushColor);
      saveState();
      canvas.renderAll();
      updateStates({
        isFilling: false,
        isBucketActive: false,
        globalDrawingMode: true
      });
      setDrawingMode(true);
      setBrush(currentBrush);
      return;
    }

    if (isInsertingText) {
      const text = new fabric.IText("Testo", {
        left: pointer.x,
        top: pointer.y,
        fontFamily: 'Arial',
        fontSize: 24,
        fill: brushColor
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      saveState();
      updateStates({ isInsertingText: false });
      return;
    }

    if (!drawingShape) return;

    canvas.isDrawingMode = false;
    updateStates({
      isDrawingShape: true,
      shapeOrigin: { x: pointer.x, y: pointer.y }
    });
  });

  canvas.on("mouse:move", function (opt) {
    if (!isDrawingShape) return;
    const pointer = canvas.getPointer(opt.e, false);

    if (!shapeObject) {
      let shape = null;
      switch (drawingShape) {
        case "rect":
          shape = new fabric.Rect({
            left: shapeOrigin.x,
            top: shapeOrigin.y,
            width: 1,
            height: 1,
            fill: null,
            stroke: brushColor,
            strokeWidth: brushSize,
            erasable: true,
            selectable: true
          });
          break;
        case "circle":
          shape = new fabric.Circle({
            left: shapeOrigin.x,
            top: shapeOrigin.y,
            radius: 1,
            fill: null,
            stroke: brushColor,
            strokeWidth: brushSize,
            erasable: true,
            selectable: true
          });
          break;
        case "line":
          shape = new fabric.Line([
            shapeOrigin.x, shapeOrigin.y, shapeOrigin.x, shapeOrigin.y
          ], {
            stroke: brushColor,
            strokeWidth: brushSize,
            fill: null,
            erasable: true,
            selectable: true
          });
          break;
      }
      updateStates({ shapeObject: shape });
      canvas.add(shape);
      canvas.setActiveObject(shape);
    }

    switch (drawingShape) {
      case "rect":
        shapeObject.set({
          width: Math.abs(pointer.x - shapeOrigin.x),
          height: Math.abs(pointer.y - shapeOrigin.y),
          left: Math.min(pointer.x, shapeOrigin.x),
          top: Math.min(pointer.y, shapeOrigin.y)
        });
        break;
      case "circle":
        const dx = pointer.x - shapeOrigin.x;
        const dy = pointer.y - shapeOrigin.y;
        const radius = Math.sqrt(dx * dx + dy * dy) / 2;
        shapeObject.set({
          radius: radius,
          left: (pointer.x + shapeOrigin.x) / 2 - radius,
          top: (pointer.y + shapeOrigin.y) / 2 - radius
        });
        break;
      case "line":
        shapeObject.set({
          x2: pointer.x,
          y2: pointer.y
        });
        break;
    }

    shapeObject.setCoords();
    canvas.requestRenderAll();
  });

  canvas.on("mouse:up", function () {
    if (isDrawingShape) {
      updateStates({
        isDrawingShape: false,
        shapeObject: null,
        drawingShape: null
      });
      setDrawingMode(previousDrawingMode);
    }
    setBrush(currentBrush);
    saveState();
  });
}
