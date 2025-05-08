const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://musebrush-app-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();
const auth = admin.auth();

exports.saveProject = async (req, res) => {
  const { uid, project } = req.body;
  console.log(`💾 Salvataggio progetto per UID: ${uid}`);
  await db.ref(`progetti/${uid}`).push(project);
  res.send({ message: '✅ Progetto salvato!' });
};

exports.loadProjects = async (req, res) => {
  const { uid } = req.query;
  console.log(`📥 Caricamento progetti per UID: ${uid}`);
  const snapshot = await db.ref(`progetti/${uid}`).once('value');
  res.send(snapshot.val());
};

exports.registerUser = async (req, res) => {
  const { email, password } = req.body;
  console.log(`👤 Registrazione utente email: ${email}`);
  try {
    const user = await auth.createUser({ email, password, emailVerified: false });
    res.send({ uid: user.uid, message: '✅ Registrazione completata!' });
  } catch (err) {
    console.error('❌ Errore registrazione:', err.message);
    res.status(400).send({ error: 'Errore registrazione: ' + err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email } = req.body;
  console.log(`🔑 Login utente email: ${email}`);
  try {
    const user = await auth.getUserByEmail(email);
    res.send({ uid: user.uid, message: '✅ Login backend riuscito!' });
  } catch (err) {
    console.error('❌ Errore login:', err.message);
    res.status(400).send({ error: 'Errore login: ' + err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  console.log(`✉️ Reset password email: ${email}`);
  try {
    await auth.generatePasswordResetLink(email);
    res.send({ message: '✅ Email di reset password inviata!' });
  } catch (err) {
    console.error('❌ Errore reset password:', err.message);
    res.status(400).send({ error: 'Errore reset password: ' + err.message });
  }
};

exports.updateProject = async (req, res) => {
  const { uid, projectId, project } = req.body;
  console.log(`✏️ Aggiornamento progetto ${projectId} per UID: ${uid}`);

  if (!uid || !projectId || !project) {
    console.error('❌ Richiesta incompleta per aggiornamento');
    return res.status(400).send({ error: 'uid, projectId e project sono richiesti' });
  }

  try {
    const projectRef = db.ref(`progetti/${uid}/${projectId}`);
    const snapshot = await projectRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).send({ error: 'Progetto non trovato' });
    }

    await projectRef.update(project);
    res.send({ message: '✅ Progetto aggiornato con successo!' });
  } catch (err) {
    console.error('❌ Errore aggiornamento progetto:', err.message);
    res.status(500).send({ error: 'Errore aggiornamento progetto: ' + err.message });
  }
};
