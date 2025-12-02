const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Herd usa el puerto 27020 por defecto
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27020/vector-fiscal';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB conectado: ${conn.connection.host}:${conn.connection.port}`);
  } catch (error) {
    console.error(`Error de conexión: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

