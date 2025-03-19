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

// Function to clear the canvas
document.getElementById('clearBtn').onclick = function() {
  ctx.clearRect(0, 0, el.width, el.height);
};

var brushButton = document.getElementById("brushes_tab");
var brushDropdown = document.getElementById("brushDropdown");

// Toggle dropdown visibility
brushButton.onclick = function () {
    brushDropdown.style.display = (brushDropdown.style.display === "block") ? "none" : "block";
};

// Set brush size when clicking an option
document.querySelectorAll(".brush-option").forEach(button => {
    button.addEventListener("click", function () {
        let size = this.getAttribute("data-size");
        ctx.lineWidth = size; // Change brush size
        brushDropdown.style.display = "none"; // Hide dropdown after selection
    });
});

// Close dropdown if clicking outside
document.addEventListener("click", function (event) {
    if (!brushButton.contains(event.target) && !brushDropdown.contains(event.target)) {
        brushDropdown.style.display = "none";
    }
});
document.getElementById("downloadBtn").addEventListener("click", function () {
  let format = document.getElementById("formatSelect").value; // Get selected format
  let link = document.createElement("a");
  link.download = `drawing.${format}`; // Set file name
  link.href = el.toDataURL(`image/${format}`); // Convert canvas to chosen format
  link.click();
});
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
      window.location.href = "login.html"; // Redirect if not logged in
  }

  // Fetch User Info
  fetch("http://localhost:5000/api/auth/user", {
      method: "GET",
      headers: { "Authorization": token }
  })
  .then(res => res.json())
  .then(data => {
      document.getElementById("userGreeting").textContent = `Welcome, ${data.username}`;
  });

  // Logout Button
  document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
  });

  // Save Drawing to Database
  document.getElementById("saveBtn").addEventListener("click", () => {
      const dataURL = document.getElementById("c").toDataURL();

      fetch("http://localhost:5000/api/auth/save", {
          method: "POST",
          headers: { 
              "Authorization": token,
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ image: dataURL })
      })
      .then(res => res.json())
      .then(data => alert("Drawing saved!"));
  });

  // Download Drawing
  document.getElementById("downloadBtn").addEventListener("click", () => {
      const canvas = document.getElementById("c");
      const link = document.createElement("a");
      link.download = "drawing.png";
      link.href = canvas.toDataURL();
      link.click();
  });
});

