/**
 * Servicio de Predicciones e Insights Fiscales
 * Análisis inteligente basado en datos históricos del usuario
 */

const taxCalculator = require('./taxCalculator');

// Nombres de los meses en español
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ============================================
// PREDICCIÓN DE INGRESOS
// ============================================

/**
 * Predice los ingresos futuros basándose en el historial
 * Usa promedio móvil ponderado y detección de tendencias
 * @param {Array} incomeHistory - Array de objetos { month, year, amount }
 * @param {number} monthsToPredict - Cantidad de meses a predecir
 * @returns {Object} - Predicciones y análisis
 */
function predictFutureIncome(incomeHistory, monthsToPredict = 3) {
  if (!incomeHistory || incomeHistory.length === 0) {
    return {
      predictions: [],
      confidence: 'low',
      message: 'No hay suficientes datos históricos para hacer predicciones',
      trend: 'unknown'
    };
  }

  // Ordenar por fecha
  const sorted = [...incomeHistory].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const amounts = sorted.map(i => i.amount || 0);
  
  // Calcular estadísticas básicas
  const stats = calculateStatistics(amounts);
  
  // Detectar tendencia
  const trend = detectTrend(amounts);
  
  // Calcular predicciones
  const predictions = [];
  const lastEntry = sorted[sorted.length - 1];
  let nextMonth = lastEntry.month;
  let nextYear = lastEntry.year;

  for (let i = 0; i < monthsToPredict; i++) {
    nextMonth++;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    // Predicción usando promedio móvil ponderado + tendencia
    let predictedAmount = calculateWeightedMovingAverage(amounts);
    
    // Ajustar por tendencia
    if (trend.direction === 'up') {
      predictedAmount *= (1 + trend.strength * 0.1 * (i + 1));
    } else if (trend.direction === 'down') {
      predictedAmount *= (1 - trend.strength * 0.1 * (i + 1));
    }

    // Ajustar por estacionalidad si hay datos del año anterior
    const seasonalFactor = getSeasonalFactor(sorted, nextMonth);
    if (seasonalFactor !== 1) {
      predictedAmount *= seasonalFactor;
    }

    predictions.push({
      month: nextMonth,
      monthName: MONTH_NAMES[nextMonth - 1],
      year: nextYear,
      predictedAmount: Math.round(predictedAmount * 100) / 100,
      confidence: getConfidenceLevel(amounts.length, stats.coefficientOfVariation),
      range: {
        low: Math.round(predictedAmount * 0.85 * 100) / 100,
        high: Math.round(predictedAmount * 1.15 * 100) / 100
      }
    });
  }

  return {
    predictions,
    statistics: stats,
    trend,
    dataPoints: amounts.length,
    confidence: getConfidenceLevel(amounts.length, stats.coefficientOfVariation),
    insights: generateIncomeInsights(stats, trend, predictions)
  };
}

/**
 * Calcula el promedio móvil ponderado (más peso a datos recientes)
 */
function calculateWeightedMovingAverage(amounts, windowSize = 3) {
  if (amounts.length === 0) return 0;
  if (amounts.length === 1) return amounts[0];

  const window = amounts.slice(-Math.min(windowSize, amounts.length));
  const weights = window.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  return window.reduce((sum, val, i) => sum + val * weights[i], 0) / totalWeight;
}

/**
 * Detecta la tendencia en los datos
 */
function detectTrend(amounts) {
  if (amounts.length < 2) {
    return { direction: 'stable', strength: 0 };
  }

  // Regresión lineal simple
  const n = amounts.length;
  const xMean = (n - 1) / 2;
  const yMean = amounts.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (amounts[i] - yMean);
    denominator += (i - xMean) ** 2;
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const percentChange = yMean !== 0 ? (slope / yMean) * 100 : 0;
  
  let direction = 'stable';
  if (percentChange > 5) direction = 'up';
  else if (percentChange < -5) direction = 'down';
  
  return {
    direction,
    strength: Math.min(Math.abs(percentChange) / 20, 1), // 0-1 scale
    percentChange: Math.round(percentChange * 100) / 100,
    slope: Math.round(slope * 100) / 100
  };
}

/**
 * Obtiene factor de estacionalidad basado en datos históricos
 */
function getSeasonalFactor(history, targetMonth) {
  const sameMonthData = history.filter(h => h.month === targetMonth);
  if (sameMonthData.length === 0) return 1;

  const avgSameMonth = sameMonthData.reduce((sum, h) => sum + h.amount, 0) / sameMonthData.length;
  const avgAll = history.reduce((sum, h) => sum + h.amount, 0) / history.length;
  
  if (avgAll === 0) return 1;
  return avgSameMonth / avgAll;
}

