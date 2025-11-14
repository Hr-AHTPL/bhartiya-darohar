const PurchaseModel = require("../../models/purchase.model");
const medicineModel = require("../../models/medicineDetails.model");

// Get total number of purchase invoices
const getTotalPurchases = async (req, res) => {
  try {
    const totalPurchases = await PurchaseModel.countDocuments();
    res.status(200).json({ 
      success: true, 
      totalPurchases 
    });
  } catch (error) {
    console.error('Error fetching total purchases:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch total purchases' 
    });
  }
};

// Get current stock (total quantity of all medicines)
const getCurrentStock = async (req, res) => {
  try {
    const medicines = await medicineModel.find({}, { Quantity: 1 });
    
    // Sum up all quantities
    const currentStock = medicines.reduce((total, med) => {
      return total + (med.Quantity || 0);
    }, 0);
    
    res.status(200).json({ 
      success: true, 
      currentStock 
    });
  } catch (error) {
    console.error('Error fetching current stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch current stock' 
    });
  }
};

// Get closing stock (same as current stock for now)
const getClosingStock = async (req, res) => {
  try {
    const medicines = await medicineModel.find({}, { Quantity: 1 });
    
    const closingStock = medicines.reduce((total, med) => {
      return total + (med.Quantity || 0);
    }, 0);
    
    res.status(200).json({ 
      success: true, 
      closingStock 
    });
  } catch (error) {
    console.error('Error fetching closing stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch closing stock' 
    });
  }
};

module.exports = {
  getTotalPurchases,
  getCurrentStock,
  getClosingStock
};