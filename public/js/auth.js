// 📂 auth.js aggiornato con import sicuri
export function authInit() {
  document.getElementById("googleLoginBtn").onclick = loginWithGoogle;
  document.getElementById("logoutBtn").onclick = logoutUser;
  document.getElementById("authToggleBtn").onclick = () => {
    document.getElementById("authModal").classList.toggle("hidden");
  };
  window.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem('userId');
    updateAuthIcon(!!userId);
  });
}

function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      alert(`✅ Accesso con Google riuscito: ${result.user.displayName}`);
      localStorage.setItem('userId', result.user.uid);
      updateAuthIcon(true);
      document.getElementById("authModal").classList.add("hidden");
    })
    .catch(error => alert("Errore login con Google: " + error.message));
}

function logoutUser() {
  firebase.auth().signOut().then(() => {
    localStorage.removeItem('userId');
    updateAuthIcon(false);
    alert('🚪 Disconnesso!');
  });
}

function updateAuthIcon(loggedIn) {
  const authIcon = document.getElementById("authIcon");
  if (authIcon) {
    authIcon.src = loggedIn ? "./images/user-auth.png" : "./images/user.png";
    authIcon.alt = loggedIn ? "Utente autenticato" : "Account";
  }
}
export function authInit() {
  document.getElementById("googleLoginBtn").onclick = loginWithGoogle;
  document.getElementById("logoutBtn").onclick = logoutUser;
}