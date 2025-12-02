const { Income } = require('../models');
const { calculateTaxes } = require('../utils/taxCalculator');

// Obtener todos los ingresos del usuario actual
exports.getAll = async (req, res) => {
  try {
    const { year } = req.query;
    const filter = { user: req.user._id };
    if (year) filter.year = parseInt(year);
    
    const incomes = await Income.find(filter).sort({ year: -1, month: -1 });
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener ingreso por mes y año (verificando que pertenece al usuario)
exports.getByMonthYear = async (req, res) => {
  try {
    const { month, year } = req.params;
    const income = await Income.findOne({ 
      user: req.user._id,
      month: parseInt(month), 
      year: parseInt(year) 
    });
    
    if (!income) {
      return res.status(404).json({ error: 'Ingreso no encontrado para ese período' });
    }
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear o actualizar ingreso mensual para el usuario actual
exports.upsert = async (req, res) => {
  try {
    const { month, year, grossIncome, deductibleExpenses, notes } = req.body;
    
    // Calcular impuestos
    const taxes = calculateTaxes(grossIncome, deductibleExpenses);
    
    const income = await Income.findOneAndUpdate(
      { user: req.user._id, month, year },
      {
        user: req.user._id,
        month,
        year,
        grossIncome,
        deductibleExpenses,
        netIncome: taxes.netIncome,
        salesTax: taxes.salesTax,
        personalIncomeTax: taxes.personalIncomeTax,
        notes
      },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json({
      income,
      taxBreakdown: taxes
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar ingreso (verificando que pertenece al usuario)
exports.delete = async (req, res) => {
  try {
    const { month, year } = req.params;
    const income = await Income.findOneAndDelete({ 
      user: req.user._id,
      month: parseInt(month), 
      year: parseInt(year) 
    });
    
    if (!income) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }
    res.json({ message: 'Ingreso eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resumen anual de ingresos del usuario actual
exports.getAnnualSummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
    
    const incomes = await Income.find({ user: req.user._id, year }).sort({ month: 1 });
    
    const summary = {
      year,
      months: incomes,
      totals: {
        grossIncome: incomes.reduce((sum, i) => sum + i.grossIncome, 0),
        deductibleExpenses: incomes.reduce((sum, i) => sum + i.deductibleExpenses, 0),
        netIncome: incomes.reduce((sum, i) => sum + i.netIncome, 0),
        salesTax: incomes.reduce((sum, i) => sum + i.salesTax, 0),
        personalIncomeTax: incomes.reduce((sum, i) => sum + i.personalIncomeTax, 0)
      }
    };
    
    summary.totals.totalTaxes = summary.totals.salesTax + summary.totals.personalIncomeTax;
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
