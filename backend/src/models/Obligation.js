const mongoose = require('mongoose');

const obligationSchema = new mongoose.Schema({
  // Usuario propietario de esta obligación
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Código de barras único de la obligación
  barcode: {
    type: String,
    required: true
  },
  // Código del tributo (ej: 0114022, 0510122)
  tributeCode: {
    type: String,
    required: true
  },
  // Descripción del tributo
  description: {
    type: String,
    required: true
  },
  // Monto a pagar en CUP
  amount: {
    type: Number,
    default: 0
  },
  // Fecha límite de pago
  dueDate: {
    type: Date,
    required: true
  },
  // Período que cubre (ej: "Enero: 20/Feb/25")
  period: {
    type: String,
    required: true
  },
  // Tipo de periodicidad
  periodicity: {
    type: String,
    enum: ['mensual', 'trimestral', 'anual'],
    required: true
  },
  // Estado del pago
  status: {
    type: String,
    enum: ['pendiente', 'pagado', 'vencido', 'no_aplica'],
    default: 'pendiente'
  },
  // Año fiscal
  fiscalYear: {
    type: Number,
    default: 2025
  },
  // Indica si es una obligación condicional (ej: 0510122 solo aplica si ingresos > 3,260)
  conditional: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
obligationSchema.index({ user: 1, dueDate: 1 });
obligationSchema.index({ user: 1, status: 1 });
obligationSchema.index({ user: 1, tributeCode: 1 });
obligationSchema.index({ user: 1, barcode: 1 }, { unique: true });

module.exports = mongoose.model('Obligation', obligationSchema);

