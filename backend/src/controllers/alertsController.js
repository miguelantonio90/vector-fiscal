const { Alert, Obligation } = require('../models');

// Obtener todas las alertas
exports.getAll = async (req, res) => {
  try {
    const { isRead } = req.query;
    const filter = {};
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
    
    // Buscar obligaciones pendientes
    const pendingObligations = await Obligation.find({ status: 'pendiente' });
    
    for (const obligation of pendingObligations) {
      const dueDate = new Date(obligation.dueDate);
      const diffTime = dueDate - today;
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
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
            message: `¡VENCIDO! ${obligation.description} - ${obligation.period} venció hace ${Math.abs(daysUntilDue)} días`,
            daysBefore: daysUntilDue
          });
          await alert.save();
          alerts.push(alert);
          
          // Actualizar estado de la obligación
          obligation.status = 'vencido';
          await obligation.save();
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
            message: `${urgency} ${obligation.description} vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''} (${obligation.period})`,
            daysBefore: daysUntilDue
          });
          await alert.save();
          alerts.push(alert);
        }
      }
      
      // Alerta de bonificación disponible (antes de fecha límite)
      if (daysUntilDue > 0 && daysUntilDue <= 30) {
        const existingBonusAlert = await Alert.findOne({
          obligation: obligation._id,
          type: 'bonificacion_disponible'
        });
        
        if (!existingBonusAlert) {
          const alert = new Alert({
            obligation: obligation._id,
            type: 'bonificacion_disponible',
            message: `Paga ${obligation.description} antes del ${formatDate(dueDate)} y obtén 5% de bonificación`,
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

// Marcar todas como leídas
exports.markAllAsRead = async (req, res) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
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

// Obtener resumen de alertas
exports.getSummary = async (req, res) => {
  try {
    const [total, unread, byType] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ isRead: false }),
      Alert.aggregate([
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

