import {
  getCurrentBrush, getBrushColor, getBrushSize,
  getIsFilling, getIsBucketActive, getIsInsertingText,
  getDrawingShape, getPreviousDrawingMode,
  getShapeObject, getShapeOrigin, getIsDrawingShape,
  updateStates
} from './state.js';
import { fabricToCanvasCoords, saveState } from './actions.js';
import { floodFillFromPoint } from './fill.js';
import { setBrush, setDrawingMode } from './tool.js';

/**
 * Attaches mouse and drawing event handlers to a Fabric.js canvas instance.
 * Handles drawing paths, inserting text, bucket fill, and drawing shapes.
 * @param {fabric.Canvas} canvas
 */
export function attachCanvasEvents(canvas) {
  console.log('attachCanvasEvents:', canvas.lowerCanvasEl.id);

  // Called when a path (free drawing) is created
  canvas.on('path:created', () => {
    console.log('event path:created');
    canvas.renderAll();
    saveState();
  });

  // Mouse down: check if we are filling, inserting text or drawing shape
  canvas.on('mouse:down', event => {
    console.log('event mouse:down');
    const ptr = canvas.getPointer(event.e, false);

    // Bucket fill mode
    if (getIsFilling() && getIsBucketActive()) {
      console.log('bucket fill at', ptr);
      const { x, y } = fabricToCanvasCoords(canvas, ptr);
      floodFillFromPoint(canvas, x, y, getBrushColor());
      saveState();
      canvas.renderAll();
      updateStates({ isFilling: false, isBucketActive: false, globalDrawingMode: true });
      setDrawingMode(true);
      setBrush(getCurrentBrush());
      return;
    }

    // Text insertion mode
    if (getIsInsertingText()) {
      console.log('inserting text at', ptr);
      const text = new fabric.IText('Text', {
        left: ptr.x,
        top: ptr.y,
        fontFamily: 'Arial',
        fontSize: 20,
        fill: getBrushColor()
      });
      canvas.add(text).setActiveObject(text);
      canvas.renderAll();
      saveState();
      updateStates({ isInsertingText: false });
      return;
    }

    // Shape drawing mode
    if (!getDrawingShape()) {
      console.log('no shape active');
      return;
    }

    console.log('start drawing shape:', getDrawingShape());
    canvas.isDrawingMode = false;
    updateStates({ isDrawingShape: true, shapeOrigin: { x: ptr.x, y: ptr.y } });
  });

  // Mouse move: resize or reposition the shape during drawing
  canvas.on('mouse:move', event => {
    if (!getIsDrawingShape()) return;
    const ptr = canvas.getPointer(event.e, false);
    let shape = getShapeObject();
    const origin = getShapeOrigin();
    const stroke = getBrushColor();
    const width = getBrushSize();
    const type = getDrawingShape();

    // Create shape if it's the first move
    if (!shape) {
      switch (type) {
        case 'rect':
          shape = new fabric.Rect({ left: origin.x, top: origin.y, width: 0, height: 0, stroke, strokeWidth: width, fill: null });
          break;
        case 'circle':
          shape = new fabric.Circle({ left: origin.x, top: origin.y, radius: 0, stroke, strokeWidth: width, fill: null });
          break;
        case 'line':
          shape = new fabric.Line([origin.x, origin.y, origin.x, origin.y], { stroke, strokeWidth: width });
          break;
        default:
          return;
      }
      canvas.add(shape).setActiveObject(shape);
      updateStates({ shapeObject: shape });
    }

    // Update shape dimensions based on pointer movement
    switch (type) {
      case 'rect':
        shape.set({
          width: Math.abs(ptr.x - origin.x),
          height: Math.abs(ptr.y - origin.y),
          left: Math.min(ptr.x, origin.x),
          top: Math.min(ptr.y, origin.y)
        });
        break;
      case 'circle':
        const dx = ptr.x - origin.x;
        const dy = ptr.y - origin.y;
        const r = Math.sqrt(dx * dx + dy * dy) / 2;
        shape.set({
          radius: r,
          left: (ptr.x + origin.x) / 2 - r,
          top: (ptr.y + origin.y) / 2 - r
        });
        break;
      case 'line':
        shape.set({ x2: ptr.x, y2: ptr.y });
        break;
    }

    shape.setCoords();
    canvas.requestRenderAll();
  });

  // Mouse up: finalize shape drawing
  canvas.on('mouse:up', () => {
    console.log('event mouse:up');
    if (getIsDrawingShape()) {
      console.log('end shape:', getDrawingShape());
      setDrawingMode(getPreviousDrawingMode());
      updateStates({ isDrawingShape: false, shapeObject: null, drawingShape: null });
      setBrush(getCurrentBrush());
      saveState();
    }
  });
}
