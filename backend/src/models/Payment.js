const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Usuario propietario de este pago
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Referencia a la obligación pagada
  obligation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Obligation',
    required: true
  },
  // Monto pagado
  amount: {
    type: Number,
    required: true
  },
  // Fecha del pago
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Método de pago
  paymentMethod: {
    type: String,
    enum: ['efectivo', 'transfermovil', 'banco', 'otro'],
    default: 'efectivo'
  },
  // Bonificación aplicada (%)
  bonusApplied: {
    type: Number,
    default: 0
  },
  // Monto de bonificación
  bonusAmount: {
    type: Number,
    default: 0
  },
  // Número de referencia o comprobante
  reference: {
    type: String
  },
  // Notas adicionales
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Índices
paymentSchema.index({ user: 1, paymentDate: -1 });
paymentSchema.index({ user: 1, obligation: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

