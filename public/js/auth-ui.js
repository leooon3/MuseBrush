// ================================
// 7. Auth UI & State Handling
// ================================
  export function initAuthUI() {
    document.getElementById("resendVerificationBtn").onclick = () => {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        user.sendEmailVerification()
          .then(() => alert("📨 Email di verifica inviata di nuovo!"))
          .catch(err => alert("Errore: " + err.message));
      } else {
        alert("✅ La tua email è già verificata oppure non sei loggato.");
      }
    };
    
    document.getElementById("forgotPasswordBtn").onclick = () => {
      const email = document.getElementById("emailInput").value.trim();
      if (!email) {
        return alert("📧 Inserisci l'email con cui ti sei registrato.");
      }
    
      auth.sendPasswordResetEmail(email)
        .then(() => {
          alert("📬 Ti abbiamo inviato un'email per reimpostare la password.");
        })
        .catch(error => {
          alert("Errore: " + error.message);
        });
    };
  }
  
  