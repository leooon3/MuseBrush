// public/js/google-callback.js

// URL del backend per lo scambio del code con uid
const backendUrl = 'https://musebrush.onrender.com';

(async function() {
  console.group('[google-callback] Debug info');
  console.log('window.location.href:', window.location.href);
  console.log('window.opener:', window.opener);
  console.groupEnd();

  // Estrai il code dalla query string
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  console.log('[google-callback] estratto code:', code);

  try {
    if (!code) throw new Error('Missing code parameter');

    // 1) Scambia il code con UID tramite chiamata al backend
    const resp = await fetch(`${backendUrl}/auth/google/callback?code=${encodeURIComponent(code)}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!resp.ok) throw new Error(`Server responded ${resp.status}`);
    const data = await resp.json();
    const { uid } = data;
    console.log('[google-callback] ricevuto UID dal backend:', uid);

    // 2) Invia postMessage al parent
    if (uid && window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'google-login', uid }, window.opener.location.origin);
      console.log('[google-callback] UID inviato al parent:', uid);
    } else {
      throw new Error('UID mancante o opener non disponibile');
    }
  } catch (err) {
    console.error('[google-callback] Errore nel callback:', err);
  }
  
  // Non chiudiamo automaticamente per debug
})();
