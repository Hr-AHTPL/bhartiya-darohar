const express = require('express');
const { createPurchase, viewPurchases, generatePurchaseReport } = require('../../controllers/web/purchaseController');
const purchaseRouter = express.Router();

purchaseRouter.post('/record', createPurchase);
purchaseRouter.get('/view', viewPurchases);
purchaseRouter.get('/report', generatePurchaseReport); 

module.exports = purchaseRouter;