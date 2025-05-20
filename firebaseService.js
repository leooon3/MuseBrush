const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

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
exports.registerUser = async (req, res) => {
  const { email, password } = req.body;
  console.log(`👤 Registrazione utente email: ${email}`);
  try {
    const user = await auth.createUser({ email, password, emailVerified: false });
    res.json({ uid: user.uid, message: '✅ Registrazione completata!' });
  } catch (err) {
    console.error('❌ Errore registrazione:', err.message);
    res.status(400).json({ error: 'Errore registrazione: ' + err.message });
  }
};

// Login (check only if the user exist)
exports.loginUser = async (req, res) => {
  const { email } = req.body;
  console.log(`🔑 Login utente email: ${email}`);
  try {
    const user = await auth.getUserByEmail(email);
    res.json({ uid: user.uid, message: '✅ Login backend riuscito!' });
  } catch (err) {
    console.error('❌ Errore login:', err.message);
    res.status(400).json({ error: 'Errore login: ' + err.message });
  }
};

// check if email is real sending an email to the given one
exports.resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email mancante nella richiesta" });

  try {
    const link = await auth.generateEmailVerificationLink(email);

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Verify your email for MuseBrush",
      html: `
        <p>Hello,</p>
        <p>Follow this link to verify your email address:</p>
        <p><a href="${link}">${link}</a></p>
        <p>If you didn’t ask to verify this address, you can ignore this email.</p>
        <p>Thanks,<br>MuseBrush team</p>
      `
    });

    console.log(`📨 Email di verifica inviata a ${email}`);
    res.json({ message: "📨 Email di verifica inviata con successo." });
  } catch (err) {
    console.error("❌ Errore invio verifica:", err.message);
    res.status(400).json({ error: "Errore invio verifica: " + err.message });
  }
};

// Email reset with a personalized pasword
exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email mancante nella richiesta" });

  try {
    const link = await auth.generatePasswordResetLink(email);

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Reset your password for MuseBrush",
      html: `
        <p>Hello,</p>
        <p>Follow this link to reset your MuseBrush password:</p>
        <p><a href="${link}">${link}</a></p>
        <p>If you didn’t ask to reset your password, you can ignore this email.</p>
        <p>Thanks,<br>MuseBrush team</p>
      `
    });

    console.log(`📨 Email di reset inviata a ${email}`);
    res.json({ message: "✅ Email di reset inviata con successo." });
  } catch (err) {
    console.error("❌ Errore reset password:", err.message);
    res.status(400).json({ error: "Errore reset password: " + err.message });
  }
};

