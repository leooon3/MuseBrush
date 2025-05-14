const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://musebrush-app-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();
const auth = admin.auth();

// ✉️ Configurazione nodemailer da variabili .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// 👤 Registrazione utente
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

// 🔐 Login (solo verifica se l'utente esiste)
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

// 🔁 Email di verifica personalizzata
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

// 🔒 Email reset password personalizzata
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

// ℹ️ Le altre API (progetti) restano invariate...


/*
exports.deleteProject = async (req, res) => {
  const { uid, projectId } = req.body;
  console.log(`🗑️ Eliminazione progetto ${projectId} per UID: ${uid}`);

  if (!uid || !projectId) {
    return res.status(400).json({ error: 'uid e projectId sono richiesti' });
  }

  try {
    await admin.database().ref(`progetti/${uid}/${projectId}`).remove();
    res.json({ message: '✅ Progetto eliminato con successo!' });
  } catch (err) {
    console.error('❌ Errore eliminazione progetto:', err.message);
    res.status(500).json({ error: 'Errore eliminazione progetto: ' + err.message });
  }
};
exports.saveProject = async (req, res) => {
  const { uid, project } = req.body;
  console.log(`💾 Salvataggio progetto per UID: ${uid}`);
  await db.ref(`progetti/${uid}`).push(project);
  res.json({ message: '✅ Progetto salvato!' });
};

exports.loadProjects = async (req, res) => {
  const { uid } = req.query;
  console.log(`📥 Caricamento progetti per UID: ${uid}`);
  const snapshot = await db.ref(`progetti/${uid}`).once('value');
  res.json(snapshot.val());
};
exports.updateProject = async (req, res) => {
  const { uid, projectId, project } = req.body;
  console.log(`✏️ Aggiornamento progetto ${projectId} per UID: ${uid}`);

  if (!uid || !projectId || !project) {
    console.error('❌ Richiesta incompleta per aggiornamento');
    return res.status(400).json({ error: 'uid, projectId e project sono richiesti' });
  }

  try {
    const projectRef = db.ref(`progetti/${uid}/${projectId}`);
    const snapshot = await projectRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }

    await projectRef.update(project);
    res.json({ message: '✅ Progetto aggiornato con successo!' });
  } catch (err) {
    console.error('❌ Errore aggiornamento progetto:', err.message);
    res.status(500).json({ error: 'Errore aggiornamento progetto: ' + err.message });
  }
};
 
*/