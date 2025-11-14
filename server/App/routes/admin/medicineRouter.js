const express = require("express");
const { medicineInsert, medicineView, medicineDelete, medicineUpdate } = require("../../controllers/admin/medicineController");
const medicineRouter = express.Router();
// Insert a new medicine
medicineRouter.post("/insert", medicineInsert);

// View all medicines
medicineRouter.get("/view", medicineView);

// Delete a medicine by ID
medicineRouter.delete("/delete/:code", medicineDelete);

// Update a medicine by ID
medicineRouter.put("/update/:code", medicineUpdate);


module.exports = medicineRouter;
