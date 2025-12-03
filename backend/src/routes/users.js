const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const usersController = require('../controllers/usersController');

// Todas las rutas requieren autenticación y rol de admin
router.use(auth);
router.use(adminOnly);

// GET /api/users - Listar todos los usuarios
router.get('/', usersController.getAllUsers);

// GET /api/users/stats - Obtener estadísticas generales
router.get('/stats', usersController.getStats);

// GET /api/users/:id - Obtener un usuario por ID
router.get('/:id', usersController.getUserById);

// POST /api/users - Crear un nuevo usuario
router.post('/', usersController.createUser);

// PUT /api/users/:id - Actualizar un usuario
router.put('/:id', usersController.updateUser);

// DELETE /api/users/:id - Eliminar un usuario
router.delete('/:id', usersController.deleteUser);

module.exports = router;