/**
 * Calcula estadísticas descriptivas
 */
function calculateStatistics(amounts) {
  if (amounts.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0, coefficientOfVariation: 0 };
  }

  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const sorted = [...amounts].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const variance = amounts.reduce((sum, val) => sum + (val - mean) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean !== 0 ? (stdDev / mean) * 100 : 0;

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: Math.min(...amounts),
    max: Math.max(...amounts),
    stdDev: Math.round(stdDev * 100) / 100,
    coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100
  };
}

/**
 * Determina el nivel de confianza de las predicciones
 */
function getConfidenceLevel(dataPoints, cv) {
  if (dataPoints < 3) return 'low';
  if (dataPoints < 6 || cv > 50) return 'medium';
  if (dataPoints >= 6 && cv <= 30) return 'high';
  return 'medium';
}

/**
 * Genera insights sobre los ingresos
 */
function generateIncomeInsights(stats, trend, predictions) {
  const insights = [];

  // Insight de tendencia
  if (trend.direction === 'up') {
    insights.push({
      type: 'positive',
      icon: '📈',
      message: `Tus ingresos muestran una tendencia al alza del ${Math.abs(trend.percentChange)}%`
    });
  } else if (trend.direction === 'down') {
    insights.push({
      type: 'warning',
      icon: '📉',
      message: `Tus ingresos han disminuido un ${Math.abs(trend.percentChange)}% en promedio`
    });
  } else {
    insights.push({
      type: 'info',
      icon: '📊',
      message: 'Tus ingresos se mantienen estables'
    });
  }

  // Insight de variabilidad
  if (stats.coefficientOfVariation > 40) {
    insights.push({
      type: 'info',
      icon: '🎢',
      message: 'Tus ingresos son muy variables. Considera reservar para meses bajos.'
    });
  }

  // Insight de predicción
  if (predictions.length > 0) {
    const avgPredicted = predictions.reduce((sum, p) => sum + p.predictedAmount, 0) / predictions.length;
    insights.push({
      type: 'info',
      icon: '🔮',
      message: `Se estima un ingreso promedio de $${avgPredicted.toLocaleString()} para los próximos ${predictions.length} meses`
    });
  }

  return insights;
}

// ============================================
// ESTIMACIÓN DE IMPUESTOS
// ============================================

/**
 * Estima los impuestos futuros basándose en predicciones de ingresos
 * @param {Array} incomeHistory - Historial de ingresos
 * @param {number} monthsAhead - Meses a estimar
 * @returns {Object} - Estimaciones de impuestos
 */
function estimateFutureTaxes(incomeHistory, monthsAhead = 3) {
  const incomePredictions = predictFutureIncome(incomeHistory, monthsAhead);
  
  if (incomePredictions.predictions.length === 0) {
    return {
      estimates: [],
      totalEstimated: 0,
      message: 'No hay suficientes datos para estimar impuestos'
    };
  }

  const estimates = incomePredictions.predictions.map(pred => {
    const taxes = taxCalculator.calculateMonthlyTaxes(pred.predictedAmount);
    const withBonus = taxCalculator.calculateBonus(
      taxes.totalMonthlyTax, 
      true,  // pago anticipado
      true   // transfermóvil
    );

    return {
      month: pred.month,
      monthName: pred.monthName,
      year: pred.year,
      predictedIncome: pred.predictedAmount,
      estimatedTax: {
        salesTax: taxes.taxes.salesTax.amount,
        incomeAdvance: taxes.taxes.incomeAdvance.amount,
        total: taxes.totalMonthlyTax
      },
      withMaxBonus: {
        amount: withBonus.finalAmount,
        savings: withBonus.savings,
        bonusPercent: withBonus.bonusPercent
      },
      confidence: pred.confidence
    };
  });

  const totalEstimated = estimates.reduce((sum, e) => sum + e.estimatedTax.total, 0);
  const totalWithBonus = estimates.reduce((sum, e) => sum + e.withMaxBonus.amount, 0);
  const totalSavings = totalEstimated - totalWithBonus;

  return {
    estimates,
    summary: {
      totalEstimated: Math.round(totalEstimated * 100) / 100,
      totalWithMaxBonus: Math.round(totalWithBonus * 100) / 100,
      potentialSavings: Math.round(totalSavings * 100) / 100
    },
    insights: generateTaxInsights(estimates, totalSavings)
  };
}

