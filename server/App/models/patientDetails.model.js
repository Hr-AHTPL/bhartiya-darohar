const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const patientSchema = new Schema({
  idno: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String }, // optional
  age: { type: Number, required: true }, 
  gender: { type: String, required: true },
  maritalStatus: { type: String }, // optional
  occupation: { type: String }, // optional
  phone: { type: Number, required: true },
  email: { type: String }, // optional
  aadharnum: { type: Number, unique: true, sparse: true }, // optional + unique needs `sparse`
  houseno: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  pin: { type: Number },
  medicalHistory: { type: String }, // optional
  emergencyContactName: { type: String }, // optional
  emergencyContactPhone: { type: Number }, // optional
}, { timestamps: true });

// Use a collection name appropriate to your use case (e.g., "Patient")
const patientModel = mongoose.model('Enquiry', patientSchema);
module.exports = patientModel;
