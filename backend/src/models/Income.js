const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  // Usuario propietario de este ingreso
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Mes (1-12)
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  // Año
  year: {
    type: Number,
    required: true,
    default: 2025
  },
  // Ingresos brutos del mes
  grossIncome: {
    type: Number,
    required: true,
    default: 0
  },
  // Gastos deducibles
  deductibleExpenses: {
    type: Number,
    default: 0
  },
  // Ingreso neto calculado
  netIncome: {
    type: Number,
    default: 0
  },
  // Impuesto sobre ventas calculado
  salesTax: {
    type: Number,
    default: 0
  },
  // Aporte a ingresos personales calculado
  personalIncomeTax: {
    type: Number,
    default: 0
  },
  // Notas o descripción
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Índice compuesto para usuario/mes/año único
incomeSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

// Calcular ingreso neto antes de guardar
incomeSchema.pre('save', function(next) {
  this.netIncome = this.grossIncome - this.deductibleExpenses;
  next();
});

module.exports = mongoose.model('Income', incomeSchema);

