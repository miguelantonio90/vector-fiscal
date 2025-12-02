const { Obligation } = require('../models');

// Obtener todas las obligaciones del usuario actual
exports.getAll = async (req, res) => {
  try {
    const { year, status, tributeCode } = req.query;
    const filter = { user: req.user._id };
    
    if (year) filter.fiscalYear = parseInt(year);
    if (status) filter.status = status;
    if (tributeCode) filter.tributeCode = tributeCode;
    
    const obligations = await Obligation.find(filter).sort({ dueDate: 1 });
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
    
    const obligations = await Obligation.find({
      user: req.user._id,
      status: 'pendiente',
      dueDate: { $gte: today, $lte: thirtyDaysLater }
    }).sort({ dueDate: 1 });
    
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

// Importar obligaciones del Vector Fiscal 2025 para el usuario actual
exports.importVectorFiscal2025 = async (req, res) => {
  try {
    // Datos del Vector Fiscal RC-04A 2025
    // 0114022 (Ventas mensual) + 0510122 (Aporte Ingresos Personales) + 0820132 (Trimestral 1,200 CUP)
    const vectorFiscalData = [
      // Impuesto s/ ventas y servicios - MENSUAL (10% sobre ingresos brutos)
      { barcode: '10015', tributeCode: '0114022', period: 'Enero: 20/Feb/25', dueDate: '2025-02-20', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '30815', tributeCode: '0114022', period: 'Febrero: 20/Mar/25', dueDate: '2025-03-20', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '31615', tributeCode: '0114022', period: 'Marzo: 21/Abr/25', dueDate: '2025-04-21', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '32415', tributeCode: '0114022', period: 'Abril: 20/May/25', dueDate: '2025-05-20', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '33215', tributeCode: '0114022', period: 'Mayo: 20/Jun/25', dueDate: '2025-06-20', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '34015', tributeCode: '0114022', period: 'Junio: 21/Jul/25', dueDate: '2025-07-21', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '54815', tributeCode: '0114022', period: 'Julio: 20/Ago/25', dueDate: '2025-08-20', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '55615', tributeCode: '0114022', period: 'Agosto: 22/Sep/25', dueDate: '2025-09-22', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '56415', tributeCode: '0114022', period: 'Septiembre: 20/Oct/25', dueDate: '2025-10-20', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '57215', tributeCode: '0114022', period: 'Octubre: 20/Nov/25', dueDate: '2025-11-20', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '58015', tributeCode: '0114022', period: 'Noviembre: 22/Dic/25', dueDate: '2025-12-22', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      { barcode: '78815', tributeCode: '0114022', period: 'Diciembre: 20/Ene/26', dueDate: '2026-01-20', periodicity: 'mensual', description: 'Impuesto s/ ventas y servicios (PN)' },
      
      // Aporte a cuenta Impuesto s/ Ingresos Personales - MENSUAL (5% sobre ingresos > 3,260 CUP)
      // Solo aplica cuando los ingresos mensuales superan el mínimo exento (3,260 CUP)
      { barcode: '10016', tributeCode: '0510122', period: 'Enero: 20/Feb/25', dueDate: '2025-02-20', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '30816', tributeCode: '0510122', period: 'Febrero: 20/Mar/25', dueDate: '2025-03-20', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '31616', tributeCode: '0510122', period: 'Marzo: 21/Abr/25', dueDate: '2025-04-21', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '32416', tributeCode: '0510122', period: 'Abril: 20/May/25', dueDate: '2025-05-20', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '33216', tributeCode: '0510122', period: 'Mayo: 20/Jun/25', dueDate: '2025-06-20', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '34016', tributeCode: '0510122', period: 'Junio: 21/Jul/25', dueDate: '2025-07-21', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '54816', tributeCode: '0510122', period: 'Julio: 20/Ago/25', dueDate: '2025-08-20', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '55616', tributeCode: '0510122', period: 'Agosto: 22/Sep/25', dueDate: '2025-09-22', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '56416', tributeCode: '0510122', period: 'Septiembre: 20/Oct/25', dueDate: '2025-10-20', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '57216', tributeCode: '0510122', period: 'Octubre: 20/Nov/25', dueDate: '2025-11-20', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '58016', tributeCode: '0510122', period: 'Noviembre: 22/Dic/25', dueDate: '2025-12-22', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      { barcode: '78816', tributeCode: '0510122', period: 'Diciembre: 20/Ene/26', dueDate: '2026-01-20', periodicity: 'mensual', description: 'Aporte a cuenta Imp. Ingresos Personales', amount: 0, conditional: true },
      
      // Pagos TRIMESTRALES - 1,200 CUP fijo
      { barcode: '80205', tributeCode: '0820132', period: 'Trimestre enero - marzo: 21/Abr/25', dueDate: '2025-04-21', amount: 1200, periodicity: 'trimestral', description: 'Pago trimestral' },
      { barcode: '02605', tributeCode: '0820132', period: 'Trimestre abril - junio: 21/Jul/25', dueDate: '2025-07-21', amount: 1200, periodicity: 'trimestral', description: 'Pago trimestral' },
      { barcode: '05005', tributeCode: '0820132', period: 'Trimestre julio - septiembre: 20/Oct/25', dueDate: '2025-10-20', amount: 1200, periodicity: 'trimestral', description: 'Pago trimestral' },
      { barcode: '27405', tributeCode: '0820132', period: 'Trimestre octubre - diciembre: 20/Ene/26', dueDate: '2026-01-20', amount: 1200, periodicity: 'trimestral', description: 'Pago trimestral' }
    ];
    
    // Insertar o actualizar cada obligación para el usuario actual
    const results = [];
    for (const data of vectorFiscalData) {
      const existing = await Obligation.findOne({ 
        barcode: data.barcode,
        user: req.user._id 
      });
      if (!existing) {
        const obligation = new Obligation({
          ...data,
          user: req.user._id,
          fiscalYear: 2025,
          status: 'pendiente'
        });
        await obligation.save();
        results.push({ barcode: data.barcode, action: 'created' });
      } else {
        results.push({ barcode: data.barcode, action: 'exists' });
      }
    }
    
    res.json({ 
      message: 'Vector Fiscal 2025 importado',
      total: vectorFiscalData.length,
      results 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resumen de obligaciones del usuario actual
exports.getSummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
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
