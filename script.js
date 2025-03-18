var el = document.getElementById('c');
var ctx = el.getContext('2d');
var isDrawing = false;

// Set stroke properties for better visibility
ctx.strokeStyle = "black";  // Line color
ctx.lineWidth = 2;          // Line thickness
ctx.lineJoin = "round";     // Smooth joints
ctx.lineCap = "round";      // Rounded stroke edges

function getMousePos(e) {
  let rect = el.getBoundingClientRect();
  let scaleX = el.width / rect.width;  // Scale factor in X
  let scaleY = el.height / rect.height; // Scale factor in Y
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

el.onmousedown = function(e) {
  isDrawing = true;
  let pos = getMousePos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
};

el.onmousemove = function(e) {
  if (isDrawing) {
    let pos = getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }
};

el.onmouseup = function() {
  isDrawing = false;
};
/*el.onmouseleave = function() { 
  isDrawing = false; 
};*/

// Function to clear the canvas
document.getElementById('clearBtn').onclick = function() {
  ctx.clearRect(0, 0, el.width, el.height);
};
