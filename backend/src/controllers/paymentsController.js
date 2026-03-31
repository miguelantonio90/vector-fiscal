const { Payment, Obligation } = require('../models');

/**
 * Calcula el recargo por mora según las reglas ONAT (código tributo 1060122):
 *   - Hasta 30 días hábiles: 2% del principal
 *   - Más de 30 y hasta 60 días hábiles: 5% del principal
 *   - Más de 60 días hábiles: 0.1% por cada día, hasta el 40% del principal
 *
 * @param {number} principal - monto adeudado
 * @param {Date} dueDate - fecha límite de pago
 * @param {Date} paymentDate - fecha del pago
 * @returns {{ lateDays: number, surchargeRate: number, surchargeAmount: number, description: string } | null}
 */
function calculateLateSurcharge(principal, dueDate, paymentDate) {
  const due = new Date(dueDate);
  const paid = new Date(paymentDate);
  due.setHours(0, 0, 0, 0);
  paid.setHours(0, 0, 0, 0);

  if (paid <= due) return null;

  const msPerDay = 86400000;
  const calendarDays = Math.floor((paid - due) / msPerDay);

  let businessDays = 0;
  const d = new Date(due);
  for (let i = 0; i < calendarDays; i++) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) businessDays++;
  }

  if (businessDays <= 0) return null;

  let surchargeRate;
  let description;

  if (businessDays <= 30) {
    surchargeRate = 2;
    description = `${businessDays} días hábiles de mora → 2% recargo`;
  } else if (businessDays <= 60) {
    surchargeRate = 5;
    description = `${businessDays} días hábiles de mora → 5% recargo`;
  } else {
    surchargeRate = Math.min(businessDays * 0.1, 40);
    description = `${businessDays} días hábiles de mora → ${surchargeRate.toFixed(1)}% recargo (0.1%/día, máx 40%)`;
  }

  const surchargeAmount = Math.round((principal * surchargeRate / 100) * 100) / 100;

  return {
    lateDays: businessDays,
    calendarDays,
    surchargeRate,
    surchargeAmount,
    description
  };
}

