/**
 * Calculadora de Impuestos ONAT Cuba
 * Basado en la Ley 113 del Sistema Tributario y Ley 174 del Presupuesto 2025
 */

// ============================================
// CONSTANTES SEGÚN LEY TRIBUTARIA CUBA 2025
// ============================================

// Impuesto sobre Ventas y Servicios (0114022)
// 10% sobre ingresos brutos mensuales
const SALES_TAX_RATE = 0.10;

// Aporte a cuenta Impuesto sobre Ingresos Personales (0510122)
// 5% sobre ingresos que excedan el mínimo exento mensual
const INCOME_ADVANCE_RATE = 0.05;

// Mínimo exento mensual (39,120 CUP anuales / 12 meses)
const MONTHLY_EXEMPT = 3260;

// Mínimo exento anual
const ANNUAL_EXEMPT = 39120;

// Escala progresiva del Impuesto sobre Ingresos Personales (Ley 174/2025)
// 10 tramos aplicados sobre la base imponible (ingresos - mínimo exento - gastos)
const INCOME_TAX_BRACKETS_2025 = [
  { min: 0, max: 25000, rate: 0.05 },
  { min: 25000, max: 50000, rate: 0.10 },
  { min: 50000, max: 75000, rate: 0.15 },
  { min: 75000, max: 100000, rate: 0.20 },
  { min: 100000, max: 150000, rate: 0.25 },
  { min: 150000, max: 200000, rate: 0.30 },
  { min: 200000, max: 350000, rate: 0.35 },
  { min: 350000, max: 500000, rate: 0.40 },
  { min: 500000, max: 1000000, rate: 0.45 },
  { min: 1000000, max: Infinity, rate: 0.50 }
];

// Pago trimestral fijo (0820132)
const QUARTERLY_PAYMENT = 1200;

// ============================================
// FUNCIONES DE CÁLCULO MENSUAL
// ============================================

/**
 * Calcula el Impuesto sobre Ventas y Servicios (0114022)
 * @param {number} grossIncome - Ingreso bruto mensual
 * @returns {number} - Impuesto a pagar (10% del ingreso bruto)
 */
function calculateSalesTax(grossIncome) {
  return Math.round(grossIncome * SALES_TAX_RATE * 100) / 100;
}

/**
 * Calcula el Aporte a cuenta del Impuesto sobre Ingresos Personales (0510122)
 * Solo aplica cuando los ingresos superan el mínimo exento mensual (3,260 CUP)
 * @param {number} grossIncome - Ingreso bruto mensual
 * @returns {Object} - { applies: boolean, amount: number, excess: number }
 */
function calculateIncomeAdvance(grossIncome) {
  if (grossIncome <= MONTHLY_EXEMPT) {
    return {
      applies: false,
      amount: 0,
      excess: 0,
      message: `No aplica (ingresos ≤ ${MONTHLY_EXEMPT} CUP)`
    };
  }
  
  const excess = grossIncome - MONTHLY_EXEMPT;
  const amount = Math.round(excess * INCOME_ADVANCE_RATE * 100) / 100;
  
  return {
    applies: true,
    amount,
    excess,
    message: `5% sobre ${excess.toFixed(2)} CUP (exceso del mínimo exento)`
  };
}

/**
 * Calcula todos los impuestos mensuales para un ingreso dado
 * @param {number} grossIncome - Ingreso bruto mensual
 * @returns {Object} - Desglose completo de impuestos mensuales
 */
function calculateMonthlyTaxes(grossIncome) {
  const salesTax = calculateSalesTax(grossIncome);
  const incomeAdvance = calculateIncomeAdvance(grossIncome);
  
  const totalTax = salesTax + incomeAdvance.amount;
  
  return {
    grossIncome,
    taxes: {
      // 0114022 - Impuesto sobre Ventas y Servicios
      salesTax: {
        code: '0114022',
        name: 'Impuesto s/ ventas y servicios (PN)',
        rate: SALES_TAX_RATE,
        amount: salesTax
      },
      // 0510122 - Aporte a cuenta Imp. Ingresos Personales
      incomeAdvance: {
        code: '0510122',
        name: 'Aporte a cuenta Imp. Ingresos Personales',
        rate: INCOME_ADVANCE_RATE,
        applies: incomeAdvance.applies,
        excess: incomeAdvance.excess,
        amount: incomeAdvance.amount,
        message: incomeAdvance.message
      }
    },
    totalMonthlyTax: totalTax,
    minimumExempt: MONTHLY_EXEMPT
  };
}

// ============================================
// FUNCIONES DE CÁLCULO ANUAL
// ============================================

/**
 * Calcula el Impuesto sobre Ingresos Personales anual usando escala progresiva
 * @param {number} annualIncome - Ingreso bruto anual
 * @param {number} deductibleExpenses - Gastos deducibles (hasta 100%, requiere 80% justificado)
 * @returns {Object} - Desglose del impuesto anual
 */
