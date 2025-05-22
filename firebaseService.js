// firebaseService.js

import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import axios from 'axios';

// Verifica delle variabili d’ambiente
const {
  FIREBASE_API_KEY,
  FB_DATABASE_URL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  FROM_EMAIL,
  GOOGLE_APPLICATION_CREDENTIALS_JSON,
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY
} = process.env;

if (!FIREBASE_API_KEY || !FB_DATABASE_URL) {
  throw new Error('🚨 Firebase config environment variables are missing');
}

// Configura le credenziali del service account
let serviceAccount;
if (GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  serviceAccount = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
} else {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('🚨 Firebase service account env vars are missing');
  }
  serviceAccount = {
    projectId:   FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey:  FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}

// Inizializza l’Admin SDK (singleton)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: FB_DATABASE_URL
  });
}

const auth = admin.auth();

// Configura Nodemailer
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === 'true',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

/**
 * Invia una mail tramite Nodemailer.
 * @param {{ to: string; subject: string; html: string }} mailOptions
 */
async function sendMail({ to, subject, html }) {
  await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
}

/**
 * Registra un nuovo utente e invia il link di verifica.
 */
export async function registerUser(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono richiesti.' });
  }
  try {
    const user = await auth.createUser({ email, password, emailVerified: false });
    const link = await auth.generateEmailVerificationLink(email);
    await sendMail({
      to: email,
      subject: 'Verifica il tuo indirizzo e-mail per MuseBrush',
      html: `
        <p>Ciao!</p>
        <p>Per completare la registrazione, clicca sul seguente link:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Se non sei stato tu a registrarti, ignora questa mail.</p>
      `
    });
    return res.json({ uid: user.uid, message: '✅ Registrazione completata! Controlla la tua casella per la verifica.' });
  } catch (err) {
    console.error('Errore registrazione:', err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Effettua il login via REST API Firebase e verifica il token.
 */
export async function loginUserRaw(email, password) {
  if (!email || !password) {
    const e = new Error('Email e password sono richiesti.');
    e.statusCode = 400;
    throw e;
  }
  try {
    const { data } = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      { email, password, returnSecureToken: true }
    );
    const decoded = await auth.verifyIdToken(data.idToken);
    if (!decoded.email_verified) {
      const e = new Error('Verifica la tua e-mail prima di accedere.');
      e.statusCode = 400;
      throw e;
    }
    return { uid: decoded.uid, message: '✅ Login riuscito!' };
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    const e = new Error('Login fallito: ' + msg);
    e.statusCode = 400;
    throw e;
  }
}

/**
 * Wrapper per gestire la richiesta di login e rispondere al client.
 */
export async function loginUser(req, res) {
  const { email, password } = req.body;
  try {
    const { uid, message } = await loginUserRaw(email, password);
    return res.json({ uid, message });
  } catch (err) {
    console.error('Errore login:', err);
    return res.status(err.statusCode || 400).json({ error: err.message });
  }
}

/**
 * Reinvia il link di verifica e-mail.
 */
export async function resendVerification(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email mancante.' });
  try {
    const link = await auth.generateEmailVerificationLink(email);
    await sendMail({
      to: email,
      subject: 'Verifica il tuo indirizzo e-mail per MuseBrush',
      html: `<p>Clicca qui per verificare il tuo account: <a href="${link}">${link}</a></p>`
    });
    return res.json({ message: '✅ Link di verifica inviato! Controlla la tua casella di posta.' });
  } catch (err) {
    console.error('Errore invio verifica:', err);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Invia il link per il reset password via e-mail.
 */
export async function resetPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email mancante.' });
  try {
    const link = await auth.generatePasswordResetLink(email);
    await sendMail({
      to: email,
      subject: 'Reset della password per MuseBrush',
      html: `<p>Per resettare la password, clicca qui: <a href="${link}">${link}</a></p>`
    });
    return res.json({ message: '✅ Email di reset password inviata. Controlla la tua casella di posta.' });
  } catch (err) {
    console.error('Errore reset password:', err);
    return res.status(400).json({ error: err.message });
  }
}
