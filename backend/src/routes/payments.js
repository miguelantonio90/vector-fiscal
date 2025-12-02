const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentsController');

// GET /api/payments - Obtener todos los pagos
router.get('/', controller.getAll);

// GET /api/payments/summary - Resumen de pagos
router.get('/summary', controller.getSummary);

// GET /api/payments/:id - Obtener un pago
router.get('/:id', controller.getById);

// POST /api/payments - Registrar pago
router.post('/', controller.create);

// PUT /api/payments/:id - Actualizar pago
router.put('/:id', controller.update);

// DELETE /api/payments/:id - Eliminar pago
router.delete('/:id', controller.delete);

module.exports = router;

