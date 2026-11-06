const { User } = require('../models');
const telegramBot = require('../services/telegramBot');

// POST /api/telegram/webhook — updates de Telegram
exports.webhook = async (req, res) => {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret) {
      const header = req.headers['x-telegram-bot-api-secret-token'];
      if (header !== secret) {
        return res.status(401).json({ error: 'No autorizado' });
      }
    }

    if (!telegramBot.getToken()) {
      return res.status(503).json({ error: 'Bot no configurado' });
    }

    await telegramBot.handleUpdate(req.body || {});
    res.json({ ok: true });
  } catch (error) {
    console.error('[telegram webhook]', error.message);
    res.status(200).json({ ok: false }); // Telegram reintenta si no es 2xx
  }
};

// GET /api/telegram/status — estado del bot (auth)
exports.status = async (req, res) => {
  try {
    const configured = !!telegramBot.getToken();
    let bot = null;
    if (configured) {
      try {
        bot = await telegramBot.getMe();
      } catch (err) {
        return res.json({
          configured: true,
          ok: false,
          error: err.message,
          username: null,
          linked: !!(req.user.telegramChatId)
        });
      }
    }
    res.json({
      configured,
      ok: configured && !!bot,
      username: bot?.username || null,
      botName: bot?.first_name || null,
      linked: !!(req.user.telegramChatId),
      chatId: req.user.telegramChatId || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/telegram/link-code — generar código de vinculación
exports.createLinkCode = async (req, res) => {
  try {
    if (!telegramBot.getToken()) {
      return res.status(503).json({
        error: 'El bot de Telegram aún no está configurado. Falta TELEGRAM_BOT_TOKEN.'
      });
    }

    const code = telegramBot.generateLinkCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        telegramLinkCode: code,
        telegramLinkExpires: expires
      },
      { new: true }
    );

    let botUsername = null;
    try {
      const me = await telegramBot.getMe();
      botUsername = me.username || null;
    } catch (_) {}

    res.json({
      code: user.telegramLinkCode,
      expiresAt: user.telegramLinkExpires,
      botUsername,
      deepLink: botUsername ? `https://t.me/${botUsername}?start=${code}` : null,
      instructions: botUsername
        ? `Abre https://t.me/${botUsername}?start=${code} o envía /start ${code} al bot`
        : `Envía /start ${code} al bot de MiONAT`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/telegram/unlink — desvincular chat
exports.unlink = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        telegramChatId: '',
        telegramLinkCode: undefined,
        telegramLinkExpires: undefined
      },
      { new: true }
    );
    res.json({
      message: 'Telegram desvinculado',
      telegramChatId: user.telegramChatId || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/telegram/setup-webhook — registrar webhook en Telegram (cron/admin)
exports.setupWebhook = async (req, res) => {
  try {
    const secret = req.headers['x-cron-secret'];
    const isCron = process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
    const isAdmin = req.user?.role === 'admin';
    if (!isCron && !isAdmin) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!telegramBot.getToken()) {
      return res.status(503).json({ error: 'TELEGRAM_BOT_TOKEN no configurado' });
    }

    const base = process.env.TELEGRAM_WEBHOOK_BASE || process.env.FRONTEND_URL?.replace('-web', '-api') || '';
    const url = (req.body?.url || `${base}/api/telegram/webhook`).replace(/\/$/, '');
    if (!url.startsWith('https://')) {
      return res.status(400).json({ error: 'El webhook requiere una URL https pública' });
    }

    const result = await telegramBot.setWebhook(url, process.env.TELEGRAM_WEBHOOK_SECRET || undefined);
    const me = await telegramBot.getMe();
    res.json({
      message: 'Webhook configurado',
      url,
      result,
      bot: { username: me.username, name: me.first_name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
