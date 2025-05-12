require('dotenv').config();
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

// 🔐 File chiave Firebase
const serviceAccount = require('./serviceAccountKey.json');

// ✅ Inizializza Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://musebrush-app-default-rtdb.europe-west1.firebasedatabase.app'
});

// ✅ Connessione MongoDB
const mongoClient = new MongoClient(process.env.MONGODB_URI);

async function migrate() {
  try {
    console.log("🔗 Connessione a Firebase e MongoDB...");

    const dbRef = admin.database().ref('progetti');
    const snapshot = await dbRef.once('value');
    const data = snapshot.val();

    if (!data) {
      console.log("📭 Nessun progetto trovato in Firebase.");
      return;
    }

    await mongoClient.connect();
    const mongoDb = mongoClient.db('musebrush');
    const col = mongoDb.collection('progetti');

    const entries = Object.entries(data); // [uid, { projectId: {projectData} }]

    for (const [uid, progettiUtente] of entries) {
      for (const progetto of Object.values(progettiUtente)) {
        const record = {
          uid,
          nome: progetto.nome || "Senza nome",
          layers: progetto.layers || [],
          preview: progetto.preview || null,
          timestamp: progetto.timestamp || Date.now()
        };

        await col.insertOne(record);
        console.log(`✅ Migrato progetto "${record.nome}" per utente ${uid}`);
      }
    }

    console.log("🎉 Migrazione completata con successo!");
  } catch (err) {
    console.error("❌ Errore durante la migrazione:", err);
  } finally {
    await mongoClient.close();
    process.exit();
  }
}

migrate();