/**
 * Genera insights sobre impuestos
 */
function generateTaxInsights(estimates, totalSavings) {
  const insights = [];

  if (totalSavings > 0) {
    insights.push({
      type: 'tip',
      icon: '💡',
      message: `Puedes ahorrar hasta $${totalSavings.toLocaleString()} pagando anticipado con Transfermóvil`
    });
  }

  // Detectar meses con impuestos altos
  const highTaxMonths = estimates.filter(e => e.estimatedTax.total > 5000);
  if (highTaxMonths.length > 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      message: `${highTaxMonths.map(m => m.monthName).join(', ')} tendrán impuestos elevados. Planifica con anticipación.`
    });
  }

  return insights;
}

// ============================================
// ANÁLISIS DE FLUJO DE CAJA
// ============================================

/**
 * Genera un análisis completo de flujo de caja fiscal
 * @param {Array} incomeHistory - Historial de ingresos
 * @param {Array} obligations - Obligaciones del usuario
 * @param {Array} payments - Pagos realizados
 * @param {number} year - Año a analizar
 * @returns {Object} - Análisis de flujo de caja
 */
function analyzeCashFlow(incomeHistory, obligations, payments, year = 2025) {
  const months = [];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Crear mapa de ingresos por mes
  const incomeMap = {};
  incomeHistory.forEach(inc => {
    if (inc.year === year) {
      incomeMap[inc.month] = inc.amount;
    }
  });

  // Crear mapa de pagos por mes
  const paymentsMap = {};
  payments.forEach(pay => {
    const payDate = new Date(pay.paymentDate);
    if (payDate.getFullYear() === year) {
      const month = payDate.getMonth() + 1;
      if (!paymentsMap[month]) paymentsMap[month] = [];
      paymentsMap[month].push(pay);
    }
  });

  // Crear mapa de obligaciones por mes
  const obligationsMap = {};
  obligations.forEach(obl => {
    const dueDate = new Date(obl.dueDate);
    if (dueDate.getFullYear() === year) {
      const month = dueDate.getMonth() + 1;
      if (!obligationsMap[month]) obligationsMap[month] = [];
      obligationsMap[month].push(obl);
    }
  });

  // Predicciones de ingresos para meses futuros
  const predictions = predictFutureIncome(incomeHistory, 6);
  const predictionsMap = {};
  predictions.predictions.forEach(p => {
    if (p.year === year) {
      predictionsMap[p.month] = p.predictedAmount;
    }
  });

  // Analizar cada mes
  for (let month = 1; month <= 12; month++) {
    const isPast = year < currentYear || (year === currentYear && month < currentMonth);
    const isCurrent = year === currentYear && month === currentMonth;
    const isFuture = year > currentYear || (year === currentYear && month > currentMonth);

    const income = incomeMap[month] || (isFuture ? predictionsMap[month] : 0);
    const monthObligations = obligationsMap[month] || [];
    const monthPayments = paymentsMap[month] || [];

    // Calcular impuestos estimados
    const estimatedTaxes = income > 0 ? taxCalculator.calculateMonthlyTaxes(income) : null;
    
    // Sumar obligaciones pendientes
    const pendingAmount = monthObligations
      .filter(o => o.status === 'pendiente')
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    // Sumar pagos realizados
    const paidAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const bonusSaved = monthPayments.reduce((sum, p) => sum + (p.bonusAmount || 0), 0);

    // Calcular balance
    const totalDue = estimatedTaxes ? estimatedTaxes.totalMonthlyTax : pendingAmount;
    const balance = income - totalDue;

    months.push({
      month,
      monthName: MONTH_NAMES[month - 1],
      status: isPast ? 'past' : (isCurrent ? 'current' : 'future'),
      income: {
        amount: Math.round(income * 100) / 100,
        isEstimated: isFuture && !incomeMap[month]
      },
      obligations: {
        count: monthObligations.length,
        pending: monthObligations.filter(o => o.status === 'pendiente').length,
        paid: monthObligations.filter(o => o.status === 'pagado').length,
        totalDue: Math.round(pendingAmount * 100) / 100
      },
      payments: {
        count: monthPayments.length,
        totalPaid: Math.round(paidAmount * 100) / 100,
        bonusSaved: Math.round(bonusSaved * 100) / 100
      },
      estimatedTaxes: estimatedTaxes ? {
        salesTax: estimatedTaxes.taxes.salesTax.amount,
        incomeAdvance: estimatedTaxes.taxes.incomeAdvance.amount,
        total: estimatedTaxes.totalMonthlyTax
      } : null,
      balance: Math.round(balance * 100) / 100,
      isHighPressure: totalDue > income * 0.2 // Más del 20% de ingresos en impuestos
    });
  }

  // Calcular resumen anual
  const summary = {
    totalIncome: months.reduce((sum, m) => sum + m.income.amount, 0),
    totalTaxes: months.reduce((sum, m) => sum + (m.estimatedTaxes?.total || 0), 0),
    totalPaid: months.reduce((sum, m) => sum + m.payments.totalPaid, 0),
    totalSaved: months.reduce((sum, m) => sum + m.payments.bonusSaved, 0),
    highPressureMonths: months.filter(m => m.isHighPressure).map(m => m.monthName),
    avgMonthlyTax: 0,
    taxToIncomeRatio: 0
  };

  summary.avgMonthlyTax = Math.round(summary.totalTaxes / 12 * 100) / 100;
  summary.taxToIncomeRatio = summary.totalIncome > 0 
    ? Math.round((summary.totalTaxes / summary.totalIncome) * 100 * 100) / 100 
    : 0;

  return {
    year,
    months,
    summary,
    insights: generateCashFlowInsights(months, summary)
  };
}

