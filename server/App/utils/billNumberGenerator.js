const BillCounter = require('../models/billCounter.model');

/**
 * Generates unique bill numbers for different transaction types
 * Continues from current counters with letter prefixes
 */
async function generateBillNumber(type) {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let financialYearStart;
    if (currentMonth <= 2) { // Jan, Feb, Mar
      financialYearStart = currentYear - 1;
    } else { // Apr-Dec
      financialYearStart = currentYear;
    }
    
    const financialYearEnd = financialYearStart + 1;
    const yearSuffix = `${financialYearStart}-${String(financialYearEnd).slice(-2)}`;
    
    // Find existing counter (should already exist from migration)
    let counter = await BillCounter.findOne({ year: financialYearStart });
    
    if (!counter) {
      // This shouldn't happen since you already ran migration
      // But just in case, use the current values
      console.log(`⚠️ Counter not found, creating with current values`);
      counter = new BillCounter({
        year: financialYearStart,
        saleCounter: 1634,
        consultationCounter: 601,
        therapyCounter: 6,
        prakritiCounter: 6
      });
    }
    
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
    
    // Format bill number with letter prefix
    const billNumber = `BD/${yearSuffix}/${letterPrefix}/${String(counterValue).padStart(4, '0')}`;
    
    console.log(`✅ Generated ${type} bill: ${billNumber}`);
    
    return billNumber;
    
  } catch (error) {
    console.error(`❌ Error generating bill number for ${type}:`, error);
    throw error;
  }
}

module.exports = { generateBillNumber };
