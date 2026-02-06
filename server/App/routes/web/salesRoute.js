const express = require('express');
const { 
  recordSale, 
  getAllSales, 
  getSaleById,
  updateSale,
  deleteSale,
  generateSaleReport 
} = require('../../controllers/web/saleController');

const salesRouter = express.Router();

salesRouter.post('/record', recordSale);
salesRouter.get('/view', getAllSales);
salesRouter.get('/report', generateSaleReport);
salesRouter.get('/:id', getSaleById); // ✅ NEW: Get single sale
salesRouter.put('/:id', updateSale); // ✅ NEW: Update sale
salesRouter.delete('/:id', deleteSale); // ✅ NEW: Delete sale

module.exports = salesRouter;
