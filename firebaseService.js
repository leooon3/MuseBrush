
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const axios = require('axios');

// Variabili di ambiente
const FIREBASE_API_KEY       = process.env.FIREBASE_API_KEY;
const FB_DATABASE_URL        = process.env.FB_DATABASE_URL;
const SMTP_HOST              = process.env.SMTP_HOST;
const SMTP_PORT              = parseInt(process.env.SMTP_PORT, 10);
const SMTP_SECURE            = process.env.SMTP_SECURE === 'true';
const SMTP_USER              = process.env.SMTP_USER;
const SMTP_PASS              = process.env.SMTP_PASS;

// Carica il service account: o come JSON intero (GOOGLE_APPLICATION_CREDENTIALS_JSON)
// o come singoli campi FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
} else {
  serviceAccount = {
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}

// Inizializza Admin SDK **una sola volta**
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: FB_DATABASE_URL
  });
}

const auth = admin.auth();
const db   = admin.database();

// Configura Nodemailer
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
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
    const { data } = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      { email, password, returnSecureToken: true }
    );
    // 2) Verifica il token e la proprietà email_verified
    const decoded = await admin.auth().verifyIdToken(data.idToken);
    if (!decoded.email_verified) {
      return res.status(400).json({ error: "❌ Verifica la tua e-mail prima di accedere." });
    }
    // 3) OK!
    res.json({ uid: decoded.uid, message: "✅ Login riuscito!" });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    res.status(400).json({ error: "Login fallito: " + msg });
  }
};
// --- RISPEDISCI LINK DI VERIFICA ---
exports.resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email mancante." });
  try {
    const link = await admin.auth().generateEmailVerificationLink(email);
    // usa il tuo transporter SMTP per inviare `link` all’indirizzo
    res.json({ link });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// --- RISPEDISCI LINK DI RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email mancante." });
  try {
    const link = await admin.auth().generatePasswordResetLink(email);
    // invia `link` via mail
    res.json({ link });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

