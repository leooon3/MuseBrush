import { updateStates } from './state.js';
import { initGallery } from './gallery.js';

const backendUrl = 'https://musebrush.onrender.com';

export function updateAuthIcon(loggedIn) {
  const authIcon = document.getElementById('authIcon');
  if (!authIcon) return;
  authIcon.src = loggedIn ? './images/user-auth.png' : './images/user.png';
  authIcon.alt = loggedIn ? 'Utente autenticato' : 'Account';
  updateStates({ isAuthenticated: loggedIn });
}

async function fetchCsrfToken() {
  const res = await fetch(`${backendUrl}/api/csrf-token`, { credentials: 'include' });
  if (!res.ok) throw new Error('CSRF token non ottenuto');
  const { csrfToken } = await res.json();
  return csrfToken;
}

export async function loginWithEmail() {
  const email = document.getElementById('emailInput')?.value.trim();
  const password = document.getElementById('passwordInput')?.value;
  if (!email || !password) return alert('📧 Inserisci email e password');
  try {
    const token = await fetchCsrfToken();
    const res = await fetch(`${backendUrl}/api/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || '❌ Login fallito');
    updateAuthIcon(true);
    initGallery();
    window.location.reload();
  } catch (e) {
    alert('❌ Errore di rete: ' + e.message);
  }
}

export async function registerWithEmail() {
  const email = document.getElementById('emailInput')?.value.trim();
  const password = document.getElementById('passwordInput')?.value;
  if (!email || !password) return alert('📧 Inserisci email e password per la registrazione');
  try {
    const token = await fetchCsrfToken();
    const res = await fetch(`${backendUrl}/api/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || '❌ Registrazione fallita');
    alert(data.message);
  } catch (e) {
    alert('❌ Errore di rete: ' + e.message);
  }
}

export async function resetPassword() {
  const email = document.getElementById('emailInput')?.value.trim();
  if (!email) return alert('📧 Inserisci un\'email valida');
  try {
    const token = await fetchCsrfToken();
    const res = await fetch(`${backendUrl}/api/resetPassword`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    alert(data.message || data.error);
  } catch (e) {
    alert('❌ Errore di rete: ' + e.message);
  }
}

export async function resendVerification() {
  const email = document.getElementById('emailInput')?.value.trim();
  if (!email) return alert('📧 Inserisci un\'email valida');
  try {
    const token = await fetchCsrfToken();
    const res = await fetch(`${backendUrl}/api/resendVerification`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    alert(data.message || data.error);
  } catch (e) {
    alert('❌ Errore di rete: ' + e.message);
  }
}

export async function logoutUser() {
  try {
    const token = await fetchCsrfToken();
    const res = await fetch(`${backendUrl}/api/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': token }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '❌ Logout fallito');
    }
    updateAuthIcon(false);
    alert('🚪 Disconnesso');
  } catch (e) {
    alert('❌ Errore di rete: ' + e.message);
  }
}

/**
 * Funzione per il login Google via popup + polling
 */



export function loginWithGoogle() {
  const popup = window.open(
    `${backendUrl}/api/googleLogin`,
    'googleLogin',
    'width=600,height=700'
  );
  if (!popup) {
    return alert('❌ Impossibile aprire il popup. Controlla il tuo blocker.');
  }

  const pollTimer = setInterval(async () => {
    if (popup.closed) {
      clearInterval(pollTimer);
      console.warn('[google-poll] Il popup è stato chiuso prematuramente');
      return;
    }

    let href;
    try {
      href = popup.location.href;
    } catch {
      // popup è ancora su google.com, aspetta
      return;
    }

    // **Confronta con backendUrl**, non con window.location.origin
    const callbackBase = `${backendUrl}/google-callback.html`;
    if (href.startsWith(callbackBase)) {
      clearInterval(pollTimer);

      // Estrai uid e aggiorna UI
      const params = new URLSearchParams(popup.location.search);
      const uid    = params.get('uid');
      if (uid) {
        localStorage.setItem('userId', uid);
        updateAuthIcon(true);
        initGallery();

        // Ricarica la pagina principale per includere il cookie di sessione
        window.location.reload();

        // Ora, e solo ora, chiudi il popup
        popup.close();
      } else {
        console.error('[google-poll] UID non trovato nella callback');
      }
    }
  }, 500);
}
function attachAuthHandlers() {
  document.getElementById('loginBtn')?.addEventListener('click', loginWithEmail);
  document.getElementById('signupBtn')?.addEventListener('click', registerWithEmail);
  document.getElementById('googleLoginBtn')?.addEventListener('click', loginWithGoogle);
  document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);
  document.getElementById('forgotPasswordBtn')?.addEventListener('click', resetPassword);
  document.getElementById('resendVerificationBtn')?.addEventListener('click', resendVerification);
  document.getElementById('authToggleBtn')?.addEventListener('click', () => {
    document.getElementById('authModal')?.classList.toggle('hidden');
  });
  window.addEventListener('click', e => {
    if (e.target === document.getElementById('authModal')) {
      document.getElementById('authModal')?.classList.add('hidden');
    }
  });
}

export async function authInit() {
  attachAuthHandlers();

  const storedUid = localStorage.getItem('userId');
  if (storedUid) {
    updateAuthIcon(true);
    initGallery();
    return;
  }

  try {
    await fetchCsrfToken();
    updateAuthIcon(true);
    initGallery();
  } catch {
    updateAuthIcon(false);
  }
}