/**
 * Genera insights sobre el flujo de caja
 */
function generateCashFlowInsights(months, summary) {
  const insights = [];

  // Meses de alta presión
  if (summary.highPressureMonths.length > 0) {
    insights.push({
      type: 'warning',
      icon: '🔥',
      priority: 'high',
      message: `Meses con alta carga fiscal: ${summary.highPressureMonths.join(', ')}. Planifica reservas.`
    });
  }

  // Ratio de impuestos
  if (summary.taxToIncomeRatio > 15) {
    insights.push({
      type: 'info',
      icon: '📊',
      priority: 'medium',
      message: `Tu carga fiscal es del ${summary.taxToIncomeRatio}% de tus ingresos`
    });
  }

  // Ahorro por bonificaciones
  if (summary.totalSaved > 0) {
    insights.push({
      type: 'positive',
      icon: '🎉',
      priority: 'low',
      message: `Has ahorrado $${summary.totalSaved.toLocaleString()} en bonificaciones este año`
    });
  }

  // Recomendación de ahorro
  const monthlyReserve = Math.ceil(summary.avgMonthlyTax * 1.1); // 10% extra de margen
  insights.push({
    type: 'tip',
    icon: '💰',
    priority: 'medium',
    message: `Recomendación: Reserva $${monthlyReserve.toLocaleString()} mensuales para impuestos`
  });

  // Próximos pagos
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const upcomingHeavy = months
    .filter(m => m.month > currentMonth && m.isHighPressure)
    .slice(0, 2);
  
  if (upcomingHeavy.length > 0) {
    insights.push({
      type: 'alert',
      icon: '📅',
      priority: 'high',
      message: `Próximos meses pesados: ${upcomingHeavy.map(m => m.monthName).join(' y ')}`
    });
  }

  return insights.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}

// ============================================
// DASHBOARD INSIGHTS
// ============================================

/**
 * Genera insights inteligentes para el dashboard
 * @param {Object} userData - Datos del usuario (ingresos, obligaciones, pagos)
 * @returns {Object} - Insights para mostrar en el dashboard
 */
