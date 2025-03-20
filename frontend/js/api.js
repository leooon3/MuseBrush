// api.js - Updated for dynamic userId
async function saveDrawing(imageData) {
  const token = localStorage.getItem("token");
  if (!token) {
      alert("You must be logged in to save drawings.");
      return;
  }

  const userId = JSON.parse(atob(token.split(".")[1])).userId;
  await fetch("http://localhost:5000/api/drawings/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ userId, imageData }),
  });
}
