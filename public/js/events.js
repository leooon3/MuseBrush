import {
  currentBrush, brushColor, brushSize, isFilling, isBucketActive, isInsertingText,
  drawingShape, previousDrawingMode, shapeObject, shapeOrigin,
  setDrawingShape, setShapeObject, setShapeOrigin, setIsInsertingText,
  setIsDrawingShape
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
    const pointer = canvas.getPointer(opt.e);

    if (isFilling && isBucketActive) {
      const pixel = fabricToCanvasCoords(canvas, pointer);
      floodFillFromPoint(canvas, pixel.x, pixel.y, brushColor);
      setIsFilling(false);
      setIsBucketActive(false);
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
      setIsInsertingText(false);
      setDrawingMode(previousDrawingMode);
      setBrush(currentBrush);
      return;
    }

    if (!drawingShape) return;

    setIsDrawingShape(true);
    setShapeOrigin({ x: pointer.x, y: pointer.y });

    let shape = null;
    switch (drawingShape) {
      case "rect":
        shape = new fabric.Rect({
          left: pointer.x, top: pointer.y,
          width: 1, height: 1,
          fill: null, stroke: brushColor,
          strokeWidth: brushSize, erasable: true
        });
        break;
      case "circle":
        shape = new fabric.Circle({
          left: pointer.x, top: pointer.y,
          radius: 1, fill: null, stroke: brushColor,
          strokeWidth: brushSize, erasable: true
        });
        break;
      case "line":
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x + 1, pointer.y + 1], {
          stroke: brushColor, strokeWidth: brushSize,
          fill: null, erasable: true
        });
        break;
    }

    if (shape) {
      setShapeObject(shape);
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.requestRenderAll();
    }
  });

  canvas.on("mouse:move", function (opt) {
    if (!shapeObject) return;
    const pointer = canvas.getPointer(opt.e);

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
    setIsDrawingShape(false);
    setShapeObject(null);
    setDrawingShape(null);
    setDrawingMode(previousDrawingMode);
    setBrush(currentBrush);
    saveState();
  });
}
