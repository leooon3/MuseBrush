export let currentBrush = "Basic";
export let brushColor = "#000000";
export let globalDrawingMode = true;
export let isFilling = false;
export let isBucketActive = false;
export let isInsertingText = false;
export let drawingShape = null;
export let previousDrawingMode = false;
export let isDrawingShape = false;
export let shapeObject = null;
export let shapeOrigin = { x: 0, y: 0 };
export let brushSize = 5;
export let lastEraserPoint = null;
export let currentProjectName = null;
export let currentProjectId = null; // ✅ aggiunto per gestione update
export let activeLayerIndex = 0;
export let isPointerMode = false;

export function setActiveLayerIndex(val) { activeLayerIndex = val; }
export function setCurrentBrush(val) { currentBrush = val; }
export function setBrushColor(val) { brushColor = val; }
export function setGlobalDrawingMode(val) { globalDrawingMode = val; }
export function setIsFilling(val) { isFilling = val; }
export function setIsBucketActive(val) { isBucketActive = val; }
export function setIsInsertingText(val) { isInsertingText = val; }
export function setDrawingShape(val) { drawingShape = val; }
export function setPreviousDrawingMode(val) { previousDrawingMode = val; }
export function setIsDrawingShape(val) { isDrawingShape = val; }
export function setShapeObject(val) { shapeObject = val; }
export function setShapeOrigin(val) { shapeOrigin = val; }
export function setBrushSize(val) { brushSize = val; }
export function setCurrentProjectName(val) { currentProjectName = val; }
export function getCurrentProjectName() { return typeof currentProjectName !== 'undefined' ? currentProjectName : null; }
export function setCurrentProjectId(val) { currentProjectId = val; }  // ✅ nuova funzione
export function getCurrentProjectId() { return typeof currentProjectId !== 'undefined' ? currentProjectId : null; }  // ✅ nuova funzione
export function setIsPointerMode(val) { isPointerMode = val; }
export function getIsPointerMode() { return isPointerMode; }
