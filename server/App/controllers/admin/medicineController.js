const medicineModel = require("../../models/medicineDetails.model");

// Insert New Medicine
const medicineInsert = (req, res) => {
  const { Code, "Product Name": ProductName, Unit, Company, Quantity, Price } = req.body;

  const medicine = new medicineModel({
    Code,
    "Product Name": ProductName,
    Unit,
    Company,
    Quantity,
    Price
  });

  medicine
    .save()
    .then(() => res.send({ status: 1, message: "Medicine added successfully" }))
    .catch((err) =>
      res.send({ status: 0, message: "Error while saving medicine", error: err.message })
    );
};

// View All Medicines
const medicineView = (req, res) => {
  medicineModel
    .find()
    .then((medicineList) => res.send({ status: 1, medicineList }))
    .catch((err) =>
      res.send({ status: 0, message: "Error while fetching medicines", error: err.message })
    );
};

// Delete Medicine by ID
const medicineDelete = (req, res) => {
  const code = req.params.code;  // get code from params

  medicineModel
    .deleteOne({ Code: code })   // delete where Code matches
    .then((result) => {
      if (result.deletedCount === 0) {
        // no medicine found with that code
        return res.send({ status: 0, message: "No medicine found with given code" });
      }
      res.send({ status: 1, message: "Medicine deleted successfully" });
    })
    .catch((err) =>
      res.send({ status: 0, message: "Error while deleting medicine", error: err.message })
    );
};


const medicineUpdate = (req, res) => {
  const code = Number(req.params.code); // Convert to number
  const { Code, "Product Name": ProductName, Unit, Company, Quantity, Price } = req.body;

  medicineModel
    .updateOne(
      { Code: code }, // Match numeric field
      {
        $set: {
          Code,
          "Product Name": ProductName,
          Unit,
          Company,
          Quantity,
          Price
        },
      }
    )
    .then((result) => {
      if (result.matchedCount === 0) {
        res.send({ status: 0, message: "No medicine found with that Code" });
      } else {
        res.send({ status: 1, message: "Medicine updated successfully" });
      }
    })
    .catch((err) =>
      res.send({ status: 0, message: "Error while updating medicine", error: err.message })
    );
};


module.exports = {
  medicineInsert,
  medicineView,
  medicineDelete,
  medicineUpdate
};
