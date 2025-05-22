// mongodbService.js

import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('🚨 MONGODB_URI environment variable is not set');
}

const client = new MongoClient(uri);
let progettiCollection;

/**
 * Restituisce la collection "progetti", con connessione lazy e caching.
 * @returns {Promise<import('mongodb').Collection>}
 */
async function getCollection() {
  if (!progettiCollection) {
    await client.connect();
    const db = client.db('musebrush');
    progettiCollection = db.collection('progetti');
  }
  return progettiCollection;
}

/**
 * Salva un nuovo progetto associato all'utente in sessione.
 */
export async function saveProject(req, res) {
  try {
    const uid = req.session?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Non autenticato' });
    }
    const { project } = req.body;
    if (!project || typeof project !== 'object') {
      return res.status(400).json({ error: 'Payload progetto non valido' });
    }

    const col = await getCollection();
    const result = await col.insertOne({ uid, ...project });
    return res.json({ message: '✅ Progetto salvato!', id: result.insertedId });
  } catch (err) {
    console.error('Errore saveProject:', err);
    return res.status(500).json({ error: 'Errore interno durante il salvataggio' });
  }
}

/**
 * Recupera tutti i progetti dell'utente in sessione.
 */
export async function loadProjects(req, res) {
  try {
    const uid = req.session?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const col = await getCollection();
    const results = await col.find({ uid }).toArray();
    const mapped = results.reduce((acc, p) => {
      acc[p._id] = {
        nome:      p.nome,
        layers:    p.layers,
        preview:   p.preview,
        timestamp: p.timestamp
      };
      return acc;
    }, {});

    return res.json(mapped);
  } catch (err) {
    console.error('Errore loadProjects:', err);
    return res.status(500).json({ error: 'Errore interno durante il caricamento dei progetti' });
  }
}

/**
 * Aggiorna un progetto esistente dell'utente in sessione.
 */
export async function updateProject(req, res) {
  try {
    const uid = req.session?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Non autenticato' });
    }
    const { projectId, project } = req.body;
    if (!projectId || !ObjectId.isValid(projectId) || !project) {
      return res.status(400).json({ error: 'Parametri non validi' });
    }

    const col = await getCollection();
    const result = await col.updateOne(
      { _id: new ObjectId(projectId), uid },
      { $set: project }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }
    return res.json({ message: '✅ Progetto aggiornato!' });
  } catch (err) {
    console.error('Errore updateProject:', err);
    return res.status(500).json({ error: 'Errore interno durante l\'aggiornamento' });
  }
}

/**
 * Elimina un progetto dell'utente in sessione.
 */
export async function deleteProject(req, res) {
  try {
    const uid = req.session?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Non autenticato' });
    }
    const { projectId } = req.body;
    if (!projectId || !ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'projectId non valido' });
    }

    const col = await getCollection();
    const result = await col.deleteOne({ _id: new ObjectId(projectId), uid });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Progetto non trovato o non autorizzato' });
    }
    return res.json({ message: '✅ Progetto eliminato!' });
  } catch (err) {
    console.error('Errore deleteProject:', err);
    return res.status(500).json({ error: 'Errore interno durante l\'eliminazione' });
  }
}
