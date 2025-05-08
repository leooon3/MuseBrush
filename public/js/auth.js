function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      alert(`✅ Accesso con Google riuscito: ${result.user.displayName}`);
      localStorage.setItem('userId', result.user.uid);
      document.getElementById("authModal").classList.add("hidden");
    })
    .catch(error => alert("Errore login con Google: " + error.message));
}

function logoutUser() {
  firebase.auth().signOut().then(() => {
    localStorage.removeItem('userId');
    alert('🚪 Disconnesso!');
  });
}

export function authInit() {
  document.getElementById("googleLoginBtn").onclick = loginWithGoogle;
  document.getElementById("logoutBtn").onclick = logoutUser;
}