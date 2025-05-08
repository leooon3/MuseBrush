// 📂 index.js aggiornato backend completo
const express = require('express');
const cors = require('cors');
const firebaseService = require('./firebaseService');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/saveProject', firebaseService.saveProject);
app.get('/api/loadProjects', firebaseService.loadProjects);
app.post('/api/register', firebaseService.registerUser);
app.post('/api/login', firebaseService.loginUser);
app.post('/api/resetPassword', firebaseService.resetPassword);
app.post('/api/googleLogin', firebaseService.googleLogin);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
