const { Obligation, Payment, User } = require('../models');
const { parseVectorFiscalPDF } = require('../utils/vectorFiscalParser');

// Obtener todas las obligaciones del usuario actual
exports.getAll = async (req, res) => {
  try {
    const { year, status, tributeCode } = req.query;
    const filter = { user: req.user._id };
    
    if (year) filter.fiscalYear = parseInt(year);
    if (status) filter.status = status;
    if (tributeCode) filter.tributeCode = tributeCode;
    
    let obligations = await Obligation.find(filter).sort({ dueDate: 1 });
    
    // Filtrar obligaciones 0510122 (aporte a cuenta) con monto 0 o sin monto
    // que no tienen status 'pagado' - estas no aplican porque el ingreso no superó el mínimo
    obligations = obligations.filter(o => {
      if (o.tributeCode === '0510122' && (!o.amount || o.amount === 0) && o.status !== 'pagado') {
        return false; // No mostrar esta obligación
      }
      return true;
    });
    
    res.json(obligations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener una obligación por ID (verificando que pertenece al usuario)
exports.getById = async (req, res) => {
  try {
    const obligation = await Obligation.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });
    if (!obligation) {
      return res.status(404).json({ error: 'Obligación no encontrada' });
    }
    res.json(obligation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear nueva obligación para el usuario actual
exports.create = async (req, res) => {
  try {
    const obligation = new Obligation({
      ...req.body,
      user: req.user._id
    });
    await obligation.save();
    res.status(201).json(obligation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar obligación (verificando que pertenece al usuario)
exports.update = async (req, res) => {
  try {
    const obligation = await Obligation.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!obligation) {
      return res.status(404).json({ error: 'Obligación no encontrada' });
    }
    res.json(obligation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar obligación (verificando que pertenece al usuario)
exports.delete = async (req, res) => {
  try {
    const obligation = await Obligation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    if (!obligation) {
      return res.status(404).json({ error: 'Obligación no encontrada' });
    }
    res.json({ message: 'Obligación eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener próximos vencimientos del usuario actual
exports.getUpcoming = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    let obligations = await Obligation.find({
      user: req.user._id,
      status: 'pendiente',
      dueDate: { $gte: today, $lte: thirtyDaysLater }
    }).sort({ dueDate: 1 });
    
    // Filtrar obligaciones 0510122 con monto 0 (no aplican)
    obligations = obligations.filter(o => {
      if (o.tributeCode === '0510122' && (!o.amount || o.amount === 0)) {
        return false;
      }
      return true;
    });
    
    res.json(obligations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener obligaciones vencidas del usuario actual
exports.getOverdue = async (req, res) => {
  try {
    const today = new Date();
    
    const obligations = await Obligation.find({
      user: req.user._id,
      status: 'pendiente',
      dueDate: { $lt: today }
    }).sort({ dueDate: 1 });
    
    // Actualizar estado a vencido
    await Obligation.updateMany(
      { user: req.user._id, status: 'pendiente', dueDate: { $lt: today } },
      { status: 'vencido' }
    );
    
    res.json(obligations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener datos formateados como el Vector Fiscal RC-04A
exports.getVectorFiscal = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const userId = req.user._id;

    const obligations = await Obligation.find({
      user: userId,
      fiscalYear: year
    }).sort({ dueDate: 1 });

    const payments = await Payment.find({ user: userId })
      .populate('obligation');

    const paymentsByObligation = {};
    for (const p of payments) {
      const oblId = (p.obligation?._id || p.obligation)?.toString();
      if (oblId) paymentsByObligation[oblId] = p;
    }

    const tributeDescriptions = {
      '0114022': 'Impuesto s/ ventas y servicios (PN)',
      '0510122': 'Impuesto s/ ingresos personales - aporte mensual',
      '0530222': 'Imp. s/ ingresos personales (liquid. adicional)',
      '0820132': 'Contribución especial a la seguridad social'
    };

    const rows = obligations.map(o => {
      const payment = paymentsByObligation[o._id.toString()];
      return {
        paid: o.status === 'pagado',
        overdue: o.status === 'vencido',
        barcode: o.barcode,
        amount: o.amount || null,
        paidAmount: payment?.amount || null,
        tributeCode: o.tributeCode,
        period: o.period,
        dueDate: o.dueDate,
        status: o.status,
        paymentDate: payment?.paymentDate || null,
        paymentMethod: payment?.paymentMethod || null,
        bonusAmount: payment?.bonusAmount || 0
      };
    });

    const user = await User.findById(userId).select('nit name');
    const tributeCodes = [...new Set(obligations.map(o => o.tributeCode))];
    const tributes = tributeCodes.map(code => ({
      code,
      description: tributeDescriptions[code] || code
    }));

    res.json({
      title: 'RC-04A Vector fiscal de persona natural',
      user: { nit: user.nit, name: user.name },
      fiscalYear: year,
      obligations: rows,
      tributes,
      totalObligations: rows.length,
      totalPaid: rows.filter(r => r.paid).length,
      totalPending: rows.filter(r => !r.paid).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Importar obligaciones desde un PDF del Vector Fiscal RC-04A (cualquier año)
exports.importFromPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Debe subir un archivo PDF' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'El archivo debe ser un PDF' });
    }

    const { obligations, fiscalYear, totalFound } = await parseVectorFiscalPDF(req.file.buffer);

    if (totalFound === 0) {
      return res.status(400).json({ 
        error: 'No se encontraron obligaciones en el PDF. Verifique que sea un Vector Fiscal RC-04A válido.' 
      });
    }

    // Guardar el PDF en el usuario para poder reutilizarlo
    await User.findByIdAndUpdate(req.user._id, {
      vectorFiscal: {
        filename: req.file.originalname,
        data: req.file.buffer,
        uploadedAt: new Date(),
        fiscalYear
      }
    });

    const results = [];
    for (const data of obligations) {
      const existing = await Obligation.findOne({
        barcode: data.barcode,
        user: req.user._id
      });
      if (!existing) {
        const obligation = new Obligation({
          ...data,
          user: req.user._id,
          fiscalYear,
          status: 'pendiente'
        });
        await obligation.save();
        results.push({ barcode: data.barcode, action: 'created' });
      } else {
        // Actualizar datos de la obligación existente (fechas, montos, etc.)
        // pero preservar el status si ya fue pagado
        const updateData = {
          tributeCode: data.tributeCode,
          description: data.description,
          period: data.period,
          dueDate: data.dueDate,
          periodicity: data.periodicity,
          fiscalYear,
          conditional: data.conditional
        };
        if (existing.status !== 'pagado') {
          updateData.amount = data.amount;
        }
        await Obligation.findByIdAndUpdate(existing._id, updateData);
        results.push({ barcode: data.barcode, action: 'updated' });
      }
    }

    const created = results.filter(r => r.action === 'created').length;
    const updated = results.filter(r => r.action === 'updated').length;

    res.json({
      message: `Vector Fiscal ${fiscalYear} importado desde PDF`,
      fiscalYear,
      total: totalFound,
      created,
      updated,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Re-procesar el PDF guardado del usuario (actualizar obligaciones sin subir de nuevo)
exports.reprocessPDF = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.vectorFiscal?.data) {
      return res.status(404).json({ error: 'No tiene un Vector Fiscal guardado. Suba un PDF primero.' });
    }

    const { obligations, fiscalYear, totalFound } = await parseVectorFiscalPDF(user.vectorFiscal.data);

    if (totalFound === 0) {
      return res.status(400).json({ error: 'No se pudieron extraer obligaciones del PDF guardado.' });
    }

    const results = [];
    for (const data of obligations) {
      const existing = await Obligation.findOne({
        barcode: data.barcode,
        user: req.user._id
      });
      if (!existing) {
        const obligation = new Obligation({
          ...data,
          user: req.user._id,
          fiscalYear,
          status: 'pendiente'
        });
        await obligation.save();
        results.push({ barcode: data.barcode, action: 'created' });
      } else {
        const updateData = {
          tributeCode: data.tributeCode,
          description: data.description,
          period: data.period,
          dueDate: data.dueDate,
          periodicity: data.periodicity,
          fiscalYear,
          conditional: data.conditional
        };
        if (existing.status !== 'pagado') {
          updateData.amount = data.amount;
        }
        await Obligation.findByIdAndUpdate(existing._id, updateData);
        results.push({ barcode: data.barcode, action: 'updated' });
      }
    }

    const created = results.filter(r => r.action === 'created').length;
    const updated = results.filter(r => r.action === 'updated').length;

    res.json({
      message: `Vector Fiscal ${fiscalYear} re-procesado`,
      fiscalYear,
      total: totalFound,
      created,
      updated,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resumen de obligaciones del usuario actual
exports.getSummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const userId = req.user._id;
    
    // Excluir obligaciones con status 'no_aplica' de todos los conteos
    const [pending, paid, overdue, noAplica, total] = await Promise.all([
      Obligation.countDocuments({ user: userId, fiscalYear: year, status: 'pendiente' }),
      Obligation.countDocuments({ user: userId, fiscalYear: year, status: 'pagado' }),
      Obligation.countDocuments({ user: userId, fiscalYear: year, status: 'vencido' }),
      Obligation.countDocuments({ user: userId, fiscalYear: year, status: 'no_aplica' }),
      Obligation.countDocuments({ user: userId, fiscalYear: year, status: { $ne: 'no_aplica' } })
    ]);
    
    // Obtener todas las obligaciones (excluyendo no_aplica)
    const allObligations = await Obligation.find({ 
      user: userId,
      fiscalYear: year,
      status: { $ne: 'no_aplica' }
    });
    const paidObligations = allObligations.filter(o => o.status === 'pagado');
    // Para pendientes, excluir también las condicionales (0510122) con monto 0
    const pendingObligations = allObligations.filter(o => {
      if (o.status !== 'pendiente' && o.status !== 'vencido') return false;
      // Excluir 0510122 con monto 0 (no aplican porque ingresos < mínimo exento)
      if (o.tributeCode === '0510122' && (!o.amount || o.amount === 0)) return false;
      return true;
    });
    
    // Calcular monto pagado (de obligaciones pagadas)
    const paidAmount = paidObligations.reduce((sum, o) => sum + (o.amount || 0), 0);
    
    // Calcular monto pendiente (de obligaciones pendientes reales)
    // Para las mensuales sin monto definido, usamos un estimado basado en el promedio de las pagadas
    let pendingAmount = 0;
    const paidMonthlyObligations = paidObligations.filter(o => o.tributeCode === '0114022');
    const avgMonthlyAmount = paidMonthlyObligations.length > 0 
      ? paidMonthlyObligations.reduce((sum, o) => sum + (o.amount || 0), 0) / paidMonthlyObligations.length 
      : 0;
    
    for (const o of pendingObligations) {
      if (o.amount && o.amount > 0) {
        pendingAmount += o.amount;
      } else if (o.tributeCode === '0114022' && avgMonthlyAmount > 0) {
        // Usar promedio para mensuales sin monto
        pendingAmount += avgMonthlyAmount;
      }
    }
    
    const totalAmount = paidAmount + pendingAmount;
    
    res.json({
      pending: pendingObligations.length, // Usar el conteo real de pendientes (excluyendo 0510122 con monto 0)
      paid,
      overdue: 0, // Ya no hay vencidos porque los 0510122 pasados son 'no_aplica'
      total,
      totalAmount,
      paidAmount,
      pendingAmount,
      avgMonthlyPayment: avgMonthlyAmount,
      noAplica // Cantidad de obligaciones que no aplican
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
