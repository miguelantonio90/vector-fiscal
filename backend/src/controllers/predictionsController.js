const { Income, Obligation, Payment } = require('../models');
const predictionsService = require('../utils/predictionsService');
const taxCalculator = require('../utils/taxCalculator');

/**
 * Obtener predicciones de ingresos futuros
 * GET /api/predictions/income
 */
const predictIncome = async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 3 } = req.query;

    // Obtener historial de ingresos
    const incomes = await Income.find({ user: userId })
      .sort({ year: 1, month: 1 });

    // Mapear ingresos - usar grossIncome como campo principal
    const incomeHistory = incomes.map(i => ({
      month: i.month,
      year: i.year,
      amount: i.grossIncome || 0
    }));

    const predictions = predictionsService.predictFutureIncome(
      incomeHistory, 
      parseInt(months)
    );

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener estimaciones de impuestos futuros
 * GET /api/predictions/taxes
 */
const estimateTaxes = async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 3 } = req.query;

    // Obtener historial de ingresos
    const incomes = await Income.find({ user: userId })
      .sort({ year: 1, month: 1 });

    // Mapear ingresos - usar grossIncome como campo principal
    const incomeHistory = incomes.map(i => ({
      month: i.month,
      year: i.year,
      amount: i.grossIncome || 0
    }));

    const estimates = predictionsService.estimateFutureTaxes(
      incomeHistory,
      parseInt(months)
    );

    res.json(estimates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener análisis de flujo de caja
 * GET /api/predictions/cashflow
 */
const getCashFlow = async (req, res) => {
  try {
    const userId = req.user._id;
    const yearParam = parseInt(req.query.year) || new Date().getFullYear();

    // Obtener todos los datos del usuario para el año especificado
    const [incomes, obligations, payments] = await Promise.all([
      Income.find({ user: userId, year: yearParam }),
      Obligation.find({ user: userId, fiscalYear: yearParam }),
      Payment.find({ 
        user: userId,
        paymentDate: {
          $gte: new Date(yearParam, 0, 1),
          $lt: new Date(yearParam + 1, 0, 1)
        }
      })
    ]);

    // Mapear ingresos - usar grossIncome como campo principal
    const incomeHistory = incomes.map(i => ({
      month: i.month,
      year: i.year,
      amount: i.grossIncome || 0
    }));

    const cashFlow = predictionsService.analyzeCashFlow(
      incomeHistory,
      obligations,
      payments,
      yearParam
    );

    res.json(cashFlow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener insights para el dashboard
 * GET /api/predictions/insights
 */
const getDashboardInsights = async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtener todos los datos del usuario
    const [incomes, obligations, payments] = await Promise.all([
      Income.find({ user: userId }),
      Obligation.find({ user: userId }),
      Payment.find({ user: userId })
    ]);

    // Normalizar ingresos para que tengan el campo amount
    const normalizedIncomes = incomes.map(i => ({
      ...i.toObject(),
      amount: i.grossIncome || 0
    }));

    const insights = predictionsService.generateDashboardInsights({
      incomes: normalizedIncomes,
      obligations,
      payments,
      user: req.user
    });

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Calcular impuestos estimados para un ingreso dado
 * POST /api/predictions/calculate
 */
const calculateEstimate = async (req, res) => {
  try {
    const { income, includeBonus = true } = req.body;

    if (!income || income < 0) {
      return res.status(400).json({ error: 'Ingreso inválido' });
    }

    const taxes = taxCalculator.calculateMonthlyTaxes(income);
    
    let result = {
      income,
      taxes: {
        salesTax: {
          code: '0114022',
          name: 'Impuesto s/ ventas y servicios',
          amount: taxes.taxes.salesTax.amount,
          rate: '10%'
        },
        incomeAdvance: {
          code: '0510122',
          name: 'Aporte a cuenta Imp. Ingresos',
          amount: taxes.taxes.incomeAdvance.amount,
          applies: taxes.taxes.incomeAdvance.applies,
          rate: '5%'
        },
        total: taxes.totalMonthlyTax
      }
    };

    if (includeBonus) {
      const withBonus = taxCalculator.calculateBonus(taxes.totalMonthlyTax, true, true);
      result.withBonus = {
        earlyPayment: taxCalculator.calculateBonus(taxes.totalMonthlyTax, true, false),
        transfermovil: taxCalculator.calculateBonus(taxes.totalMonthlyTax, false, true),
        combined: withBonus
      };
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener resumen completo de predicciones
 * GET /api/predictions/summary
 */
const getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Obtener todos los datos
    const [incomes, obligations, payments] = await Promise.all([
      Income.find({ user: userId, year }),
      Obligation.find({ user: userId, fiscalYear: year }),
      Payment.find({ 
        user: userId,
        paymentDate: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      })
    ]);

    // Mapear ingresos - usar grossIncome como campo principal
    const incomeHistory = incomes.map(i => ({
      month: i.month,
      year: i.year,
      amount: i.grossIncome || 0
    }));

    // Normalizar ingresos para que tengan el campo amount
    const normalizedIncomes = incomes.map(i => ({
      ...i.toObject(),
      amount: i.grossIncome || 0
    }));

    // Generar todas las predicciones
    const [incomePredictions, taxEstimates, cashFlow, insights] = await Promise.all([
      Promise.resolve(predictionsService.predictFutureIncome(incomeHistory, 3)),
      Promise.resolve(predictionsService.estimateFutureTaxes(incomeHistory, 3)),
      Promise.resolve(predictionsService.analyzeCashFlow(incomeHistory, obligations, payments, year)),
      Promise.resolve(predictionsService.generateDashboardInsights({ incomes: normalizedIncomes, obligations, payments, user: req.user }))
    ]);

    // Calcular métricas adicionales
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    
    const pendingObligations = obligations.filter(o => 
      o.status === 'pendiente' && new Date(o.dueDate) >= now
    );
    
    const paidThisYear = payments.filter(p => 
      new Date(p.paymentDate).getFullYear() === year
    );
    
    const totalPaid = paidThisYear.reduce((sum, p) => sum + p.amount, 0);
    const totalSaved = paidThisYear.reduce((sum, p) => sum + (p.bonusAmount || 0), 0);

    res.json({
      year,
      currentMonth,
      income: {
        history: incomeHistory.filter(i => i.year === year),
        predictions: incomePredictions?.predictions || [],
        trend: incomePredictions?.trend || { direction: 'stable', strength: 0 },
        statistics: incomePredictions?.statistics || {}
      },
      taxes: {
        estimates: taxEstimates?.estimates || [],
        summary: taxEstimates?.summary || {}
      },
      cashFlow: {
        months: cashFlow?.months || [],
        summary: cashFlow?.summary || {},
        insights: cashFlow?.insights || []
      },
      dashboard: {
        insights: insights?.insights || [],
        summary: insights?.summary || {}
      },
      metrics: {
        pendingCount: pendingObligations.length,
        pendingAmount: pendingObligations.reduce((sum, o) => sum + (o.amount || 0), 0),
        paidCount: paidThisYear.length,
        totalPaid,
        totalSaved,
        savingsRate: totalPaid > 0 ? Math.round((totalSaved / (totalPaid + totalSaved)) * 100 * 100) / 100 : 0
      }
    });
  } catch (error) {
    console.error('Error in getSummary:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Calcular Declaración Jurada Anual (DJ-08)
 * GET /api/predictions/annual-declaration
 */
const getAnnualDeclaration = async (req, res) => {
  try {
    const userId = req.user._id;
    // Por defecto usar el año actual (donde probablemente hay datos)
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Obtener todos los ingresos del año
    const incomes = await Income.find({ 
      user: userId, 
      year: year 
    }).sort({ month: 1 });

    // Obtener todos los pagos del año con la obligación poblada
    const payments = await Payment.find({
      user: userId,
      paymentDate: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    }).populate('obligation');

    // Obtener obligaciones del año
    const obligations = await Obligation.find({
      user: userId,
      fiscalYear: year
    });

    // Calcular ingresos mensuales
    const monthlyIncomes = Array(12).fill(0);
    incomes.forEach(i => {
      if (i.month >= 1 && i.month <= 12) {
        monthlyIncomes[i.month - 1] = i.grossIncome || 0;
      }
    });

    const annualIncome = monthlyIncomes.reduce((sum, m) => sum + m, 0);

    // Calcular pagos a cuenta realizados basados en el tributeCode de la obligación
    const salesTaxPaid = payments
      .filter(p => p.obligation?.tributeCode === '0114022') // Impuesto sobre Ventas
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const incomeAdvancePaid = payments
      .filter(p => p.obligation?.tributeCode === '0510122') // Aporte a cuenta
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const quarterlyPaid = payments
      .filter(p => p.obligation?.tributeCode === '0820132') // Pago trimestral
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Usar la función de estimación anual
    const annualEstimate = taxCalculator.estimateAnnualTaxes(monthlyIncomes);

    // Calcular saldo de la declaración
    const totalAdvancesPaid = incomeAdvancePaid; // Los aportes a cuenta se descuentan
    const annualTaxDue = annualEstimate.annualIncomeTax.tax;
    const balance = annualTaxDue - totalAdvancesPaid;

    // Determinar si hay saldo a pagar o a favor
    const hasRefund = balance < 0;
    const hasToPay = balance > 0;

    res.json({
      year,
      status: {
        isComplete: incomes.length >= 12,
        monthsWithIncome: incomes.length,
        deadline: `30 de Abril ${year + 1}`,
        deadlineDate: new Date(year + 1, 3, 30) // 30 de abril
      },
      incomes: {
        monthly: monthlyIncomes.map((amount, index) => ({
          month: index + 1,
          monthName: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][index],
          amount,
          hasData: amount > 0
        })),
        total: annualIncome,
        average: annualIncome / 12
      },
      deductions: {
        minimumExempt: taxCalculator.ANNUAL_EXEMPT,
        estimatedExpenses: annualIncome * 0.40, // 40% estimado
        message: 'Los gastos deducibles requieren 80% de justificación documental'
      },
      calculation: {
        taxableBase: annualEstimate.annualIncomeTax.taxableBase,
        brackets: annualEstimate.annualIncomeTax.brackets,
        grossTax: annualTaxDue,
        effectiveRate: annualEstimate.annualIncomeTax.effectiveRate
      },
      paymentsOnAccount: {
        salesTax: {
          name: 'Impuesto s/ Ventas (0114022)',
          paid: salesTaxPaid,
          note: 'No se descuenta de la DJ'
        },
        incomeAdvance: {
          name: 'Aportes a cuenta (0510122)',
          paid: totalAdvancesPaid,
          note: 'Se descuenta del impuesto anual'
        },
        quarterly: {
          name: 'Pagos trimestrales (0820132)',
          paid: quarterlyPaid,
          note: 'Obligación separada'
        }
      },
      result: {
        annualTaxDue,
        advancesPaid: totalAdvancesPaid,
        balance: Math.abs(balance),
        hasRefund,
        hasToPay,
        status: hasRefund ? 'A FAVOR' : hasToPay ? 'A PAGAR' : 'SALDADO',
        message: hasRefund 
          ? `Tienes un saldo a favor de $${Math.abs(balance).toFixed(2)} CUP` 
          : hasToPay 
            ? `Debes pagar $${balance.toFixed(2)} CUP antes del 30 de Abril`
            : 'Tu declaración está saldada'
      },
      summary: {
        ...annualEstimate.summary,
        monthlyTaxes: annualEstimate.monthlyTaxes,
        quarterlyPayments: annualEstimate.quarterlyPayments,
        grandTotal: annualEstimate.grandTotal
      }
    });
  } catch (error) {
    console.error('Error in getAnnualDeclaration:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  predictIncome,
  estimateTaxes,
  getCashFlow,
  getDashboardInsights,
  calculateEstimate,
  getSummary,
  getAnnualDeclaration
};

