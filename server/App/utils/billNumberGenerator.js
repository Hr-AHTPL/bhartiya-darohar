const BillCounter = require('../models/billCounter.model');

/**
 * Returns the financial year start year for a given date.
 * FY starts on April 13 each year.
 *   Jan 1  – Apr 12  → previous year's FY  (e.g. 2026-04-01 → FY 2025)
 *   Apr 13 – Dec 31  → current year's FY   (e.g. 2026-04-13 → FY 2026)
 */
function getFinancialYearStart(date) {
  const month = date.getMonth(); // 0 = Jan
  const day   = date.getDate();
  const year  = date.getFullYear();
  if (month < 3 || (month === 3 && day < 13)) {
    return year - 1;
  }
  return year;
}

/**
 * Generates unique bill numbers with letter prefixes.
 * Format: BD/YYYY-YY/[M|C|T|P]/0001
 *   M = Medicine (Sales)
 *   C = Consultation
 *   T = Therapy
 *   P = Prakriti
 *
 * Financial year runs April 13 – April 12.
 */
async function generateBillNumber(type) {
  try {
    const currentDate        = new Date();
    const financialYearStart = getFinancialYearStart(currentDate);
    const financialYearEnd   = financialYearStart + 1;
    const yearSuffix         = `${financialYearStart}-${String(financialYearEnd).slice(-2)}`;

    // Find or create counter for this financial year
    let counter = await BillCounter.findOne({ year: financialYearStart });

    if (!counter) {
      console.log(`⚠️  Creating new counter for financial year ${yearSuffix}`);
      counter = new BillCounter({
        year:                financialYearStart,
        saleCounter:         0,
        consultationCounter: 0,
        therapyCounter:      0,
        prakritiCounter:     0,
      });
    }

    let counterValue;
    let letterPrefix;

    switch (type) {
      case 'sale':
        counter.saleCounter += 1;
        counterValue = counter.saleCounter;
        letterPrefix = 'M';
        break;
      case 'consultation':
        counter.consultationCounter += 1;
        counterValue = counter.consultationCounter;
        letterPrefix = 'C';
        break;
      case 'therapy':
        counter.therapyCounter += 1;
        counterValue = counter.therapyCounter;
        letterPrefix = 'T';
        break;
      case 'prakriti':
        counter.prakritiCounter += 1;
        counterValue = counter.prakritiCounter;
        letterPrefix = 'P';
        break;
      default:
        throw new Error(`Invalid bill type: ${type}. Must be one of: sale, consultation, therapy, prakriti`);
    }

    await counter.save();

    const billNumber = `BD/${yearSuffix}/${letterPrefix}/${String(counterValue).padStart(4, '0')}`;
    console.log(`✅ Generated ${type} bill: ${billNumber} (Counter: ${counterValue})`);
    return billNumber;

  } catch (error) {
    console.error(`❌ Error generating bill number for ${type}:`, error);
    throw error;
  }
}

/**
 * Preview the next bill number without incrementing the counter.
 */
async function previewNextBillNumber(type) {
  try {
    const currentDate        = new Date();
    const financialYearStart = getFinancialYearStart(currentDate);
    const financialYearEnd   = financialYearStart + 1;
    const yearSuffix         = `${financialYearStart}-${String(financialYearEnd).slice(-2)}`;

    let counter = await BillCounter.findOne({ year: financialYearStart });
    if (!counter) {
      counter = { saleCounter: 0, consultationCounter: 0, therapyCounter: 0, prakritiCounter: 0 };
    }

    let nextValue;
    let letterPrefix;

    switch (type) {
      case 'sale':         nextValue = counter.saleCounter + 1;         letterPrefix = 'M'; break;
      case 'consultation': nextValue = counter.consultationCounter + 1; letterPrefix = 'C'; break;
      case 'therapy':      nextValue = counter.therapyCounter + 1;      letterPrefix = 'T'; break;
      case 'prakriti':     nextValue = counter.prakritiCounter + 1;     letterPrefix = 'P'; break;
      default:
        throw new Error(`Invalid bill type: ${type}`);
    }

    return `BD/${yearSuffix}/${letterPrefix}/${String(nextValue).padStart(4, '0')}`;

  } catch (error) {
    console.error(`Error previewing next bill number for ${type}:`, error);
    throw error;
  }
}

/**
 * Get current counter status for the active financial year.
 */
async function getCounterStatus() {
  try {
    const currentDate        = new Date();
    const financialYearStart = getFinancialYearStart(currentDate);

    const counter = await BillCounter.findOne({ year: financialYearStart });
    if (!counter) {
      return { year: financialYearStart, saleCounter: 0, consultationCounter: 0, therapyCounter: 0, prakritiCounter: 0 };
    }

    return {
      year:                counter.year,
      saleCounter:         counter.saleCounter,
      consultationCounter: counter.consultationCounter,
      therapyCounter:      counter.therapyCounter,
      prakritiCounter:     counter.prakritiCounter,
    };

  } catch (error) {
    console.error('Error getting counter status:', error);
    throw error;
  }
}

module.exports = {
  generateBillNumber,
  previewNextBillNumber,
  getCounterStatus,
  getFinancialYearStart,
};