// Obtener todos los pagos del usuario actual
exports.getAll = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, year } = req.query;
    const filter = { user: req.user._id };
    
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    let payments = await Payment.find(filter)
      .populate('obligation')
      .sort({ paymentDate: -1 });
    
    if (year) {
      const y = parseInt(year);
      payments = payments.filter(p => p.obligation?.fiscalYear === y);
    }
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un pago por ID (verificando que pertenece al usuario)
exports.getById = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('obligation');
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Registrar nuevo pago para el usuario actual
exports.create = async (req, res) => {
  try {
    const { obligationId, amount, paymentDate, paymentMethod, reference, notes, bonusMode, bonusAmountSaved } = req.body;
    
    // Verificar que la obligación existe y pertenece al usuario
    const obligation = await Obligation.findOne({
      _id: obligationId,
      user: req.user._id
    });
    if (!obligation) {
      return res.status(404).json({ error: 'Obligación no encontrada' });
    }
    
    // amount = valor real del impuesto (antes de bonificación)
    // bonusAmount = ahorro por canal/anticipación (no altera el valor fiscal)
    let bonusApplied = 0;
    let bonusAmount = 0;
    
    if (bonusMode === 'already') {
      bonusAmount = bonusAmountSaved || 0;
      if (amount > 0 && bonusAmount > 0) {
        bonusApplied = (bonusAmount / amount) * 100;
      }
    } else if (bonusMode === 'calculate') {
      if (paymentMethod === 'transfermovil') {
        bonusApplied += 3;
      }
      const pDate = new Date(paymentDate || Date.now());
      if (pDate < new Date(obligation.dueDate)) {
        bonusApplied += 5;
      }
      bonusAmount = (amount * bonusApplied) / 100;
    }
    
    const pDate = new Date(paymentDate || Date.now());

    const surcharge = calculateLateSurcharge(amount, obligation.dueDate, pDate);

    const payment = new Payment({
      user: req.user._id,
      obligation: obligationId,
      amount,
      paymentDate: pDate,
      paymentMethod,
      bonusApplied,
      bonusAmount,
      lateSurcharge: surcharge || { lateDays: 0, surchargeRate: 0, surchargeAmount: 0, description: '' },
      reference,
      notes
    });
    
    await payment.save();
    
    obligation.status = 'pagado';
    obligation.amount = amount;
    await obligation.save();
    
    res.status(201).json({
      payment,
      bonusInfo: {
        amount,
        bonusApplied: `${bonusApplied}%`,
        bonusAmount,
        actualPaid: amount - bonusAmount
      },
      surcharge: surcharge || null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar pago (verificando que pertenece al usuario)
exports.update = async (req, res) => {
  try {
    const { amount, paymentDate, paymentMethod, reference, notes, bonusMode, bonusAmountSaved } = req.body;
    
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    // Obtener la obligación asociada
    const obligation = await Obligation.findById(payment.obligation);
    
    let bonusApplied = 0;
    let bonusAmount = 0;
    
    if (bonusMode === 'already') {
      bonusAmount = bonusAmountSaved || 0;
      if (amount > 0 && bonusAmount > 0) {
        bonusApplied = (bonusAmount / amount) * 100;
      }
    } else if (bonusMode === 'calculate') {
      if (paymentMethod === 'transfermovil') {
        bonusApplied += 3;
      }
      const pDate = new Date(paymentDate || Date.now());
      if (obligation && pDate < new Date(obligation.dueDate)) {
        bonusApplied += 5;
      }
      bonusAmount = (amount * bonusApplied) / 100;
    }
    
    const pDate = new Date(paymentDate);
    const surcharge = obligation ? calculateLateSurcharge(amount, obligation.dueDate, pDate) : null;

    payment.amount = amount;
    payment.paymentDate = pDate;
    payment.paymentMethod = paymentMethod;
    payment.bonusApplied = bonusApplied;
    payment.bonusAmount = bonusAmount;
    payment.lateSurcharge = surcharge || { lateDays: 0, surchargeRate: 0, surchargeAmount: 0, description: '' };
    payment.reference = reference;
    payment.notes = notes;
    
    await payment.save();
    
    if (obligation) {
      obligation.amount = amount;
      await obligation.save();
    }
    
    // Devolver el pago con la obligación populada
    const updatedPayment = await Payment.findById(payment._id).populate('obligation');
    
    res.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(400).json({ error: error.message });
  }
};

// Eliminar pago (verificando que pertenece al usuario)
exports.delete = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    // Restaurar estado de la obligación
    await Obligation.findByIdAndUpdate(payment.obligation, { status: 'pendiente' });
    
    await payment.deleteOne();
    res.json({ message: 'Pago eliminado y obligación restaurada a pendiente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Previsualizar recargo por mora sin crear pago
exports.previewSurcharge = async (req, res) => {
  try {
    const { obligationId, amount, paymentDate } = req.query;
    if (!obligationId || !amount) {
      return res.json({ surcharge: null });
    }
    const obligation = await Obligation.findOne({ _id: obligationId, user: req.user._id });
    if (!obligation) return res.json({ surcharge: null });

    const surcharge = calculateLateSurcharge(
      parseFloat(amount),
      obligation.dueDate,
      new Date(paymentDate || Date.now())
    );
    res.json({ surcharge, dueDate: obligation.dueDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resumen de pagos del usuario actual
exports.getSummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const userId = req.user._id;
    
    const payments = await Payment.find({
      user: userId,
      paymentDate: { $gte: startOfYear, $lte: endOfYear }
    });
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalBonus = payments.reduce((sum, p) => sum + p.bonusAmount, 0);
    
    const byMethod = await Payment.aggregate([
      { $match: { user: userId, paymentDate: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    
    const byMonth = await Payment.aggregate([
      { $match: { user: userId, paymentDate: { $gte: startOfYear, $lte: endOfYear } } },
      { 
        $group: { 
          _id: { $month: '$paymentDate' }, 
          total: { $sum: '$amount' }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      totalPayments: payments.length,
      totalPaid,
      totalBonus,
      byMethod,
      byMonth
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
