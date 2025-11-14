const ClosingStockModel = require("../../models/closingStock.model");

// Get closing stock for current year
const getClosingStock = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const year = req.query.year || currentYear;
    
    let closingStock = await ClosingStockModel.findOne({ year: parseInt(year) });
    
    // If no record exists for this year, create one with 0
    if (!closingStock) {
      closingStock = new ClosingStockModel({
        year: parseInt(year),
        closingStock: 0,
        lastUpdatedBy: 'System'
      });
      await closingStock.save();
    }
    
    res.status(200).json({ 
      success: true, 
      data: closingStock 
    });
  } catch (error) {
    console.error('Error fetching closing stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch closing stock',
      error: error.message 
    });
  }
};

// Update closing stock for a year
const updateClosingStock = async (req, res) => {
  try {
    const { year, closingStock, lastUpdatedBy, notes } = req.body;
    
    if (!year || closingStock == null) {
      return res.status(400).json({ 
        success: false, 
        message: 'Year and closing stock value are required' 
      });
    }
    
    // Find and update or create new
    const updated = await ClosingStockModel.findOneAndUpdate(
      { year: parseInt(year) },
      { 
        closingStock: parseInt(closingStock),
        lastUpdatedBy: lastUpdatedBy || 'Admin',
        notes: notes || ''
      },
      { 
        new: true, 
        upsert: true // Create if doesn't exist
      }
    );
    
    console.log(`✅ Closing stock updated for year ${year}: ${closingStock}`);
    
    res.status(200).json({
      success: true,
      message: 'Closing stock updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('❌ Error updating closing stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update closing stock',
      error: error.message 
    });
  }
};

// Get all closing stock records (for history)
const getAllClosingStocks = async (req, res) => {
  try {
    const stocks = await ClosingStockModel.find().sort({ year: -1 });
    
    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    console.error('Error fetching all closing stocks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch closing stock history' 
    });
  }
};

module.exports = {
  getClosingStock,
  updateClosingStock,
  getAllClosingStocks
};