var el = document.getElementById('c');
var ctx = el.getContext('2d');
var isDrawing = false;

el.onmousedown = function(e) {
  isDrawing = true;
  ctx.beginPath(); // Start a new path
  let rect = el.getBoundingClientRect();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
};

el.onmousemove = function(e) {
  if (isDrawing) {
    let rect = el.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }
};

el.onmouseup = function() {
  isDrawing = false;
};
el.onmouseleave = function() { 
  isDrawing = false; 
};

document.getElementById('clearBtn').onclick = function() {
    ctx.clearRect(0, 0, el.width, el.height);
  };