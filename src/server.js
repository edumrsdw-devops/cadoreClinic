const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./database');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// SPA fallback - serve index.html for all non-API routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

// Fallback middleware for SPA
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║          🌹 CADORE CLINIC - SERVIDOR 🌹          ║
║                                                  ║
║   Servidor rodando em: http://localhost:${PORT}      ║
║   Painel Admin: http://localhost:${PORT}/admin       ║
║                                                  ║
║   Login padrão:                                  ║
║   Usuário: admin                                 ║
║   Senha: cadore2024                              ║
╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
