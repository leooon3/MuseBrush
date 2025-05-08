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

  // ✅ Recupera uid da URL dopo login Google
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');
  if (uid) {
    localStorage.setItem('userId', uid);
    updateAuthIcon(true);
    alert('✅ Login Google riuscito e utente salvato!');
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    const storedUid = localStorage.getItem('userId');
    updateAuthIcon(!!storedUid);
  }
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
        updateAuthIcon(true);
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
  window.location.href = `${backendUrl}/api/googleLogin`;
}

function logoutUser() {
  localStorage.removeItem('userId');
  updateAuthIcon(false);
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

function updateAuthIcon(loggedIn) {
  const authIcon = document.getElementById("authIcon");
  if (authIcon) {
    authIcon.src = loggedIn ? "./images/user-auth.png" : "./images/user.png";
    authIcon.alt = loggedIn ? "Utente autenticato" : "Account";
  }
}
