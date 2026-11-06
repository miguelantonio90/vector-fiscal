const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const controller = require('../controllers/telegramController');

// Público: webhook de Telegram
router.post('/webhook', controller.webhook);

// Autenticados
router.get('/status', auth, controller.status);
router.post('/link-code', auth, controller.createLinkCode);
router.delete('/unlink', auth, controller.unlink);

// Admin (también acepta x-cron-secret dentro del controller si se monta sin auth)
router.post('/setup-webhook', auth, adminOnly, controller.setupWebhook);

module.exports = router;
