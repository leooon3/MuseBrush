// public/js/google-callback.js

(() => {
  // Estrai l'uid dalla query string
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');

  if (uid && window.opener && !window.opener.closed) {
    // Invia il messaggio al parent (aggiorna UI e sessione già impostata dal server)
    window.opener.postMessage(
      { type: 'google-login', uid },
      window.opener.location.origin
    );
    console.log('[google-callback] UID inviato al parent:', uid);
  } else {
    console.error('[google-callback] UID mancante o opener non disponibile');
  }
  // Non chiudiamo più automaticamente il popup
})();
