const BillCounter = require('../models/billCounter.model');

/**
 * Generates unique bill numbers for different transaction types
 * @param {string} type - Type of transaction: 'sale', 'consultation', 'therapy', 'prakriti'
 * @returns {Promise<string>} - Bill number in format:
 *   - Sale: BD/YYYY-YY/M/NNNN (e.g., BD/2025-26/M/0001)
 *   - Consultation: BD/YYYY-YY/C/NNNN (e.g., BD/2025-26/C/0001)
 *   - Therapy: BD/YYYY-YY/T/NNNN (e.g., BD/2025-26/T/0001)
 *   - Prakriti: BD/YYYY-YY/P/NNNN (e.g., BD/2025-26/P/0001)
 */
async function generateBillNumber(type) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11 (Jan = 0, Dec = 11)
  const currentYear = currentDate.getFullYear();
  
  // Determine financial year
  let financialYearStart;
  if (currentMonth <= 2) { // Jan, Feb, Mar
    financialYearStart = currentYear - 1;
  } else { // Apr-Dec
    financialYearStart = currentYear;
  }
  
  const financialYearEnd = financialYearStart + 1;
  const yearSuffix = `${financialYearStart}-${String(financialYearEnd).slice(-2)}`;
  
  // Find or create counter for current financial year
  let counter = await BillCounter.findOne({ year: financialYearStart });
  
  if (!counter) {
    counter = new BillCounter({
      year: financialYearStart,
      saleCounter: 0,
      consultationCounter: 0,
      therapyCounter: 0,
      prakritiCounter: 0
    });
  }
  
  // Increment the appropriate counter and get the letter prefix
  let counterValue;
  let letterPrefix;
  
  switch(type) {
    case 'sale':
      counter.saleCounter += 1;
      counterValue = counter.saleCounter;
      letterPrefix = 'M'; // M for Medicine
      break;
    case 'consultation':
      counter.consultationCounter += 1;
      counterValue = counter.consultationCounter;
      letterPrefix = 'C'; // C for Consultation
      break;
    case 'therapy':
      counter.therapyCounter += 1;
      counterValue = counter.therapyCounter;
      letterPrefix = 'T'; // T for Therapy
      break;
    case 'prakriti':
      counter.prakritiCounter += 1;
      counterValue = counter.prakritiCounter;
      letterPrefix = 'P'; // P for Prakriti
      break;
    default:
      throw new Error(`Invalid bill type: ${type}`);
  }
  
  await counter.save();
  
  // Format bill number with letter prefix: BD/YYYY-YY/LETTER/NNNN
  const billNumber = `BD/${yearSuffix}/${letterPrefix}/${String(counterValue).padStart(4, '0')}`;
  
  return billNumber;
}

module.exports = { generateBillNumber };
