/**
 * Calcula el recargo por mora según las reglas ONAT (código tributo 1060122):
 *   - Hasta 30 días hábiles: 2% del principal
 *   - Más de 30 y hasta 60 días hábiles: 5% del principal
 *   - Más de 60 días hábiles: 0.1% por cada día, hasta el 40% del principal
 */
function calculateLateSurcharge(principal, dueDate, paymentDate = new Date()) {
  if (!principal || principal <= 0 || !dueDate) return null;

  const due = new Date(dueDate);
  const paid = new Date(paymentDate);
  due.setHours(0, 0, 0, 0);
  paid.setHours(0, 0, 0, 0);

  if (paid <= due) return null;

  const msPerDay = 86400000;
  const calendarDays = Math.floor((paid - due) / msPerDay);

  let businessDays = 0;
  const d = new Date(due);
  for (let i = 0; i < calendarDays; i++) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) businessDays++;
  }

  if (businessDays <= 0) return null;

  let surchargeRate;
  let description;

  if (businessDays <= 30) {
    surchargeRate = 2;
    description = `${businessDays} días hábiles de mora → 2% recargo`;
  } else if (businessDays <= 60) {
    surchargeRate = 5;
    description = `${businessDays} días hábiles de mora → 5% recargo`;
  } else {
    surchargeRate = Math.min(businessDays * 0.1, 40);
    description = `${businessDays} días hábiles de mora → ${surchargeRate.toFixed(1)}% recargo (0.1%/día, máx 40%)`;
  }

  const surchargeAmount = Math.round((principal * surchargeRate / 100) * 100) / 100;

  return {
    lateDays: businessDays,
    calendarDays,
    surchargeRate,
    surchargeAmount,
    description
  };
}

const MONTH_NAMES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
};

function getMonthFromPeriod(period) {
  if (!period) return null;
  const p = String(period).toLowerCase();
  for (const [name, num] of Object.entries(MONTH_NAMES)) {
    if (p.startsWith(name + ':')) return num;
  }
  return null;
}

/**
 * Principal estimado de una obligación según ingreso del mes o monto fijo.
 */
function resolvePrincipal(obligation, incomeByMonth = {}) {
  if (obligation.tributeCode === '0820132' || obligation.tributeCode === '0530222') {
    return obligation.amount > 0 ? obligation.amount : (obligation.tributeCode === '0820132' ? 1200 : 0);
  }

  const month = getMonthFromPeriod(obligation.period);
  const income = month ? (incomeByMonth[month] || 0) : 0;

  if (income > 0) {
    if (obligation.tributeCode === '0114022') return Math.round(income * 0.10 * 100) / 100;
    if (obligation.tributeCode === '0510122') {
      if (income <= 3260) return 0;
      return Math.round((income - 3260) * 0.05 * 100) / 100;
    }
  }

  if (obligation.amount && obligation.amount > 0) return obligation.amount;
  return 0;
}

function formatMoney(amount) {
  return `$${Number(amount || 0).toLocaleString('es-CU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildAmountSuffix(obligation, incomeByMonth = {}, asOfDate = new Date()) {
  const principal = resolvePrincipal(obligation, incomeByMonth);
  if (!principal) return '';

  const surcharge = calculateLateSurcharge(principal, obligation.dueDate, asOfDate);
  if (surcharge && surcharge.surchargeAmount > 0) {
    const total = Math.round((principal + surcharge.surchargeAmount) * 100) / 100;
    return ` — ${formatMoney(principal)} + mora ${formatMoney(surcharge.surchargeAmount)} = ${formatMoney(total)}`;
  }
  return ` — ${formatMoney(principal)}`;
}

module.exports = {
  calculateLateSurcharge,
  getMonthFromPeriod,
  resolvePrincipal,
  buildAmountSuffix,
  formatMoney
};