function generateDashboardInsights(userData) {
  const { incomes, obligations, payments, user } = userData;
  const insights = [];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Próximo pago
  const pendingObligations = obligations
    .filter(o => o.status === 'pendiente' && new Date(o.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (pendingObligations.length > 0) {
    const next = pendingObligations[0];
    const dueDate = new Date(next.dueDate);
    const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    const canGetBonus = daysUntil > 0;

    insights.push({
      id: 'next-payment',
      type: daysUntil <= 7 ? 'urgent' : 'info',
      icon: daysUntil <= 7 ? '⚡' : '📅',
      title: 'Próximo Pago',
      message: `${next.description} vence en ${daysUntil} días`,
      detail: next.amount > 0 ? `Monto: $${next.amount.toLocaleString()}` : 'Monto por calcular',
      action: canGetBonus ? {
        text: 'Pagar ahora y ahorrar 8%',
        type: 'primary'
      } : null
    });
  }

  // 2. Estimación del mes actual
  const currentIncome = incomes.find(i => i.month === currentMonth && i.year === currentYear);
  if (currentIncome) {
    const taxes = taxCalculator.calculateMonthlyTaxes(currentIncome.amount);
    const withBonus = taxCalculator.calculateBonus(taxes.totalMonthlyTax, true, true);

    insights.push({
      id: 'monthly-estimate',
      type: 'info',
      icon: '🧮',
      title: 'Impuestos del Mes',
      message: `Basado en ingresos de $${currentIncome.amount.toLocaleString()}`,
      detail: `Total: $${taxes.totalMonthlyTax.toLocaleString()} (con bonificación: $${withBonus.finalAmount.toLocaleString()})`,
      breakdown: {
        salesTax: taxes.taxes.salesTax.amount,
        incomeAdvance: taxes.taxes.incomeAdvance.amount,
        potentialSavings: withBonus.savings
      }
    });
  }

  // 3. Tendencia de ingresos
  const incomeHistory = incomes.map(i => ({ month: i.month, year: i.year, amount: i.amount }));
  if (incomeHistory.length >= 3) {
    const prediction = predictFutureIncome(incomeHistory, 1);
    if (prediction.trend.direction !== 'stable') {
      insights.push({
        id: 'income-trend',
        type: prediction.trend.direction === 'up' ? 'positive' : 'warning',
        icon: prediction.trend.direction === 'up' ? '📈' : '📉',
        title: 'Tendencia de Ingresos',
        message: prediction.trend.direction === 'up' 
          ? `Tus ingresos han aumentado ${Math.abs(prediction.trend.percentChange)}%`
          : `Tus ingresos han disminuido ${Math.abs(prediction.trend.percentChange)}%`,
        detail: prediction.predictions[0] 
          ? `Próximo mes estimado: $${prediction.predictions[0].predictedAmount.toLocaleString()}`
          : null
      });
    }
  }

  // 4. Ahorro acumulado
  const totalSaved = payments.reduce((sum, p) => sum + (p.bonusAmount || 0), 0);
  if (totalSaved > 0) {
    insights.push({
      id: 'savings',
      type: 'positive',
      icon: '🎉',
      title: 'Ahorro en Bonificaciones',
      message: `Has ahorrado $${totalSaved.toLocaleString()} este año`,
      detail: 'Pagando anticipado y con Transfermóvil'
    });
  }

  // 5. Alerta de meses pesados próximos
  const cashFlow = analyzeCashFlow(incomeHistory, obligations, payments, currentYear);
  const upcomingHeavy = cashFlow.months
    .filter(m => m.month > currentMonth && m.isHighPressure)
    .slice(0, 1);

  if (upcomingHeavy.length > 0) {
    const heavyMonth = upcomingHeavy[0];
    insights.push({
      id: 'heavy-month-alert',
      type: 'warning',
      icon: '⚠️',
      title: 'Mes Pesado Próximo',
      message: `${heavyMonth.monthName} tendrá alta carga fiscal`,
      detail: `Estimado: $${heavyMonth.estimatedTaxes?.total.toLocaleString() || 'por calcular'}`,
      action: {
        text: 'Ver flujo de caja',
        type: 'secondary'
      }
    });
  }

  // 6. Recordatorio de declaración anual (si estamos cerca)
  if (currentMonth >= 1 && currentMonth <= 4) {
    insights.push({
      id: 'annual-declaration',
      type: 'info',
      icon: '📋',
      title: 'Declaración Jurada',
      message: 'Recuerda presentar tu DJ antes del 30 de abril',
      detail: 'Puedes calcular tu impuesto anual en la calculadora'
    });
  }

  return {
    insights: insights.slice(0, 5), // Máximo 5 insights
    generatedAt: new Date().toISOString(),
    summary: {
      pendingObligations: pendingObligations.length,
      totalPendingAmount: pendingObligations.reduce((sum, o) => sum + (o.amount || 0), 0),
      currentMonthTaxEstimate: currentIncome 
        ? taxCalculator.calculateMonthlyTaxes(currentIncome.amount).totalMonthlyTax 
        : null,
      yearToDateSavings: totalSaved
    }
  };
}

// ============================================
// EXPORTACIONES
// ============================================

module.exports = {
  // Predicciones
  predictFutureIncome,
  estimateFutureTaxes,
  
  // Análisis
  analyzeCashFlow,
  calculateStatistics,
  detectTrend,
  
  // Dashboard
  generateDashboardInsights,
  
  // Helpers
  MONTH_NAMES
};

