const backendUrl = 'https://musebrush.onrender.com';
import { updateStates } from './state.js';
import { initGallery } from './gallery.js';

export async function authInit() {
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

  try {
    const res = await fetch(`${backendUrl}/api/csrf-token`, { credentials: 'include' });
    if (res.ok) {
      updateAuthIcon(true);
      initGallery();
    } else {
      updateAuthIcon(false);
    }
  } catch {
    updateAuthIcon(false);
  }
}

async function resetPassword() {
  const emailInput = document.getElementById("emailInput");
  if (!emailInput || !emailInput.value.trim()) {
    alert("📧 Inserisci un'email valida.");
    return;
  }
  const email = emailInput.value.trim();
  fetch(`${backendUrl}/api/resetPassword`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => data.message ? alert(data.message) : alert(data.error))
    .catch(err => alert('❌ Errore di rete: ' + err.message));
}

async function resendVerification() {
  const emailInput = document.getElementById("emailInput");
  if (!emailInput || !emailInput.value.trim()) {
    alert("📧 Inserisci un'email valida.");
    return;
  }
  const email = emailInput.value.trim();
  fetch(`${backendUrl}/api/resendVerification`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => data.message ? alert(data.message) : alert(data.error))
    .catch(err => alert('❌ Errore di rete: ' + err.message));
}

async function registerWithEmail() {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  fetch(`${backendUrl}/api/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => data.uid ? alert(data.message + " Controlla la tua email.") : alert(data.error))
    .catch(err => alert('❌ Errore di rete: ' + err.message));
}

export async function loginWithEmail() {
  const email = document.getElementById("emailInput").value.trim();
  const password = document.getElementById("passwordInput").value;
  if (!email || !password) return alert("📧 Inserisci email e password.");

  try {
    const res = await fetch(`${backendUrl}/api/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    alert(data.message);
    // Forza il salvataggio della sessione prima di ricaricare
    if (res.headers.get('set-cookie') || res.ok) {
      window.location.reload();
    } else {
      alert('⚠️ Cookie di sessione non ricevuto. Riprova.');
    }
  } catch (err) {
    alert('❌ Errore di rete: ' + err.message);
  }
}


function loginWithGoogle() {
  window.location.href = `${backendUrl}/api/googleLogin`;
}

function logoutUser() {
  fetch(`${backendUrl}/api/logout`, { method: 'POST', credentials: 'include' })
    .then(() => {
      updateAuthIcon(false);
      alert('🚪 Disconnesso!');
    });
}

function updateAuthIcon(loggedIn) {
  const authIcon = document.getElementById("authIcon");
  if (authIcon) {
    authIcon.src = loggedIn ? "./images/user-auth.png" : "./images/user.png";
    authIcon.alt = loggedIn ? "Utente autenticato" : "Account";
  }
}
