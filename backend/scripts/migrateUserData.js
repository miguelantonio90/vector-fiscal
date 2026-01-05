/**
 * Script para migrar datos al usuario correcto en MongoDB Atlas
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://mionat:mionat@mongodb.6i2b86k.mongodb.net/mionat?retryWrites=true&w=majority';
const TARGET_NIT = '90121542264';

async function migrateData() {
  try {
    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const obligationsCollection = db.collection('obligations');
    const paymentsCollection = db.collection('payments');
    const incomesCollection = db.collection('incomes');

    // 1. Listar todos los usuarios
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`\n📋 Usuarios en la BD (${allUsers.length}):`);
    allUsers.forEach(u => {
      console.log(`   - ${u.nit} | ${u.name} | ID: ${u._id}`);
    });

    // 2. Listar obligaciones
    const allObligations = await obligationsCollection.find({}).toArray();
    console.log(`\n📋 Obligaciones en la BD: ${allObligations.length}`);
    if (allObligations.length > 0) {
      console.log(`   Primera obligación user ID: ${allObligations[0].user}`);
    }

    // 3. Buscar o crear usuario destino
    let targetUser = await usersCollection.findOne({ nit: TARGET_NIT });
    
    if (!targetUser) {
      console.log(`\n⚠️ Usuario ${TARGET_NIT} no existe. Creándolo...`);
      const hashedPassword = await bcrypt.hash(TARGET_NIT, 10);
      const result = await usersCollection.insertOne({
        nit: TARGET_NIT,
        name: 'Miguel Antonio Cabreja Aldana',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      targetUser = await usersCollection.findOne({ _id: result.insertedId });
      console.log(`   ✅ Usuario creado con ID: ${targetUser._id}`);
    } else {
      console.log(`\n👤 Usuario encontrado: ${targetUser.name} (ID: ${targetUser._id})`);
    }

    const targetUserId = targetUser._id;

    // 4. Actualizar todas las obligaciones
    const obligationsResult = await obligationsCollection.updateMany(
      {},
      { $set: { user: targetUserId } }
    );
    console.log(`\n📋 Obligaciones actualizadas: ${obligationsResult.modifiedCount}`);

    // 5. Actualizar todos los pagos
    const paymentsResult = await paymentsCollection.updateMany(
      {},
      { $set: { user: targetUserId } }
    );
    console.log(`💰 Pagos actualizados: ${paymentsResult.modifiedCount}`);

    // 6. Actualizar todos los ingresos
    const incomesResult = await incomesCollection.updateMany(
      {},
      { $set: { user: targetUserId } }
    );
    console.log(`📈 Ingresos actualizados: ${incomesResult.modifiedCount}`);

    // 7. Verificar
    console.log('\n✅ ¡Migración completada!');
    console.log('\n📊 Verificación:');
    console.log(`   - Obligaciones del usuario: ${await obligationsCollection.countDocuments({ user: targetUserId })}`);
    console.log(`   - Pagos del usuario: ${await paymentsCollection.countDocuments({ user: targetUserId })}`);
    console.log(`   - Ingresos del usuario: ${await incomesCollection.countDocuments({ user: targetUserId })}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB Atlas');
  }
}

migrateData();
