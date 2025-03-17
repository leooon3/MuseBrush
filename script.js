// Initialize Fabric.js canvas
var canvas = new fabric.Canvas('drawingCanvas', {
    isDrawingMode: true // Enables drawing mode
});

// Set canvas dimensions
canvas.setWidth(600);
canvas.setHeight(400);

// Configure pencil settings
canvas.freeDrawingBrush.color = "black";
canvas.freeDrawingBrush.width = 3;

// Clear Canvas Button
document.getElementById("clearBtn").addEventListener("click", function() {
    canvas.clear(); // Clears the canvas
});
