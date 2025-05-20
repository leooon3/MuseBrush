//auth .js for all the necessary functions for autentication
const backendUrl = 'https://musebrush.onrender.com';
import { updateStates } from './state.js';

export function authInit() { // connecting buttons with functions
  document.getElementById("loginBtn").onclick = loginWithEmail;
  document.getElementById("signupBtn").onclick = registerWithEmail;
  document.getElementById("googleLoginBtn").onclick = loginWithGoogle;
  document.getElementById("logoutBtn").onclick = logoutUser;
  document.getElementById("forgotPasswordBtn").onclick = resetPassword;
  document.getElementById("resendVerificationBtn").onclick = resendVerification;
  document.getElementById("authToggleBtn").onclick = () => {
    document.getElementById("authModal").classList.toggle("hidden");
  };

  window.onclick = (e) => {
    const modal = document.getElementById("authModal");
    if (e.target === modal) modal.classList.add("hidden");
  };

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

function resetPassword() { // resetting password with email
  const emailInput = document.getElementById("emailInput");
  if (!emailInput || !emailInput.value.trim()) {
    alert("📧 Inserisci un'email valida.");
    return;
  }

  const email = emailInput.value.trim();
  fetch(`${backendUrl}/api/resetPassword`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      if (data.link) {
        alert("📩 Link reset generato. Si apre ora.");
        window.open(data.link, "_blank");
      } else {
        alert(data.message || data.error);
      }
    })
    .catch(error => alert('❌ Errore di rete: ' + error.message));
}

function resendVerification() { // verification mail is real 
  const emailInput = document.getElementById("emailInput");
  if (!emailInput || !emailInput.value.trim()) {
    alert("📧 Inserisci un'email valida.");
    return;
  }

  const email = emailInput.value.trim();
  fetch(`${backendUrl}/api/resendVerification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      if (data.link) {
        alert("📨 Link di verifica generato. Si apre ora.");
        window.open(data.link, "_blank");
      } else {
        alert(data.message || data.error);
      }
    })
    .catch(error => alert('❌ Errore di rete: ' + error.message));
}

function registerWithEmail() { // first time needs to be registered with this function
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

function loginWithEmail() { // login can be made after verification has happened
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

function loginWithGoogle() { // login with google is totally backend
  window.location.href = `${backendUrl}/api/googleLogin`;
}

function logoutUser() { // logout for becoming anonymous
  localStorage.removeItem('userId');
  updateAuthIcon(false);
  alert('🚪 Disconnesso!');
}

function updateAuthIcon(loggedIn) { //updates the icon to let you know you are logged in
  const authIcon = document.getElementById("authIcon");
  if (authIcon) {
    authIcon.src = loggedIn ? "./images/user-auth.png" : "./images/user.png";
    authIcon.alt = loggedIn ? "Utente autenticato" : "Account";
  }
}