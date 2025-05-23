// auth.js

import { updateStates } from './state.js';
import { initGallery } from './gallery.js';

const backendUrl = 'https://musebrush.onrender.com';

let authModal, loginBtn, signupBtn, googleLoginBtn, logoutBtn,
    forgotPasswordBtn, resendVerificationBtn, authToggleBtn;

/**
 * Mostra o nasconde l’icona di autenticazione.
 * @param {boolean} loggedIn
 */
function updateAuthIcon(loggedIn) {
  const authIcon = document.getElementById('authIcon');
  if (!authIcon) return;
  authIcon.src = loggedIn ? './images/user-auth.png' : './images/user.png';
  authIcon.alt = loggedIn ? 'Utente autenticato' : 'Account';
  updateStates({ isAuthenticated: loggedIn });
}
/**
 * Recupera il token CSRF per sessione.
 */
async function fetchCsrfToken() {
  const res = await fetch(`${backendUrl}/api/csrf-token`, {
    credentials: 'include'
  });
  if (!res.ok) {
    throw new Error('CSRF token non ottenuto');
  }
  const { csrfToken } = await res.json();
  return csrfToken;
}

/**
 * Effettua il login via email/password.
 */
export async function loginWithEmail() {
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  if (!email || !password) {
    return alert('📧 Inserisci email e password.');
  }
  try {
    const token = await fetchCsrfToken();
    const res = await fetch(`${backendUrl}/api/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      return alert(data.error || '❌ Errore durante il login');
    }
    alert(data.message);
    updateStates({ isAuthenticated: true });
    initGallery();
    window.location.reload();
  } catch (err) {
    alert('❌ Errore di rete: ' + err.message);
  }
}

/**
 * Effettua la registrazione via email/password.
 */
export async function registerWithEmail() {
  const email = document.getElementById('emailInput')?.value.trim();
  const password = document.getElementById('passwordInput')?.value;
  if (!email || !password) {
    return alert('📧 Inserisci email e password per la registrazione.');
  }
  try {
    const token = await fetchCsrfToken();
    const res = await fetch(`${backendUrl}/api/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.uid) {
      alert(data.message + ' Controlla la tua email per verificare l’account.');
    } else {
      alert(data.error || '❌ Registrazione fallita');
    }
  } catch (err) {
    alert('❌ Errore di rete: ' + err.message);
  }
}

/**
 * Richiede reset password via email.
 */
export async function resetPassword() {
  const email = document.getElementById('emailInput')?.value.trim();
  if (!email) {
    return alert("📧 Inserisci un'email valida.");
  }
  try {
    const token = await fetchCsrfToken();
    const res = await fetch(`${backendUrl}/api/resetPassword`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    alert(data.message || data.error);
  } catch (err) {
    alert('❌ Errore di rete: ' + err.message);
  }
}

/**
 * Richiede il reinvio email di verifica.
 */
export async function resendVerification() {
  const email = document.getElementById('emailInput')?.value.trim();
  if (!email) {
    return alert("📧 Inserisci un'email valida.");
  }
  try {
    const token = await fetchCsrfToken();
    const res = await fetch(`${backendUrl}/api/resendVerification`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    alert(data.message || data.error);
  } catch (err) {
    alert('❌ Errore di rete: ' + err.message);
  }
}

/**
 * Effettua il logout.
 */
export async function logoutUser() {
  try {
    const token = await fetchCsrfToken();
    const res = await fetch(`${backendUrl}/api/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-Token': token
      }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Errore durante il logout');
    }
    updateStates({ isAuthenticated: false });
    alert('🚪 Disconnesso!');
  } catch (err) {
    alert('❌ Errore di rete: ' + err.message);
  }
}
/**
 * Effettua il login con Google (redirige al provider).
 */
function loginWithGoogle() {
 window.open(
    `${backendUrl}/api/googleLogin`,
    'googleLogin',
    'width=600,height=700'
  );
}
/**
 * Collega tutti gli event handler agli elementi del DOM.
 */
function attachAuthHandlers() {
  authModal = document.getElementById('authModal');
  loginBtn = document.getElementById('loginBtn');
  signupBtn = document.getElementById('signupBtn');
  googleLoginBtn = document.getElementById('googleLoginBtn');
  logoutBtn = document.getElementById('logoutBtn');
  forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  resendVerificationBtn = document.getElementById('resendVerificationBtn');
  authToggleBtn = document.getElementById('authToggleBtn');

  if (loginBtn) loginBtn.addEventListener('click', loginWithEmail);
  if (signupBtn) signupBtn.addEventListener('click', registerWithEmail);
  if (googleLoginBtn) googleLoginBtn.addEventListener('click', loginWithGoogle);
  if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
  if (forgotPasswordBtn) forgotPasswordBtn.addEventListener('click', resetPassword);
  if (resendVerificationBtn) resendVerificationBtn.addEventListener('click', resendVerification);
  if (authToggleBtn) {
    authToggleBtn.addEventListener('click', () => {
      authModal?.classList.toggle('hidden');
    });
  }

  // Chiude il modal cliccando fuori
  window.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.classList.add('hidden');
    }
  });
}

/**
 * Inizializza il modulo di autenticazione:
 * 1. Setta gli handler
 * 2. Recupera CSRF e stato iniziale
 */
export async function authInit() {
  attachAuthHandlers();
  // Se siamo appena tornati dal popup Google, usiamo il uid salvato
  const storedUid = localStorage.getItem('userId');
  if (storedUid) {
    updateAuthIcon(true);
    initGallery();
    return;
  }
  // Altrimenti fallback alla verifica CSRF/sessione
  try {
    await fetchCsrfToken();
    updateAuthIcon(true);
    initGallery();
  } catch {
    updateAuthIcon(false);
  }
}
