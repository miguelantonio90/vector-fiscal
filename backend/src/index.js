require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { auth } = require('./middleware/auth');

// Conectar a MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas públicas (sin autenticación)
app.use('/api/auth', require('./routes/auth'));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vector Fiscal API funcionando' });
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

