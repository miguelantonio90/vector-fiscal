const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // NIT - Identificador fiscal único
  nit: {
    type: String,
    required: [true, 'El NIT es requerido'],
    unique: true,
    trim: true
  },
  // Nombre completo
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  // Contraseña (hasheada)
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [4, 'La contraseña debe tener al menos 4 caracteres']
  },
  // Rol del usuario
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Hash password antes de guardar
userSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) {
    return next();
  }
  
  // Hashear con salt de 10 rounds
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para retornar usuario sin password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);

