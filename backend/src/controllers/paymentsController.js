const { Payment, Obligation } = require('../models');
const { calculateLateSurcharge } = require('../utils/lateSurcharge');
const { isElectronicChannel, qualifiesForDeclarationBonus } = require('../utils/taxCalculator');

function bonusFromRules(obligation, paymentDate, paymentMethod) {
  let bonusApplied = 0;
  if (isElectronicChannel(paymentMethod)) bonusApplied += 3;
  if (qualifiesForDeclarationBonus(obligation, paymentDate)) bonusApplied += 5;
  return bonusApplied;
}

function parseConfirmationImage(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let contentType = 'image/jpeg';
  let base64 = trimmed;
  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
  if (dataUrlMatch) {
    contentType = dataUrlMatch[1];
    base64 = dataUrlMatch[2];
  }

  return {
    data: Buffer.from(base64, 'base64'),
    contentType,
    filename: 'confirmacion-banco'
  };
}

function serializePayment(payment, { includeImage = false } = {}) {
  const obj = payment.toObject ? payment.toObject() : { ...payment };
  const img = obj.confirmationImage;
  const hasImageData = !!(img && img.data);
  obj.hasConfirmationImage = !!(hasImageData || (img && (img.filename || img.contentType)));
  if (includeImage && hasImageData) {
    const buf = Buffer.isBuffer(img.data) ? img.data : Buffer.from(img.data);
    obj.confirmationImageBase64 =
      `data:${img.contentType || 'image/jpeg'};base64,` + buf.toString('base64');
  }
  delete obj.confirmationImage;
  return obj;
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
      .select('-confirmationImage.data')
      .populate('obligation')
      .sort({ paymentDate: -1 });
    
    if (year) {
      const y = parseInt(year);
      payments = payments.filter(p => p.obligation?.fiscalYear === y);
    }

    res.json(payments.map(p => serializePayment(p)));
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
    res.json(serializePayment(payment, { includeImage: true }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Registrar nuevo pago para el usuario actual
exports.create = async (req, res) => {
  try {
    const {
      obligationId,
      amount,
      principalAmount: clientPrincipal,
      paymentDate,
      paymentMethod,
      reference,
      notes,
      bonusMode,
      bonusAmountSaved,
      confirmationText,
      confirmationImageBase64
    } = req.body;
    
    const obligation = await Obligation.findOne({
      _id: obligationId,
      user: req.user._id
    });
    if (!obligation) {
      return res.status(404).json({ error: 'Obligación no encontrada' });
    }
    
    const pDate = new Date(paymentDate || Date.now());
    const principal = clientPrincipal || amount;
    const surcharge = calculateLateSurcharge(principal, obligation.dueDate, pDate);

    let bonusApplied = 0;
    let bonusAmount = 0;
    
    if (bonusMode === 'already') {
      bonusAmount = bonusAmountSaved || 0;
      if (principal > 0 && bonusAmount > 0) {
        bonusApplied = (bonusAmount / principal) * 100;
      }
    } else if (bonusMode === 'calculate') {
      bonusApplied = bonusFromRules(obligation, pDate, paymentMethod);
      bonusAmount = (principal * bonusApplied) / 100;
    }

    const payment = new Payment({
      user: req.user._id,
      obligation: obligationId,
      amount: principal,
      paymentDate: pDate,
      paymentMethod,
      bonusApplied,
      bonusAmount,
      lateSurcharge: surcharge || { lateDays: 0, surchargeRate: 0, surchargeAmount: 0, description: '' },
      reference,
      notes,
      confirmationText: confirmationText || ''
    });

    const image = parseConfirmationImage(confirmationImageBase64);
    if (image) payment.confirmationImage = image;
    
    await payment.save();
    
    obligation.status = 'pagado';
    obligation.amount = principal;
    await obligation.save();

    const saved = await Payment.findById(payment._id).populate('obligation');
    
    res.status(201).json({
      payment: serializePayment(saved, { includeImage: true }),
      totalPaid: amount,
      bonusInfo: {
        principal,
        bonusApplied: `${bonusApplied}%`,
        bonusAmount,
        actualPaid: principal - bonusAmount
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
    const {
      amount,
      paymentDate,
      paymentMethod,
      reference,
      notes,
      bonusMode,
      bonusAmountSaved,
      confirmationText,
      confirmationImageBase64
    } = req.body;
    
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
      const when = new Date(paymentDate || Date.now());
      bonusApplied = bonusFromRules(obligation, when, paymentMethod);
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
    if (confirmationText !== undefined) {
      payment.confirmationText = confirmationText || '';
    }
    const image = parseConfirmationImage(confirmationImageBase64);
    if (image) payment.confirmationImage = image;
    
    await payment.save();
    
    if (obligation) {
      obligation.amount = amount;
      await obligation.save();
    }
    
    // Devolver el pago con la obligación populada
    const updatedPayment = await Payment.findById(payment._id).populate('obligation');
    
    res.json(serializePayment(updatedPayment, { includeImage: true }));
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
