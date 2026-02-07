const BillCounter = require('../models/billCounter.model');

/**
 * Generates unique bill numbers for different transaction types
 * @param {string} type - Type of transaction: 'sale', 'consultation', 'therapy', 'prakriti'
 * @returns {Promise<string>} - Bill number in format:
 *   - Sale: BD/YYYY-YY/M/NNNN (e.g., BD/2025-26/M/0001)
 *   - Others: BD/YYYY-YY/NNNN (e.g., BD/2025-26/0001)
 */
async function generateBillNumber(type) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11 (Jan = 0, Dec = 11)
  const currentYear = currentDate.getFullYear();
  
  // Determine financial year
  // If month is Jan-Mar (0-2), financial year started previous year
  // If month is Apr-Dec (3-11), financial year started this year
  let financialYearStart;
  if (currentMonth <= 2) { // Jan, Feb, Mar
    financialYearStart = currentYear - 1;
  } else { // Apr-Dec
    financialYearStart = currentYear;
  }
  
  const financialYearEnd = financialYearStart + 1;
  const yearSuffix = `${financialYearStart}-${String(financialYearEnd).slice(-2)}`; // e.g., "2025-26"
  
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
  
  // Increment the appropriate counter
  switch(type) {
    case 'sale':
      counter.saleCounter += 1;
      break;
    case 'consultation':
      counter.consultationCounter += 1;
      break;
    case 'therapy':
      counter.therapyCounter += 1;
      break;
    case 'prakriti':
      counter.prakritiCounter += 1;
      break;
    default:
      throw new Error(`Invalid bill type: ${type}`);
  }
  
  await counter.save();
  
  // Get the counter value for this type
  let counterValue;
  switch(type) {
    case 'sale':
      counterValue = counter.saleCounter;
      break;
    case 'consultation':
      counterValue = counter.consultationCounter;
      break;
    case 'therapy':
      counterValue = counter.therapyCounter;
      break;
    case 'prakriti':
      counterValue = counter.prakritiCounter;
      break;
  }
  
  // Format bill number based on type
  let billNumber;
  if (type === 'sale') {
    // Sale format: BD/2025-26/M/0001
    billNumber = `BD/${yearSuffix}/M/${String(counterValue).padStart(4, '0')}`;
  } else {
    // Consultation, Therapy, Prakriti format: BD/2025-26/0001
    billNumber = `BD/${yearSuffix}/${String(counterValue).padStart(4, '0')}`;
  }
  
  return billNumber;
}

module.exports = { generateBillNumber };
