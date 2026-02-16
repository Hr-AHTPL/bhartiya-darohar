const BillCounter = require('../models/billCounter.model');

/**
 * UPDATED: Generates unique bill numbers with letter prefixes
 * Format: BD/YYYY-YY/[M|C|T|P]/0001
 * - M = Medicine (Sales)
 * - C = Consultation
 * - T = Therapy
 * - P = Prakriti
 */
async function generateBillNumber(type) {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculate financial year (Apr-Mar)
    let financialYearStart;
    if (currentMonth <= 2) { // Jan, Feb, Mar (months 0, 1, 2)
      financialYearStart = currentYear - 1;
    } else { // Apr-Dec (months 3-11)
      financialYearStart = currentYear;
    }
    
    const financialYearEnd = financialYearStart + 1;
    const yearSuffix = `${financialYearStart}-${String(financialYearEnd).slice(-2)}`;
    
    // Find or create counter for current financial year
    let counter = await BillCounter.findOne({ year: financialYearStart });
    
    if (!counter) {
      // Create new counter for new financial year
      console.log(`⚠️ Creating new counter for financial year ${yearSuffix}`);
      counter = new BillCounter({
        year: financialYearStart,
        saleCounter: 0,
        consultationCounter: 0,
        therapyCounter: 0,
        prakritiCounter: 0
      });
    }
    
    let counterValue;
    let letterPrefix;
    
    // Increment appropriate counter and set letter prefix
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
        throw new Error(`Invalid bill type: ${type}. Must be one of: sale, consultation, therapy, prakriti`);
    }
    
    // Save updated counter
    await counter.save();
    
    // Format: BD/2025-26/C/0001
    const billNumber = `BD/${yearSuffix}/${letterPrefix}/${String(counterValue).padStart(4, '0')}`;
    
    console.log(`✅ Generated ${type} bill: ${billNumber} (Counter: ${counterValue})`);
    
    return billNumber;
    
  } catch (error) {
    console.error(`❌ Error generating bill number for ${type}:`, error);
    throw error;
  }
}

/**
 * Get the next bill number without incrementing the counter
 * Useful for preview purposes
 */
async function previewNextBillNumber(type) {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let financialYearStart;
    if (currentMonth <= 2) {
      financialYearStart = currentYear - 1;
    } else {
      financialYearStart = currentYear;
    }
    
    const financialYearEnd = financialYearStart + 1;
    const yearSuffix = `${financialYearStart}-${String(financialYearEnd).slice(-2)}`;
    
    let counter = await BillCounter.findOne({ year: financialYearStart });
    
    if (!counter) {
      counter = { saleCounter: 0, consultationCounter: 0, therapyCounter: 0, prakritiCounter: 0 };
    }
    
    let nextValue;
    let letterPrefix;
    
    switch(type) {
      case 'sale':
        nextValue = counter.saleCounter + 1;
        letterPrefix = 'M';
        break;
      case 'consultation':
        nextValue = counter.consultationCounter + 1;
        letterPrefix = 'C';
        break;
      case 'therapy':
        nextValue = counter.therapyCounter + 1;
        letterPrefix = 'T';
        break;
      case 'prakriti':
        nextValue = counter.prakritiCounter + 1;
        letterPrefix = 'P';
        break;
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
 * Get current counter status
 */
async function getCounterStatus() {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let financialYearStart;
    if (currentMonth <= 2) {
      financialYearStart = currentYear - 1;
    } else {
      financialYearStart = currentYear;
    }
    
    const counter = await BillCounter.findOne({ year: financialYearStart });
    
    if (!counter) {
      return {
        year: financialYearStart,
        saleCounter: 0,
        consultationCounter: 0,
        therapyCounter: 0,
        prakritiCounter: 0
      };
    }
    
    return {
      year: counter.year,
      saleCounter: counter.saleCounter,
      consultationCounter: counter.consultationCounter,
      therapyCounter: counter.therapyCounter,
      prakritiCounter: counter.prakritiCounter
    };
    
  } catch (error) {
    console.error('Error getting counter status:', error);
    throw error;
  }
}

module.exports = { 
  generateBillNumber,
  previewNextBillNumber,
  getCounterStatus
};
