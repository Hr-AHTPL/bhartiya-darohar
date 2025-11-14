let express = require("express");
const {
  patientDetailsInsert,
  patientList,
  getLastPatient,
  exportLastPatientToExcel,
  exportLastPatientToPDF,
  exportPrescriptionFormToExcel,
  exportPrakritiCashReceipt,
  exportPatientMaster,
  updatePrakritiAmount,
  updateTherapy,
  exportPatientBillingMaster,
  exportRevenueReport,
  addVisit,
  getVisitsByPatientId,
  getLastVisit,
  exportMedicineStock,
  exportLowStock,
  exportPrakritiParikshanPatients,
  exportConsultationPatients,
  exportPatientsBySpeciality,
  exportTherapyReport,
  updateVisitPurposeWithAmount,
  exportPatientBillingById,
  prescriptionDone,
  exportBalanceReport,
  exportSponsorReport,
  exportDiscountWiseReport,
  importBulkPatientData,
  updatePatientDetails,
} = require("../../controllers/web/patientController");

let patientRouter = express.Router();
patientRouter.patch("/update/:id", updatePatientDetails);
patientRouter.post("/insert", patientDetailsInsert);
patientRouter.post("/addvisit", addVisit);
patientRouter.get("/view", patientList);
patientRouter.get("/last", getLastPatient);
patientRouter.get("/print", exportLastPatientToExcel);
patientRouter.get("/prescription/:id", exportPrescriptionFormToExcel);
patientRouter.get("/prakriti-registration/:id", exportPrakritiCashReceipt);
patientRouter.get("/patient-master", exportPatientMaster);
patientRouter.patch("/updateprakritiamount/:id", updatePrakritiAmount);
patientRouter.patch("/update-others/:id", updateVisitPurposeWithAmount);
patientRouter.patch("/updatetherapywithamount/:id", updateTherapy);
patientRouter.patch("/savePrescription", prescriptionDone);
patientRouter.get("/patient-billing-master", exportPatientBillingMaster);
patientRouter.get("/revenue-report", exportRevenueReport);
patientRouter.get("/patient-visits/:idno", getVisitsByPatientId);
patientRouter.get("/patient-last-visit/:idno", getLastVisit);
patientRouter.get("/current-stock", exportMedicineStock);
patientRouter.get("/low-stock", exportLowStock);
patientRouter.get("/prakriti-analysis", exportPrakritiParikshanPatients);
patientRouter.get("/consultation-analysis", exportConsultationPatients);
patientRouter.get("/disease-analysis", exportPatientsBySpeciality);
patientRouter.get("/therapy-analysis", exportTherapyReport);
patientRouter.get("/patient-wise-report", exportPatientBillingById);
patientRouter.get("/balance-report", exportBalanceReport);
patientRouter.get("/sponsor-report", exportSponsorReport);
patientRouter.get("/discount-report", exportDiscountWiseReport);
patientRouter.post("/import-bulk", importBulkPatientData); // Assuming this function is defined in the controller


module.exports = patientRouter;
