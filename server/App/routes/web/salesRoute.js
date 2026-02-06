const express = require('express');
const { 
  recordSale, 
  getAllSales, 
  getSaleById,
  updateSale,
  deleteSale,
  generateSaleReport 
} = require('../../controllers/web/saleController');

const { ensureAuthenticated, ensureAdmin } = require('../../middleware/auth');

const salesRouter = express.Router();

// ✅ All users can record, view, and generate reports
salesRouter.post('/record', ensureAuthenticated, recordSale);
salesRouter.get('/view', ensureAuthenticated, getAllSales);
salesRouter.get('/report', ensureAuthenticated, generateSaleReport);
salesRouter.get('/:id', ensureAuthenticated, getSaleById);

// ✅ All authenticated users can update sales
salesRouter.put('/:id', ensureAuthenticated, updateSale);

// ✅ Only admin can delete sales
salesRouter.delete('/:id', ensureAdmin, deleteSale);

module.exports = salesRouter;
