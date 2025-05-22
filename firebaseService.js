const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const axios = require('axios');
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;


const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://musebrush-app-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();
const auth = admin.auth();

// Configuration nodemailer from variables .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// user registration
// firebaseService.js
exports.registerUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await auth.createUser({ email, password, emailVerified: false });
    // Genera subito il link di verifica
    const link = await auth.generateEmailVerificationLink(email);
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Verifica il tuo indirizzo e-mail per MuseBrush",
      html: `
        <p>Ciao!</p>
        <p>Per completare la registrazione, clicca sul seguente link:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Se non sei stato tu a registrarti, ignora questa mail.</p>
      `
    });
    res.json({ uid: user.uid, message: '✅ Registrazione completata! Controlla la tua casella per la verifica.' });
  } catch (err) {
    console.error('❌ Errore registrazione:', err.message);
    res.status(400).json({ error: 'Errore registrazione: ' + err.message });
  }
};


// Login (check only if the user exist)
// firebaseService.js
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email e password richiesti." });
  }

  try {
    // 1) Sign-in con REST API di Firebase
    const loginResp = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      { email, password, returnSecureToken: true }
    );
    const idToken = loginResp.data.idToken;

    // 2) Verifica token e controlla email_verified
    const decoded = await auth.verifyIdToken(idToken);
    if (!decoded.email_verified) {
      return res.status(400).json({ error: "❌ Devi verificare la tua e-mail prima di entrare." });
    }

    // 3) Tutto OK
    res.json({ uid: decoded.uid, message: "✅ Login riuscito!" });
  } catch (err) {
    const serverMsg = err.response?.data?.error?.message || err.message;
    res.status(400).json({ error: "Login fallito: " + serverMsg });
  }
};

// --- RISPEDISCI LINK DI VERIFICA ---
exports.resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email mancante nella richiesta." });
  }

  try {
    const link = await auth.generateEmailVerificationLink(email);
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Verifica il tuo indirizzo e-mail per MuseBrush",
      html: `<p>Clicca qui per verificare:</p><p><a href="${link}">${link}</a></p>`
    });
    res.json({ link });
  } catch (err) {
    res.status(400).json({ error: "Errore invio verifica: " + err.message });
  }
};

// --- RISPEDISCI LINK DI RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email mancante nella richiesta." });
  }

  try {
    const link = await auth.generatePasswordResetLink(email);
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Reset password per MuseBrush",
      html: `<p>Clicca qui per resettare la password:</p><p><a href="${link}">${link}</a></p>`
    });
    res.json({ link });
  } catch (err) {
    res.status(400).json({ error: "Errore reset password: " + err.message });
  }
};
