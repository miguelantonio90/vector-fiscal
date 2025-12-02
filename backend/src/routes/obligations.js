const express = require('express');
const router = express.Router();
const controller = require('../controllers/obligationsController');

// GET /api/obligations - Obtener todas las obligaciones
router.get('/', controller.getAll);

// GET /api/obligations/upcoming - Próximos vencimientos
router.get('/upcoming', controller.getUpcoming);

// GET /api/obligations/overdue - Obligaciones vencidas
router.get('/overdue', controller.getOverdue);

// GET /api/obligations/summary - Resumen de obligaciones
router.get('/summary', controller.getSummary);

// POST /api/obligations/import - Importar Vector Fiscal 2025
router.post('/import', controller.importVectorFiscal2025);

// GET /api/obligations/:id - Obtener una obligación
router.get('/:id', controller.getById);

// POST /api/obligations - Crear obligación
router.post('/', controller.create);

// PUT /api/obligations/:id - Actualizar obligación
router.put('/:id', controller.update);

// DELETE /api/obligations/:id - Eliminar obligación
router.delete('/:id', controller.delete);

module.exports = router;