function calculateAnnualIncomeTax(annualIncome, deductibleExpenses = null) {
  // Si no se especifican gastos, usar el 40% como estimación conservadora
  const expenses = deductibleExpenses !== null ? deductibleExpenses : annualIncome * 0.40;
  
  // Base imponible = Ingresos - Mínimo exento - Gastos deducibles
  const taxableBase = Math.max(0, annualIncome - ANNUAL_EXEMPT - expenses);
  
  if (taxableBase <= 0) {
    return {
      annualIncome,
      deductibleExpenses: expenses,
      annualExempt: ANNUAL_EXEMPT,
      taxableBase: 0,
      tax: 0,
      effectiveRate: 0,
      brackets: []
    };
  }
  
  // Aplicar escala progresiva
  let totalTax = 0;
  let remaining = taxableBase;
  const appliedBrackets = [];
  
  for (const bracket of INCOME_TAX_BRACKETS_2025) {
    if (remaining <= 0) break;
    
    const bracketSize = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remaining, bracketSize);
    const taxInBracket = taxableInBracket * bracket.rate;
    
    if (taxableInBracket > 0) {
      appliedBrackets.push({
        range: `${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? '∞' : bracket.max.toLocaleString()}`,
        rate: `${bracket.rate * 100}%`,
        taxable: taxableInBracket,
        tax: Math.round(taxInBracket * 100) / 100
      });
    }
    
    totalTax += taxInBracket;
    remaining -= taxableInBracket;
  }
  
  totalTax = Math.round(totalTax * 100) / 100;
  const effectiveRate = annualIncome > 0 ? (totalTax / annualIncome * 100) : 0;
  
  return {
    annualIncome,
    deductibleExpenses: expenses,
    annualExempt: ANNUAL_EXEMPT,
    taxableBase,
    tax: totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    brackets: appliedBrackets
  };
}

/**
 * Estima los impuestos anuales basado en ingresos mensuales
 * @param {Array} monthlyIncomes - Array de ingresos mensuales [enero, febrero, ...]
 * @returns {Object} - Estimación anual completa
 */
function estimateAnnualTaxes(monthlyIncomes) {
  // Si es un solo número, convertir a array de 12 meses iguales
  if (typeof monthlyIncomes === 'number') {
    monthlyIncomes = Array(12).fill(monthlyIncomes);
  }
  
  const annualIncome = monthlyIncomes.reduce((sum, m) => sum + (m || 0), 0);
  
  // Calcular impuestos mensuales
  const monthlyDetails = monthlyIncomes.map((income, index) => {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return {
      month: monthNames[index],
      income: income || 0,
      taxes: calculateMonthlyTaxes(income || 0)
    };
  });
  
  // Totales de impuestos mensuales
  const totalSalesTax = monthlyDetails.reduce((sum, m) => sum + m.taxes.taxes.salesTax.amount, 0);
  const totalIncomeAdvance = monthlyDetails.reduce((sum, m) => sum + m.taxes.taxes.incomeAdvance.amount, 0);
  const totalQuarterly = QUARTERLY_PAYMENT * 4;
  
  // Impuesto sobre ingresos personales anual (declaración jurada)
  const annualIncomeTax = calculateAnnualIncomeTax(annualIncome);
  
  // El aporte mensual (0510122) se descuenta de la liquidación anual
  const annualTaxDue = Math.max(0, annualIncomeTax.tax - totalIncomeAdvance);
  
  return {
    summary: {
      annualIncome,
      averageMonthlyIncome: annualIncome / 12,
      monthsAboveExempt: monthlyDetails.filter(m => m.income > MONTHLY_EXEMPT).length
    },
    monthlyTaxes: {
      salesTax: Math.round(totalSalesTax * 100) / 100,
      incomeAdvance: Math.round(totalIncomeAdvance * 100) / 100,
      totalMonthly: Math.round((totalSalesTax + totalIncomeAdvance) * 100) / 100
    },
    quarterlyPayments: {
      perQuarter: QUARTERLY_PAYMENT,
      total: totalQuarterly
    },
    annualIncomeTax: {
      ...annualIncomeTax,
      advancesPaid: totalIncomeAdvance,
      remainingDue: annualTaxDue
    },
    grandTotal: Math.round((totalSalesTax + totalIncomeAdvance + totalQuarterly + annualTaxDue) * 100) / 100,
    monthlyDetails
  };
}

// ============================================
// FUNCIONES DE BONIFICACIÓN
// ============================================

/**
 * Calcula bonificaciones disponibles
 * @param {number} amount - Monto original a pagar
 * @param {boolean} isEarlyPayment - Si es pago anticipado (antes del vencimiento)
 * @param {boolean} useTransfermovil - Si usa Transfermóvil/EnZona
 * @returns {Object} - Información de bonificaciones
 */
function calculateBonus(amount, isEarlyPayment = false, useTransfermovil = false) {
  let bonusPercent = 0;
  const bonuses = [];
  
  if (isEarlyPayment) {
    bonusPercent += 5;
    bonuses.push({ type: 'Pago anticipado', percent: 5, amount: Math.round(amount * 0.05 * 100) / 100 });
  }
  
  if (useTransfermovil) {
    bonusPercent += 3;
    bonuses.push({ type: 'Transfermóvil/EnZona', percent: 3, amount: Math.round(amount * 0.03 * 100) / 100 });
  }
  
  const bonusAmount = Math.round(amount * bonusPercent / 100 * 100) / 100;
  const finalAmount = Math.round((amount - bonusAmount) * 100) / 100;
  
  return {
    originalAmount: amount,
    bonusPercent,
    bonusAmount,
    finalAmount,
    bonuses,
    savings: bonusAmount
  };
}

/**
 * Obtiene el pago trimestral fijo
 * @returns {number} - Monto fijo trimestral (1,200 CUP)
 */
function getQuarterlyPayment() {
  return QUARTERLY_PAYMENT;
}

// ============================================
// EXPORTACIONES
// ============================================

module.exports = {
  // Cálculos mensuales
  calculateSalesTax,
  calculateIncomeAdvance,
  calculateMonthlyTaxes,
  
  // Cálculos anuales
  calculateAnnualIncomeTax,
  estimateAnnualTaxes,
  
  // Bonificaciones
  calculateBonus,
  getQuarterlyPayment,
  
  // Constantes
  SALES_TAX_RATE,
  INCOME_ADVANCE_RATE,
  MONTHLY_EXEMPT,
  ANNUAL_EXEMPT,
  QUARTERLY_PAYMENT,
  INCOME_TAX_BRACKETS_2025
};
