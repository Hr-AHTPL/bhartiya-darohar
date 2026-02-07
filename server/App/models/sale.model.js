const mongoose = require('mongoose');

const medicineSoldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  medicineName: { type: String, required: true },
  batch: { type: String },
  hsn: { type: String },
  expiry: { type: String },
  pricePerUnit: { type: Number, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const saleSchema = new mongoose.Schema({
  billNumber: { type: String, unique: true, required: true }, // ✅ NEW
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  saleDate: { type: String, required: true },
  medicines: { type: [medicineSoldSchema], required: true },
  subtotal: { type: Number, required: true },
  sgst: { type: Number, required: true },
  cgst: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountApprovedBy: { type: String },
  totalAmount: { type: Number, required: true },
});

const saleModel = mongoose.model('Sale', saleSchema);

module.exports = saleModel;