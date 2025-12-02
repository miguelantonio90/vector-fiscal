const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  // Referencia a la obligación
  obligation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Obligation',
    required: true
  },
  // Tipo de alerta
  type: {
    type: String,
    enum: ['vencimiento_proximo', 'vencido', 'bonificacion_disponible'],
    required: true
  },
  // Mensaje de la alerta
  message: {
    type: String,
    required: true
  },
  // Días antes del vencimiento (para alertas de vencimiento)
  daysBefore: {
    type: Number
  },
  // Si la alerta ha sido leída/descartada
  isRead: {
    type: Boolean,
    default: false
  },
  // Fecha de la alerta
  alertDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices
alertSchema.index({ isRead: 1 });
alertSchema.index({ alertDate: -1 });

module.exports = mongoose.model('Alert', alertSchema);

