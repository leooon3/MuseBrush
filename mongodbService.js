const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

async function connect() {
  if (!db) {
    await client.connect();
    db = client.db("musebrush");
  }
  return db.collection("progetti");
}

exports.saveProject = async (req, res) => {
  const uid = req.session.uid;
  if (!uid) return res.status(401).json({ error: 'Non autenticato' });
  const { project } = req.body;
  const col = await connect();
  const result = await col.insertOne({ uid, ...project });
  res.json({ message: '✅ Progetto salvato!', id: result.insertedId });
};

exports.loadProjects = async (req, res) => {
  const uid = req.session.uid;
  if (!uid) return res.status(401).json({ error: 'Non autenticato' });
  const col = await connect();
  const results = await col.find({ uid }).toArray();
  const mapped = {};
  results.forEach(p => {
    mapped[p._id] = {
      nome: p.nome,
      layers: p.layers,
      preview: p.preview,
      timestamp: p.timestamp
    };
  });
  res.json(mapped);
};

exports.updateProject = async (req, res) => {
  const uid = req.session.uid;
  if (!uid) return res.status(401).json({ error: 'Non autenticato' });
  const { projectId, project } = req.body;
  const col = await connect();
  await col.updateOne(
    { _id: new ObjectId(projectId), uid },
    { $set: project }
  );
  res.json({ message: '✅ Progetto aggiornato!' });
};

exports.deleteProject = async (req, res) => {
  const uid = req.session.uid;
  if (!uid) return res.status(401).json({ error: 'Non autenticato' });
  const { projectId } = req.body;
  const col = await connect();
  await col.deleteOne({ _id: new ObjectId(projectId), uid });
  res.json({ message: '✅ Progetto eliminato!' });
};
