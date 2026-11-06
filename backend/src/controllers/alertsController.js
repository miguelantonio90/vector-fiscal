const { Alert, Obligation, Income, User } = require('../models');
const { buildAmountSuffix, calculateLateSurcharge } = require('../utils/lateSurcharge');

// Obtener todas las alertas del usuario
exports.getAll = async (req, res) => {
  try {
    const { isRead } = req.query;
    const userObligations = await Obligation.find({ user: req.user._id }).select('_id');
    const obligationIds = userObligations.map(o => o._id);

    const filter = { obligation: { $in: obligationIds } };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    
    const alerts = await Alert.find(filter)
      .populate('obligation')
      .sort({ alertDate: -1 });
    
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generar alertas automáticas basadas en vencimientos
exports.generateAlerts = async (req, res) => {
  try {
    const today = new Date();
    const alerts = [];
    const year = today.getFullYear();

    const pendingObligations = await Obligation.find({
      user: req.user._id,
      status: { $in: ['pendiente', 'vencido'] }
    });

    const incomes = await Income.find({ user: req.user._id, year });
    const incomeByMonth = {};
    for (const inc of incomes) {
      incomeByMonth[inc.month] = inc.grossIncome || 0;
    }
    
    for (const obligation of pendingObligations) {
      const dueDate = new Date(obligation.dueDate);
      const diffTime = dueDate - today;
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const amountSuffix = buildAmountSuffix(obligation, incomeByMonth, today);
      
      // Alerta de vencido
      if (daysUntilDue < 0) {
        const existingAlert = await Alert.findOne({
          obligation: obligation._id,
          type: 'vencido'
        });
        
        if (!existingAlert) {
          const alert = new Alert({
            obligation: obligation._id,
            type: 'vencido',
            message: `¡VENCIDO! ${obligation.tributeCode || ''} ${obligation.period || obligation.description} venció hace ${Math.abs(daysUntilDue)} días${amountSuffix}`,
            daysBefore: daysUntilDue
          });
          await alert.save();
          alerts.push(alert);
          
          if (obligation.status === 'pendiente') {
            obligation.status = 'vencido';
            await obligation.save();
          }
        }
      }
      // Alertas de próximo vencimiento (7, 3, 1 día)
      else if ([7, 3, 1].includes(daysUntilDue)) {
        const existingAlert = await Alert.findOne({
          obligation: obligation._id,
          type: 'vencimiento_proximo',
          daysBefore: daysUntilDue
        });
        
        if (!existingAlert) {
          const urgency = daysUntilDue === 1 ? '¡URGENTE!' : daysUntilDue === 3 ? '¡Atención!' : '';
          const alert = new Alert({
            obligation: obligation._id,
            type: 'vencimiento_proximo',
            message: `${urgency} ${obligation.tributeCode || ''} ${obligation.period || obligation.description} vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}${amountSuffix}`.trim(),
            daysBefore: daysUntilDue
          });
          await alert.save();
          alerts.push(alert);
        }
      }
      
      // Alerta de bonificación solo si aún no venció
      if (daysUntilDue > 0 && daysUntilDue <= 30) {
        const existingBonusAlert = await Alert.findOne({
          obligation: obligation._id,
          type: 'bonificacion_disponible'
        });
        
        if (!existingBonusAlert) {
          const alert = new Alert({
            obligation: obligation._id,
            type: 'bonificacion_disponible',
            message: `Paga ${obligation.description} (${obligation.period}) antes del ${formatDate(dueDate)} y obtén 5% de bonificación${amountSuffix}`,
            daysBefore: daysUntilDue
          });
          await alert.save();
          alerts.push(alert);
        }
      }
    }
    
    res.json({
      message: 'Alertas generadas',
      newAlerts: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Marcar alerta como leída
exports.markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    ).populate('obligation');
    
    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Marcar todas como leídas (solo del usuario)
exports.markAllAsRead = async (req, res) => {
  try {
    const userObligations = await Obligation.find({ user: req.user._id }).select('_id');
    const obligationIds = userObligations.map(o => o._id);
    await Alert.updateMany(
      { isRead: false, obligation: { $in: obligationIds } },
      { isRead: true }
    );
    res.json({ message: 'Todas las alertas marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar alerta
exports.delete = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    res.json({ message: 'Alerta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener resumen de alertas del usuario
exports.getSummary = async (req, res) => {
  try {
    const userObligations = await Obligation.find({ user: req.user._id }).select('_id');
    const obligationIds = userObligations.map(o => o._id);
    const base = { obligation: { $in: obligationIds } };

    const [total, unread, byType] = await Promise.all([
      Alert.countDocuments(base),
      Alert.countDocuments({ ...base, isRead: false }),
      Alert.aggregate([
        { $match: base },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);
    
    res.json({
      total,
      unread,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
}

function daysUntilDue(dueDate, today) {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  return Math.round((due - t) / 86400000);
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString('es-CU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

async function sendTelegramMessage(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram ${res.status}: ${body}`);
  }
  return res.json();
}

// POST /api/alerts/telegram-remind — cron con x-cron-secret
exports.telegramRemind = async (req, res) => {
  try {
    const secret = req.headers['x-cron-secret'];
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN no configurado' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const remindDays = new Set([7, 3, 1]);

    const users = await User.find({
      telegramChatId: { $exists: true, $nin: [null, ''] }
    }).select('_id name telegramChatId');

    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const user of users) {
      try {
        const obligations = await Obligation.find({
          user: user._id,
          status: { $ne: 'paid' },
          dueDate: { $exists: true, $ne: null }
        }).sort({ dueDate: 1 });

        const lines = [];
        for (const obl of obligations) {
          const days = daysUntilDue(obl.dueDate, today);
          const overdue = days < 0;
          if (!overdue && !remindDays.has(days)) continue;

          const principal = Number(obl.amount) || 0;
          const surcharge = calculateLateSurcharge(principal, obl.dueDate, today);
          const mora = surcharge?.surchargeAmount || 0;
          const total = principal + mora;
          const when = overdue
            ? `VENCIDA hace ${Math.abs(days)} día(s)`
            : days === 1
              ? 'vence mañana'
              : `vence en ${days} días`;

          lines.push(
            `• <b>${obl.tributeCode || ''}</b> ${obl.period || ''}\n` +
            `  ${when} (${formatDate(obl.dueDate)})\n` +
            `  Total: $${formatMoney(total)}` +
            (mora > 0 ? ` (mora $${formatMoney(mora)})` : '')
          );
        }

        if (lines.length === 0) {
          skipped += 1;
          continue;
        }

        const message =
          `🔔 <b>Recordatorio MiONAT</b>\n` +
          `Hola ${user.name || ''},\n\n` +
          lines.join('\n\n');

        await sendTelegramMessage(token, user.telegramChatId, message);
        sent += 1;
      } catch (err) {
        errors.push({ userId: String(user._id), error: err.message });
      }
    }

    res.json({
      message: 'Recordatorios procesados',
      users: users.length,
      sent,
      skipped,
      errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
