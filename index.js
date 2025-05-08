const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const firebaseService = require('./firebaseService');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({ secret: 'supersecret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/googleCallback`
}, (accessToken, refreshToken, profile, done) => {
  return done(null, { uid: profile.id, displayName: profile.displayName });
}));

app.get('/api/googleLogin', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/googleCallback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Redirige al frontend passando l’uid come parametro
    res.redirect(`${process.env.FRONTEND_URL}/?uid=${req.user.uid}`);
  });

app.post('/api/saveProject', firebaseService.saveProject);
app.get('/api/loadProjects', firebaseService.loadProjects);
app.post('/api/register', firebaseService.registerUser);
app.post('/api/login', firebaseService.loginUser);
app.post('/api/resetPassword', firebaseService.resetPassword);
app.post('/api/resendVerification', firebaseService.resendVerification);

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Server attivo 🚀');
});
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
