async function saveDrawing(imageData) {
    const token = localStorage.getItem("token");
    await fetch("http://localhost:5000/api/drawings/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ userId: "user-id-here", imageData }),
    });
  }
  