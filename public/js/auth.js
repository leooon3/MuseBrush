const backendUrl = 'https://musebrush.onrender.com';

export function authInit() {
  document.getElementById("loginBtn").onclick = loginWithEmail;
  document.getElementById("signupBtn").onclick = registerWithEmail;
  document.getElementById("googleLoginBtn").onclick = loginWithGoogle;
  document.getElementById("logoutBtn").onclick = logoutUser;
  document.getElementById("forgotPasswordBtn").onclick = resetPassword;
  document.getElementById("authToggleBtn").onclick = () => {
    document.getElementById("authModal").classList.toggle("hidden");
  };
  window.onclick = (e) => {
    const modal = document.getElementById("authModal");
    if (e.target === modal) modal.classList.add("hidden");
  };
}

function loginWithEmail() {
  const email = document.getElementById("emailInput").value;
  fetch(`${backendUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      if (data.uid) {
        localStorage.setItem('userId', data.uid);
        alert(data.message);
        document.getElementById("authModal").classList.add("hidden");
      } else {
        alert(data.error);
      }
    })
    .catch(error => alert('Errore di rete: ' + error.message));
}

function registerWithEmail() {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  fetch(`${backendUrl}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.uid) {
        alert(data.message + " Controlla la tua email.");
      } else {
        alert(data.error);
      }
    })
    .catch(error => alert('Errore di rete: ' + error.message));
}

function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => result.user.getIdToken())
    .then(idToken => fetch(`${backendUrl}/api/googleLogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }))
    .then(res => res.json())
    .then(data => {
      if (data.uid) {
        localStorage.setItem('userId', data.uid);
        alert(data.message);
        document.getElementById("authModal").classList.add("hidden");
      } else {
        alert(data.error);
      }
    })
    .catch(error => alert("Errore login con Google: " + error.message));
}


function logoutUser() {
  localStorage.removeItem('userId');
  alert('🚪 Disconnesso!');
}

function resetPassword() {
  const email = document.getElementById("emailInput").value;
  fetch(`${backendUrl}/api/resetPassword`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => alert(data.message || data.error))
    .catch(error => alert('Errore di rete: ' + error.message));
}
