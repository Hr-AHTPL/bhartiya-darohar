const express = require('express');
const { 
  getTotalPurchases, 
  getCurrentStock, 
  getClosingStock 
} = require('../../controllers/web/statsController');

const statsRouter = express.Router();

// Get total purchases count
statsRouter.get('/purchases/total', getTotalPurchases);

// Get current stock total
statsRouter.get('/stock/current', getCurrentStock);

// Get closing stock total
statsRouter.get('/stock/closing', getClosingStock);

module.exports = statsRouter;