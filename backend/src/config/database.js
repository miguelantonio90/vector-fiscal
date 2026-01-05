const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Herd usa el puerto 27020 por defecto
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27020/vector-fiscal';
    console.log(`🔌 Conectando a MongoDB...`);
    console.log(`   URI: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`); // Ocultar password en logs
    
    const conn = await mongoose.connect(mongoUri);
    
    console.log(`✅ MongoDB conectado:`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Port: ${conn.connection.port || 'Atlas'}`);
  } catch (error) {
    console.error(`❌ Error de conexión: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

