const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');
const controller = require('../controllers/alertsController');

// GET /api/alerts - Obtener todas las alertas
router.get('/', controller.getAll);

// GET /api/alerts/summary - Resumen de alertas
router.get('/summary', controller.getSummary);

// POST /api/alerts/generate - Generar alertas automáticas
router.post('/generate', controller.generateAlerts);

// POST /api/alerts/telegram-send - Admin envía recordatorios por Telegram
router.post('/telegram-send', adminOnly, controller.sendTelegramReminders);

// PUT /api/alerts/read-all - Marcar todas como leídas
router.put('/read-all', controller.markAllAsRead);

// PUT /api/alerts/:id/read - Marcar como leída
router.put('/:id/read', controller.markAsRead);

// DELETE /api/alerts/:id - Eliminar alerta
router.delete('/:id', controller.delete);

module.exports = router;

