// state.js

// Global state variables for the drawing application
export let currentBrush        = "Basic";
export let brushColor          = "#000000";
export let globalDrawingMode   = true;
export let isFilling           = false;
export let isBucketActive      = false;
export let isInsertingText     = false;
export let drawingShape        = null;
export let previousDrawingMode = false;
export let isDrawingShape      = false;
export let shapeObject         = null;
export let shapeOrigin         = { x: 0, y: 0 };
export let brushSize           = 5;
export let lastEraserPoint     = null;
export let currentProjectName  = null;
export let currentProjectId    = null;
export let activeLayerIndex    = 0;
export let isPointerMode       = false;
export let isAuthenticated     = false;  // Whether the user is logged in

// Getters and setters for each state variable
export function setCurrentBrush(val)        { currentBrush        = val; }
export function getCurrentBrush()           { return currentBrush; }

export function setBrushColor(val)          { brushColor          = val; }
export function getBrushColor()             { return brushColor; }

export function setGlobalDrawingMode(val)   { globalDrawingMode   = val; }
export function getGlobalDrawingMode()      { return globalDrawingMode; }

export function setIsFilling(val)           { isFilling           = val; }
export function getIsFilling()              { return isFilling; }

export function setIsBucketActive(val)      { isBucketActive      = val; }
export function getIsBucketActive()         { return isBucketActive; }

export function setIsInsertingText(val)     { isInsertingText     = val; }
export function getIsInsertingText()        { return isInsertingText; }

export function setDrawingShape(val)        { drawingShape        = val; }
export function getDrawingShape()           { return drawingShape; }

export function setPreviousDrawingMode(val) { previousDrawingMode = val; }
export function getPreviousDrawingMode()    { return previousDrawingMode; }

export function setIsDrawingShape(val)      { isDrawingShape      = val; }
export function getIsDrawingShape()         { return isDrawingShape; }

export function setShapeObject(val)         { shapeObject         = val; }
export function getShapeObject()            { return shapeObject; }

export function setShapeOrigin(val)         { shapeOrigin         = val; }
export function getShapeOrigin()            { return shapeOrigin; }

export function setBrushSize(val)           { brushSize           = val; }
export function getBrushSize()              { return brushSize; }

export function setLastEraserPoint(val)     { lastEraserPoint     = val; }
export function getLastEraserPoint()        { return lastEraserPoint; }

export function setCurrentProjectName(val)  { currentProjectName  = val; }
export function getCurrentProjectName()     { return currentProjectName; }

export function setCurrentProjectId(val)    { currentProjectId    = val; }
export function getCurrentProjectId()       { return currentProjectId; }

export function setActiveLayerIndex(val)    { activeLayerIndex    = val; }
export function getActiveLayerIndex()       { return activeLayerIndex; }

export function setIsPointerMode(val)       { isPointerMode       = val; }
export function getIsPointerMode()          { return isPointerMode; }

export function setIsAuthenticated(val)     { isAuthenticated     = val; }
export function getIsAuthenticated()        { return isAuthenticated; }

/**
 * Bulk update multiple state values using the setters
 * @param {Object} updates - Key-value pairs of state updates
 */
export function updateStates(updates = {}) {
  const setterFns = {
    currentBrush:        setCurrentBrush,
    brushColor:          setBrushColor,
    globalDrawingMode:   setGlobalDrawingMode,
    isFilling:           setIsFilling,
    isBucketActive:      setIsBucketActive,
    isInsertingText:     setIsInsertingText,
    drawingShape:        setDrawingShape,
    previousDrawingMode: setPreviousDrawingMode,
    isDrawingShape:      setIsDrawingShape,
    shapeObject:         setShapeObject,
    shapeOrigin:         setShapeOrigin,
    brushSize:           setBrushSize,
    lastEraserPoint:     setLastEraserPoint,
    currentProjectName:  setCurrentProjectName,
    currentProjectId:    setCurrentProjectId,
    activeLayerIndex:    setActiveLayerIndex,
    isPointerMode:       setIsPointerMode,
    isAuthenticated:     setIsAuthenticated
  };

  Object.entries(updates).forEach(([key, value]) => {
    const fn = setterFns[key];
    if (fn) {
      fn(value);
    } else {
      console.warn(`⚠️ Stato sconosciuto: ${key}`);
    }
  });
}