// ================================
// 1. Firebase Config & Auth
// ================================
const firebaseConfig = {
  apiKey: "AIzaSyDT9cYP9h2Ywyhd1X3dABaYexpyTn9NyTo",
  authDomain: "musebrush-app.firebaseapp.com",
  databaseURL: "https://musebrush-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "musebrush-app",
  storageBucket: "musebrush-app.appspot.com",
  messagingSenderId: "53476649564",
  appId: "1:53476649564:web:c565c2d60ea36652ea1499"
};
firebase.initializeApp(firebaseConfig);
function handleAuthState(user) {
  const authIcon = document.getElementById("authIcon");
  if (!user) {
    auth.signInAnonymously().catch(err => console.error("Errore login anonimo:", err));
    return;
  }
  if (!user.emailVerified && !user.isAnonymous) {
    alert("⚠️ Devi verificare la tua email prima di poter usare l'app.");
    disableSaveAndCollab();
    auth.signOut();
    return;
  }

  if (user.isAnonymous) {
    disableSaveAndCollab();
    authIcon.src = "./images/user.png";
    authIcon.alt = "Account";
  } else {
    enableFullAccess();
    authIcon.src = "./images/user-auth.png";
    authIcon.alt = "Utente autenticato";
  }

  document.getElementById("authModal").classList.add("hidden");
}
function loginWithEmail() {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("✅ Accesso effettuato!"))
    .catch(error => alert("Errore login: " + error.message));
}
function registerWithEmail() {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      user.sendEmailVerification().then(() => {
        alert("📩 Registrazione completata! Controlla la tua email.");
        auth.signOut();
      });
    })
    .catch(error => alert("Errore registrazione: " + error.message));
}
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      alert("✅ Accesso con Google riuscito: " + result.user.displayName);
      document.getElementById("authModal").classList.add("hidden");
    })
    .catch(error => {
      console.error(error);
      alert("Errore login con Google: " + error.message);
    });
}
function logoutUser() {
  auth.signOut();
}


const auth = firebase.auth();
const database = firebase.database();

window.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(handleAuthState);
  document.getElementById("loginBtn").onclick = loginWithEmail;
  document.getElementById("signupBtn").onclick = registerWithEmail;
  document.getElementById("googleLoginBtn").onclick = loginWithGoogle;
  document.getElementById("logoutBtn").onclick = logoutUser;
  document.getElementById("authToggleBtn").onclick = () => {
    document.getElementById("authModal").classList.toggle("hidden");
  };
  window.onclick = (e) => {
    const modal = document.getElementById("authModal");
    if (e.target === modal) modal.classList.add("hidden");
  };
});


function disableSaveAndCollab() {
  ["saveCanvasBtn", "updateProjectBtn", "exportProjectBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
}

function enableFullAccess() {
  ["saveCanvasBtn", "updateProjectBtn", "exportProjectBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });
}

export function authInit() {

  
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const database = firebase.database();

  window.auth = auth;       // rende disponibili globalmente
  window.database = database;

  auth.onAuthStateChanged(handleAuthState);

  document.getElementById("loginBtn").onclick = loginWithEmail;
  document.getElementById("signupBtn").onclick = registerWithEmail;
  document.getElementById("googleLoginBtn").onclick = loginWithGoogle;
  document.getElementById("logoutBtn").onclick = logoutUser;
  document.getElementById("authToggleBtn").onclick = () => {
    document.getElementById("authModal").classList.toggle("hidden");
  };
  window.onclick = (e) => {
    const modal = document.getElementById("authModal");
    if (e.target === modal) modal.classList.add("hidden");
  };
}
