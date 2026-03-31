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

const TRIBUTE_DESCRIPTIONS = {
  '0114022': 'Impuesto s/ ventas y servicios (PN)',
  '0510122': 'Aporte a cuenta Imp. Ingresos Personales',
  '0820132': 'Pago trimestral'
};

const TRIBUTE_PERIODICITY = {
  '0114022': 'mensual',
  '0510122': 'mensual',
  '0820132': 'trimestral'
};

/**
 * Parses a date string like "20/Feb/25", "21/Abr/25", "20/Ene/26"
 * into an ISO date string "2025-02-20"
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
 * Detects the fiscal year from a set of parsed obligations.
 * The fiscal year is the year that appears most often in the due dates,
 * excluding January entries (which typically belong to the previous year's fiscal period).
 */
function detectFiscalYear(obligations) {
  const yearCounts = {};
  for (const ob of obligations) {
    if (!ob.dueDate) continue;
    const date = new Date(ob.dueDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    // Skip January dates — they're usually the last payment of the previous fiscal year
    if (month === 1) continue;
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  }

  const sorted = Object.entries(yearCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? parseInt(sorted[0][0], 10) : new Date().getFullYear();
}

/**
 * Extracts period text from lines surrounding a barcode/tribute match.
 * Handles various formats:
 *   "Enero: 20/Feb/25"
 *   "Trimestre enero - marzo: 21/Abr/25"
 */
function extractPeriodAndDate(text) {
  const results = [];

  // Pattern: matches lines with a barcode (digits), tribute code (7 digits), and a date
  // The RC-04A PDF text typically flows as:
  //   barcode  tributeCode  description...  period: dd/Mon/yy  [amount]
  //
  // After pdf-parse extracts text, columns merge into a single line per row.
  // We look for barcode + tribute code patterns, then extract period/date nearby.

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for tribute codes (7-digit codes starting with 0)
    const tributeMatch = line.match(/\b(0\d{6})\b/);
    if (!tributeMatch) continue;

    const tributeCode = tributeMatch[1];
    if (!TRIBUTE_DESCRIPTIONS[tributeCode]) continue;

    // Look for a barcode — typically a 3-6 digit number near the tribute code
    const barcodeMatch = line.match(/\b(\d{3,6})\b/);
    const barcode = barcodeMatch ? barcodeMatch[1] : null;

    // Look for a date pattern dd/Mon/yy in this line or nearby lines
    const searchWindow = [line, lines[i + 1] || '', lines[i - 1] || ''].join(' ');
    const dateMatch = searchWindow.match(/(\d{1,2}\/\w{3,}\/\d{2})/);
    const dueDate = dateMatch ? parseDueDate(dateMatch[1]) : null;

    // Extract period text — everything before the date in the search window
    let period = '';
    if (dateMatch) {
      const fullMatch = searchWindow.match(/((?:trimestre\s+)?[\wáéíóúñ]+(?:\s*[-–]\s*[\wáéíóúñ]+)?)\s*:\s*\d{1,2}\/\w+\/\d{2}/i);
      if (fullMatch) {
        const rawPeriod = fullMatch[1].trim();
        period = `${rawPeriod}: ${dateMatch[1]}`;
      } else {
        period = dateMatch[1];
      }
    }

    // Extract amount if present — look for numbers like 1200, 1,200, 1200.00
    let amount = 0;
    const amountPattern = /\b(\d{1,3}(?:[,.]?\d{3})*(?:\.\d{2})?)\b/g;
    let amountMatch;
    const amounts = [];
    while ((amountMatch = amountPattern.exec(searchWindow)) !== null) {
      const val = parseFloat(amountMatch[1].replace(',', ''));
      // Skip the tribute code and barcode, only consider meaningful amounts
      if (val > 100 && amountMatch[1] !== tributeCode && amountMatch[1] !== barcode) {
        amounts.push(val);
      }
    }
    if (amounts.length > 0) {
      amount = amounts[amounts.length - 1];
    }

    if (!barcode || !dueDate) continue;

    results.push({
      barcode,
      tributeCode,
      description: TRIBUTE_DESCRIPTIONS[tributeCode] || tributeCode,
      period,
      dueDate,
      periodicity: TRIBUTE_PERIODICITY[tributeCode] || 'mensual',
      amount: tributeCode === '0510122' ? 0 : amount,
      conditional: tributeCode === '0510122'
    });
  }

  return results;
}

/**
 * Parses a Vector Fiscal RC-04A PDF buffer and returns structured obligation data.
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @returns {Promise<{obligations: Array, fiscalYear: number, rawText: string}>}
 */
async function parseVectorFiscalPDF(pdfBuffer) {
  const data = await pdfParse(pdfBuffer);
  const text = data.text;

  const obligations = extractPeriodAndDate(text);

  // Deduplicate by barcode (PDF might have repeated entries)
  const seen = new Set();
  const unique = obligations.filter(ob => {
    const key = ob.barcode;
    if (seen.has(key)) return false;
    seen.add(key);
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
  extractPeriodAndDate
};
