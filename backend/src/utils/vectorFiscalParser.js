const pdfParse = require('pdf-parse');

const MONTH_MAP = {
  'ene': '01', 'enero': '01',
  'feb': '02', 'febrero': '02',
  'mar': '03', 'marzo': '03',
  'abr': '04', 'abril': '04',
  'may': '05', 'mayo': '05',
  'jun': '06', 'junio': '06',
  'jul': '07', 'julio': '07',
  'ago': '08', 'agosto': '08',
  'sep': '09', 'septiembre': '09',
  'oct': '10', 'octubre': '10',
  'nov': '11', 'noviembre': '11',
  'dic': '12', 'diciembre': '12'
};

const TRIBUTE_CODES = {
  '0114022': { description: 'Impuesto s/ ventas y servicios (PN)', periodicity: 'mensual' },
  '0510122': { description: 'Aporte a cuenta Imp. Ingresos Personales', periodicity: 'mensual' },
  '0820132': { description: 'Contribución especial a la seguridad social', periodicity: 'trimestral' },
  '0530222': { description: 'Imp. s/ ingresos personales (liquidación adicional)', periodicity: 'anual' }
};

/**
 * Parses "20/Feb/26" → "2026-02-20"
 */
function parseDueDate(dateStr) {
  const match = dateStr.trim().match(/(\d{1,2})\/(\w+)\/(\d{2})/);
  if (!match) return null;

  const day = match[1].padStart(2, '0');
  const monthKey = match[2].toLowerCase();
  const month = MONTH_MAP[monthKey];
  if (!month) return null;

  const yearShort = parseInt(match[3], 10);
  const year = yearShort >= 50 ? 1900 + yearShort : 2000 + yearShort;

  return `${year}-${month}-${day}`;
}

/**
 * The real RC-04A PDF text has lines like:
 *
 *   300160114022Enero: 20/Feb/26              (monthly, no amount)
 *   002061,200.000820132Trimestre enero...: 20/Abr/26  (quarterly, with amount)
 *   101060530222Anual: 30/Abr/27             (annual, no amount)
 *
 * Pattern: BARCODE [AMOUNT] TRIBUTE_CODE PERIOD: DATE
 *
 * Barcode: 5 digits
 * Amount (optional): number like 1,200.00
 * Tribute code: 7 digits starting with 0
 * Period: text with month name(s) and date
 */
function parseObligationLines(text) {
  const results = [];
  const lines = text.split('\n');

  // Match: barcode (5 digits), optional amount, tribute code (7 digits), period with date
  const linePattern = /^(\d{5})([\d,.]+)?(0\d{6})(.+:\s*\d{1,2}\/\w+\/\d{2})\s*$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(linePattern);
    if (!match) continue;

    const barcode = match[1];
    const amountStr = match[2] || '';
    const tributeCode = match[3];
    const periodAndDate = match[4].trim();

    const tributeInfo = TRIBUTE_CODES[tributeCode];
    if (!tributeInfo) continue;

    // Parse amount: "1,200.00" → 1200
    let amount = 0;
    if (amountStr) {
      amount = parseFloat(amountStr.replace(/,/g, '')) || 0;
    }

    // Extract date from period: "Enero: 20/Feb/26" or "Trimestre enero - marzo: 20/Abr/26"
    const dateMatch = periodAndDate.match(/(\d{1,2}\/\w+\/\d{2})/);
    const dueDate = dateMatch ? parseDueDate(dateMatch[1]) : null;
    if (!dueDate) continue;

    const isConditional = tributeCode === '0510122';

    results.push({
      barcode,
      tributeCode,
      description: tributeInfo.description,
      period: periodAndDate,
      dueDate,
      periodicity: tributeInfo.periodicity,
      amount: isConditional ? 0 : amount,
      conditional: isConditional
    });
  }

  return results;
}

/**
 * Detects fiscal year from parsed obligations.
 * Takes the year that appears most in due dates, ignoring January
 * (Jan payments usually belong to the previous fiscal year).
 */
function detectFiscalYear(obligations) {
  const yearCounts = {};
  for (const ob of obligations) {
    if (!ob.dueDate) continue;
    const date = new Date(ob.dueDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (month === 1) continue;
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  }

  const sorted = Object.entries(yearCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? parseInt(sorted[0][0], 10) : new Date().getFullYear();
}

/**
 * Parses a Vector Fiscal RC-04A PDF and returns structured obligation data.
 * @param {Buffer} pdfBuffer
 * @returns {Promise<{obligations: Array, fiscalYear: number, totalFound: number, rawText: string}>}
 */
async function parseVectorFiscalPDF(pdfBuffer) {
  const data = await pdfParse(pdfBuffer);
  const text = data.text;

  const obligations = parseObligationLines(text);

  // Deduplicate by barcode
  const seen = new Set();
  const unique = obligations.filter(ob => {
    if (seen.has(ob.barcode)) return false;
    seen.add(ob.barcode);
    return true;
  });

  const fiscalYear = detectFiscalYear(unique);

  return {
    obligations: unique,
    fiscalYear,
    totalFound: unique.length,
    rawText: text
  };
}

module.exports = {
  parseVectorFiscalPDF,
  parseDueDate,
  detectFiscalYear,
  parseObligationLines
};
