const express = require('express');
const router = express.Router();
const taxCalculator = require('../utils/taxCalculator');

// POST /api/calculator/monthly - Calcular impuestos mensuales
router.post('/monthly', (req, res) => {
  try {
    const { grossIncome } = req.body;
    
    if (!grossIncome || grossIncome < 0) {
      return res.status(400).json({ error: 'Ingreso bruto requerido y debe ser positivo' });
    }
    
    const result = taxCalculator.calculateMonthlyTaxes(grossIncome);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/calculator/annual - Estimar impuestos anuales
router.post('/annual', (req, res) => {
  try {
    const { monthlyIncomes, averageMonthlyIncome } = req.body;
    
    // Puede recibir un array de 12 ingresos mensuales o un promedio
    let incomes;
    if (monthlyIncomes && Array.isArray(monthlyIncomes)) {
      incomes = monthlyIncomes;
    } else if (averageMonthlyIncome && averageMonthlyIncome > 0) {
      incomes = averageMonthlyIncome; // La función lo convertirá a array
    } else {
      return res.status(400).json({ error: 'Se requiere monthlyIncomes (array) o averageMonthlyIncome (número)' });
    }
    
    const result = taxCalculator.estimateAnnualTaxes(incomes);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/calculator/income-advance - Calcular si aplica el aporte 0510122
router.post('/income-advance', (req, res) => {
  try {
    const { grossIncome } = req.body;
    
    if (!grossIncome || grossIncome < 0) {
      return res.status(400).json({ error: 'Ingreso bruto requerido y debe ser positivo' });
    }
    
    const result = taxCalculator.calculateIncomeAdvance(grossIncome);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/calculator/bonus - Calcular bonificaciones
router.post('/bonus', (req, res) => {
  try {
    const { amount, isEarlyPayment, useTransfermovil } = req.body;
    
    if (!amount || amount < 0) {
      return res.status(400).json({ error: 'Monto requerido y debe ser positivo' });
    }
    
    const result = taxCalculator.calculateBonus(amount, isEarlyPayment, useTransfermovil);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calculator/rates - Obtener tasas y configuración vigente
router.get('/rates', (req, res) => {
  res.json({
    salesTax: {
      code: '0114022',
      name: 'Impuesto s/ ventas y servicios (PN)',
      rate: taxCalculator.SALES_TAX_RATE,
      description: '10% sobre ingresos brutos mensuales'
    },
    incomeAdvance: {
      code: '0510122',
      name: 'Aporte a cuenta Imp. Ingresos Personales',
      rate: taxCalculator.INCOME_ADVANCE_RATE,
      monthlyExempt: taxCalculator.MONTHLY_EXEMPT,
      description: '5% sobre ingresos que excedan 3,260 CUP mensuales'
    },
    quarterlyPayment: {
      code: '0820132',
      name: 'Pago trimestral',
      amount: taxCalculator.QUARTERLY_PAYMENT,
      description: 'Monto fijo de 1,200 CUP por trimestre'
    },
    annualIncomeTax: {
      annualExempt: taxCalculator.ANNUAL_EXEMPT,
      brackets: taxCalculator.INCOME_TAX_BRACKETS_2025,
      description: 'Escala progresiva según Ley 174/2025'
    },
    bonuses: {
      earlyPayment: { percent: 5, description: 'Pago antes del vencimiento' },
      transfermovil: { percent: 3, description: 'Pago por Transfermóvil/EnZona' },
      combined: { percent: 8, description: 'Ambas bonificaciones combinadas' }
    }
  });
});

module.exports = router;
