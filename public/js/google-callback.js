// public/js/google-callback.js
(async function() {
  const backendUrl = 'https://musebrush.onrender.com';
  console.group('[google-callback] Debug info');
  console.log('window.location.href:', window.location.href);
  console.log('window.opener:', window.opener);
  console.groupEnd();

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code') || params.get('uid'); // fallback for uid param
  console.log('[google-callback] extracted code/uid:', code);

  if (!code) {
    console.error('[google-callback] Missing code parameter');
    return;
  }

  try {
    let uid;
    // If 'uid' passed directly (previous flow), skip backend fetch
    if (params.has('uid')) {
      uid = code;
    } else {
      // exchange code for uid
      const resp = await fetch(
        `${backendUrl}/auth/google/callback?code=${encodeURIComponent(code)}`,
        { method: 'GET', credentials: 'include' }
      );
      if (!resp.ok) throw new Error(`Server responded ${resp.status}`);
      const data = await resp.json();
      uid = data.uid;
      console.log('[google-callback] received UID from backend:', uid);
    }

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'google-login', uid }, window.opener.location.origin);
      console.log('[google-callback] UID sent via postMessage:', uid);
      window.close();
    } else {
      console.warn('[google-callback] No opener, falling back to redirect parent');
      // Fallback: redirect top window with uid
      window.location.href = `/?uid=${encodeURIComponent(uid)}`;
    }
  } catch (err) {
    console.error('[google-callback] Error in callback:', err);
  }
})();
