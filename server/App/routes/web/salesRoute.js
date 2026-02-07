const express = require('express');
const { 
  recordSale, 
  getAllSales, 
  getSaleById,
  updateSale,
  deleteSale,
  generateSaleReport 
} = require('../../controllers/web/saleController');

// ✅ Import your existing auth middleware (enhanced version)
const { ensureAuthenticated, ensureAdmin, attachUserRole } = require('../../middleware/auth');

const salesRouter = express.Router();

// Public/Basic routes (keep as they were)
salesRouter.post('/record', recordSale);
salesRouter.get('/view', getAllSales);
salesRouter.get('/report', generateSaleReport);
salesRouter.get('/:id', getSaleById);

// ✅ PROTECTED ROUTES WITH ROLE-BASED ACCESS

// UPDATE route - requires authentication, all authenticated users can update
salesRouter.put('/:id', ensureAuthenticated, attachUserRole, updateSale);

// DELETE route - requires authentication AND admin role
salesRouter.delete('/:id', ensureAuthenticated, ensureAdmin, deleteSale);

module.exports = salesRouter;