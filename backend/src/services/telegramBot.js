const { User } = require('../models');

function getToken() {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

function apiUrl(method) {
  const token = getToken();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no configurado');
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function telegramRequest(method, body) {
  const res = await fetch(apiUrl(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || `Telegram ${method} falló`);
  }
  return data.result;
}

async function sendMessage(chatId, text, extra = {}) {
  return telegramRequest('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra
  });
}

function extractLinkCode(text = '') {
  const raw = String(text).trim();
  if (!raw) return '';
  const startMatch = raw.match(/^\/start(?:@\w+)?(?:\s+|_)([A-Za-z0-9]{4,12})$/i);
  if (startMatch) return startMatch[1].toUpperCase();
  const bare = raw.match(/^([A-Za-z0-9]{6})$/);
  if (bare) return bare[1].toUpperCase();
  return '';
}

async function handleUpdate(update) {
  const message = update.message || update.edited_message;
  if (!message?.chat?.id) return { handled: false };

  const chatId = String(message.chat.id);
  const text = (message.text || '').trim();
  const lower = text.toLowerCase();

  if (lower === '/start' || lower.startsWith('/start@')) {
    const code = extractLinkCode(text);
    if (code) {
      return linkChatWithCode(chatId, code, message.from);
    }
    await sendMessage(
      chatId,
      `👋 <b>MiONAT</b>\n\n` +
      `Tu Chat ID es:\n<code>${chatId}</code>\n\n` +
      `Para vincular tu cuenta:\n` +
      `1. Entra a MiONAT → Perfil\n` +
      `2. Pulsa «Generar código Telegram»\n` +
      `3. Envía aquí: <code>/start CODIGO</code>`
    );
    return { handled: true, chatId };
  }

  if (lower === '/chatid' || lower === '/id') {
    await sendMessage(chatId, `Tu Chat ID: <code>${chatId}</code>`);
    return { handled: true, chatId };
  }

  const code = extractLinkCode(text);
  if (code) {
    return linkChatWithCode(chatId, code, message.from);
  }

  if (lower === '/help' || lower === 'ayuda') {
    await sendMessage(
      chatId,
      `<b>Comandos MiONAT</b>\n` +
      `/start — ver tu Chat ID\n` +
      `/start CODIGO — vincular cuenta\n` +
      `/chatid — mostrar Chat ID\n` +
      `/help — ayuda`
    );
    return { handled: true, chatId };
  }

  await sendMessage(
    chatId,
    `Recibido. Usa /start para ver tu Chat ID o /help para comandos.`
  );
  return { handled: true, chatId };
}

async function linkChatWithCode(chatId, code, from = {}) {
  const user = await User.findOne({
    telegramLinkCode: code.toUpperCase(),
    telegramLinkExpires: { $gt: new Date() }
  });

  if (!user) {
    await sendMessage(
      chatId,
      `❌ Código <code>${code}</code> inválido o expirado.\n` +
      `Genera uno nuevo en MiONAT → Perfil.`
    );
    return { handled: true, chatId, linked: false };
  }

  user.telegramChatId = chatId;
  user.telegramLinkCode = undefined;
  user.telegramLinkExpires = undefined;
  await user.save();

  const who = from.first_name || user.name || 'usuario';
  await sendMessage(
    chatId,
    `✅ Listo, ${who}.\n` +
    `Cuenta <b>${user.name}</b> (NIT ${user.nit}) vinculada.\n` +
    `Recibirás recordatorios de obligaciones por aquí.`
  );
  return { handled: true, chatId, linked: true, userId: String(user._id) };
}

function generateLinkCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

let polling = false;
let offset = 0;

async function pollOnce() {
  const result = await telegramRequest('getUpdates', {
    offset,
    timeout: 25,
    allowed_updates: ['message']
  });
  for (const update of result) {
    offset = update.update_id + 1;
    try {
      await handleUpdate(update);
    } catch (err) {
      console.error('[telegram] error manejando update:', err.message);
    }
  }
}

async function startPolling() {
  if (polling) return;
  if (!getToken()) {
    console.log('[telegram] Sin TELEGRAM_BOT_TOKEN — polling desactivado');
    return;
  }
  polling = true;
  console.log('[telegram] Polling de mensajes iniciado');
  // Evitar conflicto con webhook previo en local
  try {
    await telegramRequest('deleteWebhook', { drop_pending_updates: false });
  } catch (err) {
    console.warn('[telegram] deleteWebhook:', err.message);
  }

  const loop = async () => {
    while (polling) {
      try {
        await pollOnce();
      } catch (err) {
        console.error('[telegram] poll error:', err.message);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  };
  loop();
}

function stopPolling() {
  polling = false;
}

async function getMe() {
  return telegramRequest('getMe', {});
}

async function setWebhook(url, secretToken) {
  const body = { url };
  if (secretToken) body.secret_token = secretToken;
  return telegramRequest('setWebhook', body);
}

module.exports = {
  getToken,
  sendMessage,
  handleUpdate,
  generateLinkCode,
  startPolling,
  stopPolling,
  getMe,
  setWebhook,
  telegramRequest
};
