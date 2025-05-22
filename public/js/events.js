// events.js

import {
  getCurrentBrush,
  getBrushColor,
  getBrushSize,
  getIsFilling,
  getIsBucketActive,
  getIsInsertingText,
  getDrawingShape,
  getPreviousDrawingMode,
  getShapeObject,
  getShapeOrigin,
  getIsDrawingShape,
  updateStates
} from './state.js';
import { fabricToCanvasCoords, saveState } from './actions.js';
import { floodFillFromPoint } from './fill.js';
import { setBrush, setDrawingMode } from './tool.js';

/**
 * Registra tutti gli event handler sul canvas Fabric.
 * @param {fabric.Canvas} canvas
 */
export function attachCanvasEvents(canvas) {
  // 🔖 Path created: salva lo stato dopo ogni tracciato disegnato
  canvas.on('path:created', () => {
    canvas.renderAll();
    saveState();
  });

  // 🖱 Mouse down: gestione bucket-fill, inserimento testo e inizio shape draw
  canvas.on('mouse:down', opt => {
    const pointer = canvas.getPointer(opt.e, false);

    // 1️⃣ Bucket fill
    if (getIsFilling() && getIsBucketActive()) {
      const { x, y } = fabricToCanvasCoords(canvas, pointer);
      floodFillFromPoint(canvas, x, y, getBrushColor());
      saveState();
      canvas.renderAll();
      updateStates({
        isFilling: false,
        isBucketActive: false,
        globalDrawingMode: true
      });
      setDrawingMode(true);
      setBrush(getCurrentBrush());
      return;
    }

    // 2️⃣ Inserimento testo
    if (getIsInsertingText()) {
      const text = new fabric.IText('Testo', {
        left: pointer.x,
        top: pointer.y,
        fontFamily: 'Arial',
        fontSize: 24,
        fill: getBrushColor()
      });
      canvas.add(text).setActiveObject(text);
      canvas.renderAll();
      saveState();
      updateStates({ isInsertingText: false });
      return;
    }

    // 3️⃣ Inizio disegno shape
    if (!getDrawingShape()) return;

    canvas.isDrawingMode = false;
    updateStates({
      isDrawingShape: true,
      shapeOrigin: { x: pointer.x, y: pointer.y }
    });
  });

  // 🖌 Mouse move: aggiornamento shape in corso
  canvas.on('mouse:move', opt => {
    if (!getIsDrawingShape()) return;
    const pointer = canvas.getPointer(opt.e, false);
    let shape = getShapeObject();

    // Se non esiste ancora l’oggetto shape, lo creiamo
    if (!shape) {
      const origin = getShapeOrigin();
      const stroke = getBrushColor();
      const width = getBrushSize();

      switch (getDrawingShape()) {
        case 'rect':
          shape = new fabric.Rect({
            left: origin.x, top: origin.y,
            width: 1, height: 1,
            fill: null, stroke, strokeWidth: width,
            erasable: true, selectable: true
          });
          break;
        case 'circle':
          shape = new fabric.Circle({
            left: origin.x, top: origin.y,
            radius: 1,
            fill: null, stroke, strokeWidth: width,
            erasable: true, selectable: true
          });
          break;
        case 'line':
          shape = new fabric.Line(
            [origin.x, origin.y, origin.x, origin.y],
            { stroke, strokeWidth: width, fill: null, erasable: true, selectable: true }
          );
          break;
        default:
          return;
      }
      canvas.add(shape).setActiveObject(shape);
      updateStates({ shapeObject: shape });
    }

    // Modifica le dimensioni/coordinate in base al puntatore
    const origin = getShapeOrigin();
    switch (getDrawingShape()) {
      case 'rect':
        shape.set({
          width:  Math.abs(pointer.x - origin.x),
          height: Math.abs(pointer.y - origin.y),
          left:   Math.min(pointer.x, origin.x),
          top:    Math.min(pointer.y, origin.y)
        });
        break;
      case 'circle':
        const dx = pointer.x - origin.x;
        const dy = pointer.y - origin.y;
        const r  = Math.sqrt(dx * dx + dy * dy) / 2;
        shape.set({
          radius: r,
          left:   (pointer.x + origin.x) / 2 - r,
          top:    (pointer.y + origin.y) / 2 - r
        });
        break;
      case 'line':
        shape.set({ x2: pointer.x, y2: pointer.y });
        break;
    }

    shape.setCoords();
    canvas.requestRenderAll();
  });

  // 🖐 Mouse up: fine disegno shape
  canvas.on('mouse:up', () => {
    if (getIsDrawingShape()) {
      setDrawingMode(getPreviousDrawingMode());
      updateStates({
        isDrawingShape: false,
        shapeObject:    null,
        drawingShape:   null
      });
      setBrush(getCurrentBrush());
      saveState();
    }
  });
}
