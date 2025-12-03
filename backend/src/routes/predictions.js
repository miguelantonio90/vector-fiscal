const express = require('express');
const router = express.Router();
const predictionsController = require('../controllers/predictionsController');

// GET /api/predictions/income - Predicción de ingresos futuros
router.get('/income', predictionsController.predictIncome);

// GET /api/predictions/taxes - Estimación de impuestos futuros
router.get('/taxes', predictionsController.estimateTaxes);

// GET /api/predictions/cashflow - Análisis de flujo de caja
router.get('/cashflow', predictionsController.getCashFlow);

// GET /api/predictions/insights - Insights para el dashboard
router.get('/insights', predictionsController.getDashboardInsights);

// POST /api/predictions/calculate - Calcular impuestos para un ingreso
router.post('/calculate', predictionsController.calculateEstimate);

// GET /api/predictions/summary - Resumen completo de predicciones
router.get('/summary', predictionsController.getSummary);

module.exports = router;

