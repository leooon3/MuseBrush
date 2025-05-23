(async function() {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');

  if (!uid) {
    console.error('Manca uid nella callback');
    return;
  }

  // Se opener valido, invia postMessage
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: 'google-login', uid }, window.opener.location.origin);
  } else {
    // Fallback: salva in localStorage
    localStorage.setItem('googleLoginUid', uid);
  }

  // Chiudi sempre il popup
  window.close();
})();