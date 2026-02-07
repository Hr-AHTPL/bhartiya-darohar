const mongoose = require('mongoose');

const billCounterSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true,
    // Stores the financial year start year (e.g., 2025 for FY 2025-26)
  },
  saleCounter: {
    type: Number,
    default: 0
  },
  consultationCounter: {
    type: Number,
    default: 0
  },
  therapyCounter: {
    type: Number,
    default: 0
  },
  prakritiCounter: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const BillCounter = mongoose.model('BillCounter', billCounterSchema);

module.exports = BillCounter;