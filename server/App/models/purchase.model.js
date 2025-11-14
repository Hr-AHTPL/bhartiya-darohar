const mongoose = require("mongoose");

const medicineItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  batchNumber: { type: String, required: true },
  hsn: { type: String, required: true },
  expiryDate: { type: String, required: true }, // ✅ Changed from Date to String
  quantity: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  gstPercent: { type: Number, required: true },
  total: { type: Number, required: true },
});

const purchaseSchema = new mongoose.Schema({
  billingDate: { type: Date, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  supplierName: { type: String, required: true },
  supplierAddress: { type: String, required: true },
  supplierContact: { type: String, required: true },
  supplierGST: { type: String, required: true },
  medicines: [medicineItemSchema],
  grandTotal: { type: Number, required: true },
}, {
  timestamps: true // ✅ Adds createdAt and updatedAt fields
});

const PurchaseModel = mongoose.model("Purchase", purchaseSchema);
module.exports = PurchaseModel;