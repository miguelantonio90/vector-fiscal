const express = require('express');
const router = express.Router();
const controller = require('../controllers/incomesController');

// GET /api/incomes - Obtener todos los ingresos
router.get('/', controller.getAll);

// GET /api/incomes/summary - Resumen anual
router.get('/summary', controller.getAnnualSummary);

// GET /api/incomes/:month/:year - Obtener ingreso por mes/año
router.get('/:month/:year', controller.getByMonthYear);

// POST /api/incomes - Crear o actualizar ingreso
router.post('/', controller.upsert);

// DELETE /api/incomes/:month/:year - Eliminar ingreso
router.delete('/:month/:year', controller.delete);

module.exports = router;

