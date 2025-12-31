require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const { auth } = require('./middleware/auth');

// Conectar a MongoDB
connectDB();

const app = express();

// Configuración de CORS para producción
const corsOptions = {
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Rutas públicas (sin autenticación)
app.use('/api/auth', require('./routes/auth'));

// Ruta de health check para Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MiONAT API funcionando', timestamp: new Date().toISOString() });
});

// Rutas protegidas (requieren autenticación)
app.use('/api/obligations', auth, require('./routes/obligations'));
app.use('/api/payments', auth, require('./routes/payments'));
app.use('/api/incomes', auth, require('./routes/incomes'));
app.use('/api/calculator', auth, require('./routes/calculator'));
app.use('/api/alerts', auth, require('./routes/alerts'));
app.use('/api/predictions', auth, require('./routes/predictions'));

// Rutas de administración (requieren autenticación + rol admin)
app.use('/api/users', require('./routes/users'));

// En producción, servir el frontend desde el backend
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Cualquier ruta que no sea /api, servir el index.html (para Vue Router)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MiONAT API corriendo en puerto ${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

