const mongoose = require('mongoose');

const closingStockSchema = new mongoose.Schema({
  year: { 
    type: Number, 
    required: true,
    unique: true 
  },
  closingStock: { 
    type: Number, 
    required: true,
    default: 0 
  },
  lastUpdatedBy: { 
    type: String,
    default: 'Admin'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const ClosingStockModel = mongoose.model('ClosingStock', closingStockSchema);
module.exports = ClosingStockModel;