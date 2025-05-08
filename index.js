const express = require('express');
const cors = require('cors');
const firebaseService = require('./firebaseService');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/saveProject', firebaseService.saveProject);
app.get('/api/loadProjects', firebaseService.loadProjects);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
