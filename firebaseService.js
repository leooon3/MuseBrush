const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://musebrush-app-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();
const auth = admin.auth();

exports.saveProject = async (req, res) => {
  const { uid, project } = req.body;
  await db.ref(`progetti/${uid}`).push(project);
  res.send({ message: '✅ Progetto salvato!' });
};

exports.loadProjects = async (req, res) => {
  const { uid } = req.query;
  const snapshot = await db.ref(`progetti/${uid}`).once('value');
  res.send(snapshot.val());
};

exports.registerUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await auth.createUser({ email, password, emailVerified: false });
    res.send({ uid: user.uid, message: '✅ Registrazione completata!' });
  } catch (err) {
    res.status(400).send({ error: 'Errore registrazione: ' + err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await auth.getUserByEmail(email);
    res.send({ uid: user.uid, message: '✅ Login backend riuscito!' });
  } catch (err) {
    res.status(400).send({ error: 'Errore login: ' + err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    await auth.generatePasswordResetLink(email);
    res.send({ message: '✅ Email di reset password inviata!' });
  } catch (err) {
    res.status(400).send({ error: 'Errore reset password: ' + err.message });
  }
};

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    res.send({ uid: decodedToken.uid, message: '✅ Google login verificato!' });
  } catch (err) {
    res.status(400).send({ error: 'Errore Google login: ' + err.message });
  }
};
