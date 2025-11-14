const express = require('express');
const { recordSale, getAllSales, generateSaleReport } = require('../../controllers/web/saleController'); // ✅ Add generateSaleReport

const salesRouter = express.Router();

salesRouter.post('/record', recordSale);
salesRouter.get('/view', getAllSales);
salesRouter.get('/report', generateSaleReport); // ✅ NEW ROUTE

module.exports = salesRouter;