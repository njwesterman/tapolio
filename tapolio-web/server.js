// server.js - Fixed for Express v5+ on Heroku (Jan 2026)

const express = require('express');
const path = require('path');

const app = express();

// Serve static files from your Ionic/Vite build folder
// Confirm this is 'dist' by running `npm run build` locally — change if it's 'build' or 'www'
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route for SPA routing (React/Ionic router handles deep links)
// Use Express v5 compatible syntax with named wildcard
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Heroku provides PORT env var
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});