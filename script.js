// Function to initialize the canvas for high resolution
var el = document.getElementById('c');
var ctx = el.getContext('2d');

function drawGrid(ctx, size) {
  for (let x = 0; x < ctx.canvas.width; x += size) {
      for (let y = 0; y < ctx.canvas.height; y += size) {
          ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "#ddd" : "#fff";
          ctx.fillRect(x, y, size, size);
      }
  }
}

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1; // Get device pixel ratio
  const width = 800; // Your desired width
  const height = 500; // Your desired height
  // Set canvas width and height to dpr scaled size for better rendering
  el.width = width * dpr;
  el.height = height * dpr;
  // Scale the context for high-definition rendering
  ctx.scale(dpr, dpr);
  // Optional: Draw a grid to check the resolution
  drawGrid(ctx, 2);
}
setupCanvas();

var isDrawing = false;
var brushType = 'Basic';
var brushColor = "black";
var brushSize = 5;
ctx.strokeStyle = brushColor;
ctx.lineWidth = brushSize;
ctx.lineJoin = 'round';
ctx.lineCap = 'round';

var undoStack = [];
var redoStack = [];

function getMousePos(e) {
  var rect = el.getBoundingClientRect();
  var dpr = window.devicePixelRatio || 1;
  return {
    x: (e.clientX - rect.left) * (el.width / rect.width / dpr),
    y: (e.clientY - rect.top) * (el.height / rect.height / dpr)
  };
}

var isPointerMode = false; // To track if we are in pointer mode

document.getElementById('pointerToggleBtn').onclick = function() {
  isPointerMode = !isPointerMode; // Toggle the mode
  var icon = document.getElementById('pointerIcon'); // Get the image element
  if (isPointerMode) {
      icon.src = "./images/pointer-icon.png"; // Path to pointer image
  } else {
      icon.src = "./images/pencil-icon.png"; // Path to pencil image
  };
}






// Update mouse event handlers to respect pointer mode
el.onmousedown = function(e) {
  if (isPointerMode) return; // Don't allow drawing in pointer mode
  isDrawing = true;
  let pos = getMousePos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  saveStateToUndo();
};

el.onmousemove = function(e) {
  if (!isDrawing || isPointerMode) return; // Don't draw if in pointer mode
  let pos = getMousePos(e);
  if (brushType === 'Spray') {
    for (let i = 0; i < 10; i++) {
      let offsetX = Math.random() * 10 - 5;
      let offsetY = Math.random() * 10 - 5;
      ctx.fillStyle = brushColor;
      ctx.fillRect(pos.x + offsetX, pos.y + offsetY, 1, 1);
    }
  } else if (brushType === 'Dotted') {
    ctx.beginPath();
    ctx.fillStyle = brushColor;
    ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }
};

el.onmouseup = function() {
  if (isPointerMode) return; // Don't stop drawing if in pointer mode
  isDrawing = false;
};

const thicknessSlider = document.getElementById('thicknessSlider');
thicknessSlider.addEventListener('input', function () {
  brushSize = parseInt(this.value, 10);
  setBrush(brushType);
});

const colorInput = document.getElementById('colorInput');
colorInput.addEventListener('input', function () {
  brushColor = this.value;
  ctx.strokeStyle = brushColor;
  ctx.fillStyle = brushColor;
});

var brushButton = document.getElementById("brushes_tab");
var brushDropdown = document.getElementById("brushDropdown");
brushButton.onclick = function () {
    brushDropdown.style.display = (brushDropdown.style.display === "block") ? "none" : "block";
};

document.querySelectorAll(".brush-option").forEach(button => {
    button.addEventListener("click", function () {
        brushType = this.getAttribute("data");
        setBrush(brushType);
        brushDropdown.style.display = "none";
    });
});

document.addEventListener("click", function (event) {
    if (!brushButton.contains(event.target) && !brushDropdown.contains(event.target)) {
        brushDropdown.style.display = "none";
    }
});

function setBrush(type) {
  switch (type) {
    case 'Basic':
      ctx.lineWidth = brushSize;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      break;
    case 'Smooth':
      ctx.lineWidth = brushSize * 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      break;
    case 'Thick':
      ctx.lineWidth = brushSize * 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      break;
    case 'Spray':
      ctx.lineWidth = 1;
      break;
    case 'Calligraphy':
      ctx.lineWidth = brushSize;
      ctx.lineJoin = 'bevel';
      ctx.lineCap = 'square';      
      break;
    case 'Dotted':
      ctx.lineWidth = brushSize;
      break;
  }
}




// Undo and redo functions
// Function to save the canvas state to the undo stack
function saveStateToUndo() {
  const dpr = window.devicePixelRatio || 1;
  const snapshot = ctx.getImageData(0, 0, el.width, el.height); // Save exact pixels
  undoStack.push(snapshot);

  if (undoStack.length > 10) {
    undoStack.shift(); // Limit stack size
  }
  redoStack = []; // Clear redo stack when new action happens
}

function undo() {
  if (undoStack.length > 0) {
    redoStack.push(ctx.getImageData(0, 0, el.width, el.height)); // Save current state for redo
    let previousState = undoStack.pop();
    ctx.putImageData(previousState, 0, 0); // Restore previous state
  }
}

function redo() {
  if (redoStack.length > 0) {
    undoStack.push(ctx.getImageData(0, 0, el.width, el.height)); // Save current state for undo
    let nextState = redoStack.pop();
    ctx.putImageData(nextState, 0, 0); // Restore next state
  }
}

// Undo button event
document.getElementById('undoBtn').onclick = function() {
  undo();
};

// Redo button event
document.getElementById('redoBtn').onclick = function() {
  redo();
};

// Function to clear the canvas
document.getElementById('clearBtn').onclick = function() {
  ctx.clearRect(0, 0, el.width, el.height);
  undoStack = [];  // Clear undo stack on reset
  redoStack = [];  // Clear redo stack on reset
  drawGrid(ctx, 2);
};




// Download situation
var downloadButton = document.getElementById("download_tab");
var downloadDropdown = document.getElementById("downloadDropdown");
downloadButton.onclick = function (){
  downloadDropdown.style.display = (downloadDropdown.style.display === "block") ? "none" : "block";
}

document.addEventListener("click", function (event) {
  if (!downloadButton.contains(event.target) && !downloadDropdown.contains(event.target)) {
      downloadDropdown.style.display = "none";
  }
});

document.querySelectorAll(".download-option").forEach(button => {
  button.addEventListener("click", function () {
      let format = this.getAttribute("value");
      let link = document.createElement("a");
      link.download = `drawing.${format}`;
      link.href = el.toDataURL(`image/${format}`);
      link.click();
      downloadDropdown.style.display = "none"; // Hide dropdown after selection
  });
});
