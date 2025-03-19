document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    // Fetch User Info if Logged In
    if (token) {
        fetch("http://localhost:5000/api/auth/user", {
            method: "GET",
            headers: { "Authorization": token }
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById("userGreeting").textContent = `Welcome, ${data.username}`;
        });
    }

    // Register Form Submission
    document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("registerUsername").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        const response = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        alert(data.message);
    });

    // Login Form Submission
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (data.token) {
            localStorage.setItem("token", data.token);
            alert("Login successful");
            window.location.href = "index.html";  // Redirect after successful login
        } else {
            alert(data.message);
        }
    });

    // Logout Button
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    // Save Drawing to Database (Only if Logged In)
    document.getElementById("saveBtn").addEventListener("click", () => {
        if (!token) {
            alert("You must be logged in to save your drawing.");
            return;
        }
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

    // Download Drawing (Only if Logged In)
    document.getElementById("downloadBtn").addEventListener("click", () => {
        if (!token) {
            alert("You must be logged in to download your drawing.");
            return;
        }
        const canvas = document.getElementById("c");
        const link = document.createElement("a");
        link.download = "drawing.png";
        link.href = canvas.toDataURL();
        link.click();
    });
});
