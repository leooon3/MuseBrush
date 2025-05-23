(async function() {
  const backendUrl = 'https://musebrush.onrender.com';
  console.group('[google-callback] Debug info');
  console.log('window.location.href:', window.location.href);
  console.log('window.opener:', window.opener);
  console.groupEnd();

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  console.log('[google-callback] extracted code:', code);

  if (!code) {
    console.error('[google-callback] Missing code parameter');
    return;
  }

  try {
    // Exchange code for UID
    const resp = await fetch(
      `${backendUrl}/auth/google/callback?code=${encodeURIComponent(code)}`,
      { method: 'GET', credentials: 'include' }
    );
    if (!resp.ok) throw new Error(`Server responded ${resp.status}`);
    const { uid } = await resp.json();
    console.log('[google-callback] received UID:', uid);

    if (window.opener && !window.opener.closed) {
      // Send via postMessage
      window.opener.postMessage({ type: 'google-login', uid }, window.opener.location.origin);
      console.log('[google-callback] UID sent via postMessage');
    } else {
      // Fallback: store in localStorage
      localStorage.setItem('googleLoginUid', uid);
      console.log('[google-callback] No opener: UID saved to localStorage');
    }
  } catch (err) {
    console.error('[google-callback] Error in callback:', err);
  } finally {
    // Close popup in all cases
    window.close();
  }
})();