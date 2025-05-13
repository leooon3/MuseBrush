const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://musebrush-app-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();
const auth = admin.auth();
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

exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  console.log(`✉️ Reset password email: ${email}`);
  try {
const link = await auth.generateEmailVerificationLink(email);
console.log("✅ Link generato:", link); // utile per debug

  } catch (err) {
    console.error('❌ Errore reset password:', err.message);
    res.status(400).json({ error: 'Errore reset password: ' + err.message });
  }
};
exports.resendVerification = async (req, res) => {
  const { email } = req.body;
  console.log(`🔁 Reinvia verifica per: ${email}`);
  try {
    const link = await auth.generateEmailVerificationLink(email);
    // Qui puoi anche usare un servizio di invio email custom (es: nodemailer), se vuoi personalizzarlo
    // Per ora rimandiamo direttamente il link all'utente (non ideale in produzione)
    res.json({ message: '📨 Link di verifica generato: controlla la tua email.', link });
  } catch (err) {
    console.error('❌ Errore invio verifica:', err.message);
    res.status(400).json({ error: 'Errore invio verifica: ' + err.message });
  }
};
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