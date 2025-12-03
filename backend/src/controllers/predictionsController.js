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
    const { year = new Date().getFullYear() } = req.query;

    // Obtener todos los datos del usuario
    const [incomes, obligations, payments] = await Promise.all([
      Income.find({ user: userId }),
      Obligation.find({ user: userId, year: parseInt(year) }),
      Payment.find({ user: userId })
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
      parseInt(year)
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
      Income.find({ user: userId }),
      Obligation.find({ user: userId, year }),
      Payment.find({ user: userId })
    ]);

    // Mapear ingresos - usar grossIncome como campo principal
    const incomeHistory = incomes.map(i => ({
      month: i.month,
      year: i.year,
      amount: i.grossIncome || 0
    }));

    // Generar todas las predicciones
    const [incomePredictions, taxEstimates, cashFlow, insights] = await Promise.all([
      Promise.resolve(predictionsService.predictFutureIncome(incomeHistory, 3)),
      Promise.resolve(predictionsService.estimateFutureTaxes(incomeHistory, 3)),
      Promise.resolve(predictionsService.analyzeCashFlow(incomeHistory, obligations, payments, year)),
      Promise.resolve(predictionsService.generateDashboardInsights({ incomes, obligations, payments, user: req.user }))
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
        predictions: incomePredictions.predictions,
        trend: incomePredictions.trend,
        statistics: incomePredictions.statistics
      },
      taxes: {
        estimates: taxEstimates.estimates,
        summary: taxEstimates.summary
      },
      cashFlow: {
        months: cashFlow.months,
        summary: cashFlow.summary,
        insights: cashFlow.insights
      },
      dashboard: {
        insights: insights.insights,
        summary: insights.summary
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
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  predictIncome,
  estimateTaxes,
  getCashFlow,
  getDashboardInsights,
  calculateEstimate,
  getSummary
};

