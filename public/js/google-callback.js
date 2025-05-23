// public/js/google-callback.js
(async function() {
  const backendUrl = 'https://musebrush.onrender.com';
  console.group('[google-callback] Debug info');
  console.log('window.location.href:', window.location.href);
  console.log('window.opener:', window.opener);
  console.groupEnd();

  // Estrai i parametri dalla query string
  const params = new URLSearchParams(window.location.search);
  // Priorità: code OAuth, altrimenti uid passato direttamente
  const code = params.get('code');
  let uid = params.get('uid');
  console.log('[google-callback] extracted code:', code);
  console.log('[google-callback] extracted uid:', uid);

  try {
    if (code) {
      // Scambia il code con UID tramite backend
      const resp = await fetch(
        `${backendUrl}/auth/google/callback?code=${encodeURIComponent(code)}`,
        { method: 'GET', credentials: 'include' }
      );
      if (!resp.ok) throw new Error(`Server responded ${resp.status}`);
      const data = await resp.json();
      uid = data.uid;
      console.log('[google-callback] received UID from backend:', uid);
    }
    if (!uid) {
      console.error('[google-callback] Missing uid parameter');
      return;
    }

    if (window.opener && !window.opener.closed) {
      // Invia postMessage al parent
      window.opener.postMessage({ type: 'google-login', uid }, window.opener.location.origin);
      console.log('[google-callback] UID sent via postMessage:', uid);
    } else {
      // Fallback: salva su localStorage
      localStorage.setItem('googleLoginUid', uid);
      console.log('[google-callback] No opener: UID saved to localStorage');
    }
  } catch (err) {
    console.error('[google-callback] Error in callback:', err);
  } finally {
    // Chiudi il popup se possibile
    if (window.close) window.close();
  }
})();
