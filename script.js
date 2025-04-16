document.addEventListener("DOMContentLoaded", function () {
  const el = document.getElementById('c');
  const ctx = el.getContext('2d');

  function setupCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const width = el.parentElement.clientWidth;
      const height = window.innerHeight - el.offsetTop - 100;      

      el.width = width * dpr;
      el.height = height * dpr;
      ctx.scale(dpr, dpr);

      drawGrid(ctx, 2);
  }
  document.addEventListener("click", function (e) {
    if (!leftMenu.contains(e.target) && !leftToggle.contains(e.target)) {
      leftMenu.classList.remove("active");
    }
    if (!rightMenu.contains(e.target) && !rightToggle.contains(e.target)) {
      rightMenu.classList.remove("active");
    }
  });
  
  function drawGrid(ctx, size) {
      for (let x = 0; x < ctx.canvas.width; x += size) {
          for (let y = 0; y < ctx.canvas.height; y += size) {
              ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "#ddd" : "#fff";
              ctx.fillRect(x, y, size, size);
          }
      }
  }

  setupCanvas();

  let isDrawing = false;
  let undoStack = [];
  let redoStack = [];

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  function getMousePos(e) {
      const rect = el.getBoundingClientRect();
      const scaleX = el.width / rect.width;
      const scaleY = el.height / rect.height;
      return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
      };
  }

  el.onmousedown = function (e) {
      isDrawing = true;
      const pos = getMousePos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      saveStateToUndo();
  };

  el.onmousemove = function (e) {
      if (isDrawing) {
          const pos = getMousePos(e);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
      }
  };

  el.onmouseup = function () {
      isDrawing = false;
  };

  const thicknessSlider = document.getElementById('thicknessSlider');
  if (thicknessSlider) {
      thicknessSlider.addEventListener('input', function () {
          ctx.lineWidth = parseInt(this.value, 10);
      });
  }

  function saveStateToUndo() {
      undoStack.push(el.toDataURL());
      if (undoStack.length > 10) undoStack.shift();
      redoStack = [];
  }

  function undo() {
      if (undoStack.length > 0) {
          const state = undoStack.pop();
          redoStack.push(el.toDataURL());
          const img = new Image();
          img.src = state;
          img.onload = () => {
              ctx.clearRect(0, 0, el.width, el.height);
              ctx.drawImage(img, 0, 0);
          };
      }
  }

  function redo() {
      if (redoStack.length > 0) {
          const state = redoStack.pop();
          undoStack.push(el.toDataURL());
          const img = new Image();
          img.src = state;
          img.onload = () => {
              ctx.clearRect(0, 0, el.width, el.height);
              ctx.drawImage(img, 0, 0);
          };
      }
  }

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
      clearBtn.onclick = function () {
          ctx.clearRect(0, 0, el.width, el.height);
          undoStack = [];
          redoStack = [];
          drawGrid(ctx, 2);
      };
  }

  const undoBtn = document.getElementById('undoBtn');
  if (undoBtn) undoBtn.onclick = () => undo();

  const redoBtn = document.getElementById('redoBtn');
  if (redoBtn) redoBtn.onclick = () => redo();

  // Brush dropdown
  const brushButton = document.getElementById("brushes_tab");
  const brushDropdown = document.getElementById("brushDropdown");

  if (brushButton && brushDropdown) {
      brushButton.onclick = function () {
          brushDropdown.style.display = (brushDropdown.style.display === "block") ? "none" : "block";
      };

      document.querySelectorAll(".brush-option").forEach(button => {
          button.addEventListener("click", function () {
              const size = this.getAttribute("data-size");
              ctx.lineWidth = parseFloat(size);
              brushDropdown.style.display = "none";
          });
      });
  }

  // Download dropdown
  const downloadButton = document.getElementById("download_tab");
  const downloadDropdown = document.getElementById("downloadDropdown");

  if (downloadButton && downloadDropdown) {
      downloadButton.onclick = function () {
          downloadDropdown.style.display = (downloadDropdown.style.display === "block") ? "none" : "block";
      };

      document.querySelectorAll(".download-option").forEach(button => {
          const format = button.getAttribute("value");
          if (format) {
              button.addEventListener("click", function () {
                  const link = document.createElement("a");
                  link.download = `drawing.${format}`;
                  link.href = el.toDataURL(`image/${format}`);
                  link.click();
                  downloadDropdown.style.display = "none";
              });
          }
      });
  }

  // Close dropdowns if clicking outside
  document.addEventListener("click", function (event) {
      if (brushDropdown && !brushButton.contains(event.target) && !brushDropdown.contains(event.target)) {
          brushDropdown.style.display = "none";
      }
      if (downloadDropdown && !downloadButton.contains(event.target) && !downloadDropdown.contains(event.target)) {
          downloadDropdown.style.display = "none";
      }
  });
  const leftToggle = document.getElementById("leftToggle");
const rightToggle = document.getElementById("rightToggle");
const leftMenu = document.getElementById("leftMenu");
const rightMenu = document.getElementById("rightMenu");

if (leftToggle && leftMenu) {
  leftToggle.addEventListener("click", () => {
    leftMenu.classList.toggle("active");
    rightMenu.classList.remove("active");
  });
}

if (rightToggle && rightMenu) {
  rightToggle.addEventListener("click", () => {
    rightMenu.classList.toggle("active");
    leftMenu.classList.remove("active");
  });
}
// Download per mobile
const downloadButtonMobile = document.getElementById("download_tab_mobile");
const downloadDropdownMobile = document.getElementById("downloadDropdownMobile");

if (downloadButtonMobile && downloadDropdownMobile) {
  downloadButtonMobile.onclick = function () {
    downloadDropdownMobile.style.display = (downloadDropdownMobile.style.display === "block") ? "none" : "block";
  };

  downloadDropdownMobile.querySelectorAll(".download-option").forEach(button => {
    const format = button.getAttribute("value");
    if (format) {
      button.addEventListener("click", function () {
        const link = document.createElement("a");
        link.download = `drawing.${format}`;
        link.href = el.toDataURL(`image/${format}`);
        link.click();
        downloadDropdownMobile.style.display = "none";
      });
    }
  });
}

});
