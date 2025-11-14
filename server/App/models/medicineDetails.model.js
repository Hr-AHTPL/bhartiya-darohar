let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let medicineSchema = new Schema({
    Code: {
        type: Number,
        required: true
    },
    "Product Name": {
        type: String,
        required: true
    },
    Unit: {
        type: String,
        required: false
    },
    Company: {
        type: String,
        required: true
    },
    Quantity: {
        type: Number,
        required: true
    },
    Price: {
        type: Number,
        required: true
    },
    HSN: {
        type: String,
        required: false
    },
    batchNumber: {
        type: String,
        required: false
    },
    expiryDate: {
        type: String,
        required: false
    },
    rackNumber: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    shelfNumber: {
        type: String,
        required: false
    }
});

let medicineModel = mongoose.model('medicine', medicineSchema, 'medicine');
module.exports = medicineModel;
