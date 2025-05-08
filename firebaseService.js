const admin = require('firebase-admin');

// Leggi il JSON dalla variabile ambiente
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://musebrush-app-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();

exports.saveProject = async (req, res) => {
  try {
    const { uid, project } = req.body;
    await db.ref(`progetti/${uid}`).push(project);
    res.status(200).send({ message: '✅ Progetto salvato!' });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

exports.loadProjects = async (req, res) => {
  try {
    const { uid } = req.query;
    const snapshot = await db.ref(`progetti/${uid}`).once('value');
    res.status(200).send(snapshot.val());
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};
