const { Payment, Obligation } = require('../models');

// Obtener todos los pagos del usuario actual
exports.getAll = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;
    const filter = { user: req.user._id };
    
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    const payments = await Payment.find(filter)
      .populate('obligation')
      .sort({ paymentDate: -1 });
    
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
    
    let bonusApplied = 0;
    let bonusAmount = 0;
    let finalAmount = amount;
    
    if (bonusMode === 'none') {
      // Sin bonificación - guardar el monto tal cual
      bonusApplied = 0;
      bonusAmount = 0;
      finalAmount = amount;
    } else if (bonusMode === 'already') {
      // El monto ingresado ya es el final, y el usuario indica cuánto ahorró en pesos
      bonusAmount = bonusAmountSaved || 0;
      // Calcular el porcentaje basado en el monto original (amount + bonusAmount)
      const originalAmount = amount + bonusAmount;
      if (originalAmount > 0 && bonusAmount > 0) {
        bonusApplied = (bonusAmount / originalAmount) * 100;
      }
      finalAmount = amount;
    } else if (bonusMode === 'calculate') {
      // Calcular bonificaciones automáticamente
      // Bonificación del 3% por Transfermóvil
      if (paymentMethod === 'transfermovil') {
        bonusApplied += 3;
      }
      
      // Bonificación del 5% por pago anticipado (antes de fecha límite)
      const pDate = new Date(paymentDate || Date.now());
      if (pDate < new Date(obligation.dueDate)) {
        bonusApplied += 5;
      }
      
      bonusAmount = (amount * bonusApplied) / 100;
      finalAmount = amount - bonusAmount;
    }
    
    const pDate = new Date(paymentDate || Date.now());
    
    const payment = new Payment({
      user: req.user._id,
      obligation: obligationId,
      amount: finalAmount,
      paymentDate: pDate,
      paymentMethod,
      bonusApplied,
      bonusAmount,
      reference,
      notes
    });
    
    await payment.save();
    
    // Actualizar estado de la obligación
    obligation.status = 'pagado';
    obligation.amount = finalAmount;
    await obligation.save();
    
    res.status(201).json({
      payment,
      bonusInfo: {
        originalAmount: amount,
        bonusApplied: `${bonusApplied}%`,
        bonusAmount,
        finalAmount
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar pago (verificando que pertenece al usuario)
exports.update = async (req, res) => {
  try {
    const { amount, paymentDate, paymentMethod, reference, notes, bonusMode, bonusAmountSaved } = req.body;
    
    console.log('Update payment received:', { amount, paymentDate, paymentMethod, bonusMode, bonusAmountSaved });
    
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
    let finalAmount = amount;
    
    if (bonusMode === 'none') {
      // Sin bonificación - guardar el monto tal cual
      bonusApplied = 0;
      bonusAmount = 0;
      finalAmount = amount;
    } else if (bonusMode === 'already') {
      // El monto ingresado ya es el final, y el usuario indica cuánto ahorró en pesos
      bonusAmount = bonusAmountSaved || 0;
      // Calcular el porcentaje basado en el monto original (amount + bonusAmount)
      const originalAmount = amount + bonusAmount;
      if (originalAmount > 0 && bonusAmount > 0) {
        bonusApplied = (bonusAmount / originalAmount) * 100;
      }
      finalAmount = amount;
    } else if (bonusMode === 'calculate') {
      // Calcular bonificaciones automáticamente
      if (paymentMethod === 'transfermovil') {
        bonusApplied += 3;
      }
      
      const pDate = new Date(paymentDate || Date.now());
      if (obligation && pDate < new Date(obligation.dueDate)) {
        bonusApplied += 5;
      }
      
      bonusAmount = (amount * bonusApplied) / 100;
      finalAmount = amount - bonusAmount;
    }
    
    // Actualizar el pago
    payment.amount = finalAmount;
    payment.paymentDate = new Date(paymentDate);
    payment.paymentMethod = paymentMethod;
    payment.bonusApplied = bonusApplied;
    payment.bonusAmount = bonusAmount;
    payment.reference = reference;
    payment.notes = notes;
    
    await payment.save();
    
    // Actualizar el monto en la obligación también
    if (obligation) {
      obligation.amount = finalAmount;
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

// Resumen de pagos del usuario actual
exports.getSummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
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
