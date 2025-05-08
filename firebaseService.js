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
    if (!uid || !project) {
      return res.status(400).send({ error: 'uid e project sono richiesti' });
    }

    console.log(`Salvataggio progetto per utente ${uid}`);
    const ref = await db.ref(`progetti/${uid}`).push(project);
    res.status(200).send({ message: '✅ Progetto salvato!', id: ref.key });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

exports.loadProjects = async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) {
      return res.status(400).send({ error: 'uid è richiesto' });
    }

    console.log(`Caricamento progetti per utente ${uid}`);
    const snapshot = await db.ref(`progetti/${uid}`).once('value');
    res.status(200).send(snapshot.val());
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};
