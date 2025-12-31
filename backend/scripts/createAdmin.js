/**
 * Script para crear el usuario administrador inicial
 * 
 * Uso:
 *   MONGODB_URI="tu-uri-de-atlas" node scripts/createAdmin.js
 * 
 * O configurar las variables abajo:
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// CONFIGURA TUS DATOS AQUÍ
// ============================================
const ADMIN_NIT = '90121542264';           // Tu NIT
const ADMIN_NAME = 'Miguel Antonio';        // Tu nombre
const ADMIN_PASSWORD = '90121542264';       // Tu contraseña (cámbiala después)
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mionat:mionat@mongodb.6i2b86k.mongodb.net/mionat?retryWrites=true&w=majority';

// Schema del usuario
const userSchema = new mongoose.Schema({
  nit: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe
    const existingUser = await User.findOne({ nit: ADMIN_NIT });
    
    if (existingUser) {
      console.log('⚠️  Usuario ya existe. Actualizando a admin...');
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('✅ Usuario actualizado a admin');
    } else {
      // Hash de la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

      // Crear usuario
      const admin = new User({
        nit: ADMIN_NIT,
        name: ADMIN_NAME,
        password: hashedPassword,
        role: 'admin'
      });

      await admin.save();
      console.log('✅ Usuario admin creado exitosamente');
    }

    console.log('\n📋 Datos del admin:');
    console.log(`   NIT: ${ADMIN_NIT}`);
    console.log(`   Nombre: ${ADMIN_NAME}`);
    console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    console.log(`   Rol: admin`);
    console.log('\n🔐 Recuerda cambiar la contraseña después de iniciar sesión!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

createAdmin();

