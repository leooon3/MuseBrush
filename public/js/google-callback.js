// public/js/google-callback.js

(function() {
  // 0) Log di debug
  console.group('[google-callback] Debug info');
  console.log('window.location.href:', window.location.href);
  console.log('window.opener:', window.opener);
  if (window.opener) {
    try {
      console.log('window.opener.location.origin:', window.opener.location.origin);
    } catch(err) {
      console.warn('Cannot read opener.location.origin:', err);
    }
  }
  console.groupEnd();

  // 1) Prendi l’uid dalla query string
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');
  console.log('[google-callback] estratto uid:', uid);

  // 2) Verifica e invio
  if (uid && window.opener && !window.opener.closed) {
    window.opener.postMessage(
      { type: 'google-login', uid },
      // se opener.location.origin non è accessibile, usa '*' temporaneamente
      window.opener.location?.origin || '*'
    );
    console.log('[google-callback] UID inviato al parent:', uid);
  } else {
    console.error('[google-callback] UID mancante o opener non disponibile');
  }
  // 3) Non chiudiamo più automaticamente
})();
