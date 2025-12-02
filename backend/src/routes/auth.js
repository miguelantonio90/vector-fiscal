const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { auth, generateToken } = require('../middleware/auth');

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { name, nit, password } = req.body;
    
    if (!name || !nit || !password) {
      return res.status(400).json({ error: 'Nombre, NIT y contraseña son requeridos.' });
    }
    
    // Verificar si el NIT ya existe
    const existingUser = await User.findOne({ nit });
    if (existingUser) {
      return res.status(400).json({ error: 'Ya existe un usuario con este NIT.' });
    }
    
    // Crear usuario
    const user = new User({
      name,
      nit,
      password
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: user._id,
        nit: user.nit,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { nit, password } = req.body;
    
    if (!nit || !password) {
      return res.status(400).json({ error: 'NIT y contraseña son requeridos.' });
    }
    
    // Buscar usuario por NIT
    const user = await User.findOne({ nit });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    
    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    
    // Generar token
    const token = generateToken(user._id);
    
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        nit: user.nit,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me - Obtener usuario actual
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      nit: req.user.nit,
      name: req.user.name,
      role: req.user.role,
      createdAt: req.user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/auth/profile - Actualizar perfil (nombre y NIT)
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, nit } = req.body;
    const userId = req.user._id;
    
    // Validar campos
    if (!name || !nit) {
      return res.status(400).json({ error: 'Nombre y NIT son requeridos.' });
    }
    
    // Si el NIT cambió, verificar que no exista otro usuario con ese NIT
    if (nit !== req.user.nit) {
      const existingUser = await User.findOne({ nit, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Ya existe otro usuario con este NIT.' });
      }
    }
    
    // Actualizar usuario
    const user = await User.findByIdAndUpdate(
      userId,
      { name, nit },
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Perfil actualizado exitosamente',
      user: {
        id: user._id,
        nit: user.nit,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/auth/password - Cambiar contraseña
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validar campos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas.' });
    }
    
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
    }
    
    // Obtener usuario con password
    const user = await User.findById(req.user._id);
    
    // Verificar contraseña actual
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
    }
    
    // Actualizar contraseña
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

