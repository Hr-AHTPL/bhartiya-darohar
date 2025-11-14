const express = require('express');
const { 
  getClosingStock, 
  updateClosingStock, 
  getAllClosingStocks 
} = require('../../controllers/web/closingStockController');

const closingStockRouter = express.Router();

closingStockRouter.get('/current', getClosingStock);
closingStockRouter.put('/update', updateClosingStock);
closingStockRouter.get('/history', getAllClosingStocks);

module.exports = closingStockRouter;