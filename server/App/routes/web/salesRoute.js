const express = require('express');
const { 
  recordSale, 
  getAllSales, 
  getSaleById,
  updateSale,
  deleteSale,
  generateSaleReport,
  downloadUpdatedBill // ✅ NEW
} = require('../../controllers/web/saleController');

const { ensureAuthenticated, ensureAdmin, attachUserRole } = require('../../middleware/auth');

const salesRouter = express.Router();

// Public/Basic routes
salesRouter.post('/record', recordSale);
salesRouter.get('/view', getAllSales);
salesRouter.get('/report', generateSaleReport);
salesRouter.get('/:id', getSaleById);

// ✅ PROTECTED ROUTES WITH ROLE-BASED ACCESS

// UPDATE route - requires authentication
salesRouter.put('/:id', ensureAuthenticated, attachUserRole, updateSale);

// ✅ NEW: Download updated bill - requires authentication
salesRouter.get('/:id/download-bill', ensureAuthenticated, downloadUpdatedBill);

// DELETE route - requires authentication AND admin role
salesRouter.delete('/:id', ensureAuthenticated, ensureAdmin, deleteSale);

module.exports = salesRouter;
