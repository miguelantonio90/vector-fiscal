const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Secret para JWT (en producción usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'vector-fiscal-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

/**
 * Genera un token JWT para un usuario
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Middleware de autenticación
 * Verifica el token JWT y adjunta el usuario a req.user
 */
async function auth(req, res, next) {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuario
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }
    
    // Adjuntar usuario a la request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado.' });
    }
    res.status(500).json({ error: 'Error de autenticación.' });
  }
}

/**
 * Middleware para verificar rol de administrador
 * Debe usarse después del middleware auth
 */
function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  
  next();
}

module.exports = {
  auth,
  adminOnly,
  generateToken,
  JWT_SECRET
};

