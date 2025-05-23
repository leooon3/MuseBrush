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
async function loginWithEmail(email, password) {
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
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore durante il login');
  }
  return await res.json();
}

/**
 * Effettua la registrazione via email/password.
 */
async function registerWithEmail(email, password) {
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
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore durante la registrazione');
  }
  return await res.json();
}

/**
 * Effettua il login con Google (redirige al provider).
 */
function loginWithGoogle() {
  window.location.href = `${backendUrl}/api/googleLogin`;
}

/**
 * Effettua il logout.
 */
async function logoutUser() {
  const token = await fetchCsrfToken();
  const res = await fetch(`${backendUrl}/api/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token
    }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore durante il logout');
  }
}


/**
 * Richiede reset password via email.
 */
async function resetPassword(email) {
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
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore durante il reset della password');
  }
  return await res.json();
}

/**
 * Richiede il reinvio email di verifica.
 */
async function resendVerification(email) {
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
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore durante invio della verifica');
  }
  return await res.json();
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
  try {
    await fetchCsrfToken();
    updateAuthIcon(true);
    initGallery();
  } catch {
    updateAuthIcon(false);
  }
}
