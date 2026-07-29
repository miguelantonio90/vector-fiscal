const { Obligation, Income } = require('../models');
const { calculateMonthlyTaxes, calculateIncomeAdvance } = require('./taxCalculator');

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Actualiza los montos de las obligaciones mensuales (0114022, 0510122)
 * según el ingreso registrado del mes. Solo actualiza si no están pagadas.
 */
async function syncMonthObligationAmounts(userId, month, year, grossIncome) {
  const taxes = calculateMonthlyTaxes(grossIncome || 0);
  const advance = calculateIncomeAdvance(grossIncome || 0);
  const monthLabel = MONTH_NAMES[month];
  if (!monthLabel) return { updated: 0 };

  const periodPrefix = new RegExp(`^${monthLabel}:`, 'i');
  let updated = 0;

  const sales = await Obligation.findOne({
    user: userId,
    fiscalYear: year,
    tributeCode: '0114022',
    period: periodPrefix,
    status: { $ne: 'pagado' }
  });
  if (sales) {
    sales.amount = taxes.taxes.salesTax.amount;
    await sales.save();
    updated++;
  }

  const personal = await Obligation.findOne({
    user: userId,
    fiscalYear: year,
    tributeCode: '0510122',
    period: periodPrefix,
    status: { $ne: 'pagado' }
  });
  if (personal) {
    personal.amount = advance.amount;
    await personal.save();
    updated++;
  }

  return { updated, salesTax: taxes.taxes.salesTax.amount, incomeAdvance: advance.amount };
}

/**
 * Sincroniza todas las obligaciones mensuales no pagadas del año
 * a partir de los ingresos registrados.
 */
async function syncYearObligationAmounts(userId, year) {
  const incomes = await Income.find({ user: userId, year });
  let totalUpdated = 0;

  for (const income of incomes) {
    const result = await syncMonthObligationAmounts(
      userId,
      income.month,
      year,
      income.grossIncome
    );
    totalUpdated += result.updated;
  }

  return { totalUpdated, monthsSynced: incomes.length };
}

module.exports = {
  syncMonthObligationAmounts,
  syncYearObligationAmounts,
  MONTH_NAMES
};
