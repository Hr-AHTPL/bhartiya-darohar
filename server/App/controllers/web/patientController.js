const patientModel = require("../../models/patientDetails.model");
const counterModel = require("../../models/counterDetails");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const visitModel = require("../../models/visitDetails.model");
const saleModel = require("../../models/sale.model");
const medicineModel = require("../../models/medicineDetails.model");

const exportPrescriptionFormToExcel = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Fetch patient details
    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res
        .status(404)
        .json({ message: `No patient found with ID: ${patientId}` });
    }

    // Fetch the last visit with all details
    const lastVisit = await visitModel
      .findOne({ patientId: patient._id })
      .sort({ createdAt: -1 });

    if (!lastVisit) {
      return res
        .status(404)
        .json({ message: "No last visit data found for patient" });
    }

    // Load the Excel template
    const templatePath = path.join(
      __dirname,
      "../../assets/patientPrescription.xlsx"
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet("Sheet1");
    if (!worksheet) {
      return res.status(400).json({ message: "Sheet 'Sheet1' not found" });
    }

    // =================== ONLY FILL PATIENT HEADER INFORMATION ===================
    // Patient Name (Column B, Row 4)
    worksheet.getCell("B3").value = `${patient.firstName} ${patient.lastName || ""}`.trim();
    
    // DATE (Column D, Row 4)
    worksheet.getCell("D3").value = lastVisit.date || new Date().toLocaleDateString('en-GB');
    
    // Age / Gender (Column B, Row 5)
    worksheet.getCell("B4").value = `${patient.age || ""} / ${patient.gender || ""}`;
    
    // Patient ID (Column D, Row 5)
    worksheet.getCell("D4").value = patient.idno || "";
    
    // Sponsored by (if any) (Column B, Row 6)
    worksheet.getCell("B5").value = lastVisit.sponsor || "";
    
    // BP/PULSE (Column D, Row 6) - LEFT BLANK to be filled physically
    // worksheet.getCell("D6").value = "";
    
    // Appointment To (Column B, Row 7)
    worksheet.getCell("B6").value = lastVisit.appointment || "";

    // =================== EVERYTHING BELOW IS LEFT BLANK ===================
    // Prakriti - Left blank to be filled physically by doctor
    // Clinical Notes - Left blank to be filled physically by doctor
    // Medicines Prescribed - Left blank to be filled physically by doctor
    // Panchakarma / Therapies - Left blank to be filled physically by doctor

    // =================== GENERATE AND SEND FILE ===================
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=prescription_${(patient.idno || "patient").replace(
        /[\\/]/g,
        "_"
      )}_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    res.send(buffer);
  } catch (err) {
    console.error("Error exporting prescription form:", err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

const exportPrakritiCashReceipt = async (req, res) => {
  try {
    const patientId = req.params.id;
    const {
      feeAmount,
      receivedAmount,
      purpose,
      therapyName,
      discount,
      approvalby,
    } = req.query;

    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const lastVisit = await visitModel
      .findOne({ patientId: patient._id })
      .sort({ createdAt: -1 });

    if (!lastVisit) {
      return res.status(404).json({ message: "No last visit found" });
    }

    const numericFee = Number(feeAmount);
    const numericReceived = Number(receivedAmount);
    const numericDiscount = Number(discount);
    const totalAfterDiscount =
      numericFee - (numericFee * numericDiscount) / 100;
    const balance = totalAfterDiscount - numericReceived;

    // === Update visit fields based on purpose ===
    if (purpose === "Consultation") {
      lastVisit.consultationamount = receivedAmount;
      lastVisit.balance.consultation = totalAfterDiscount - receivedAmount;

      lastVisit.discounts.consultation = {
        percentage: discount,
        approvedBy: approvalby,
      };
    } else if (purpose === "Prakriti Parikshan") {
      lastVisit.prakritiparikshanamount = receivedAmount;
      lastVisit.balance.prakritiparikshan = totalAfterDiscount - receivedAmount;

      lastVisit.discounts.prakritiparikshan = {
        percentage: discount,
        approvedBy: approvalby,
      };
    } else if (purpose === "Therapy") {
      // Push therapy discount and balance
      lastVisit.discounts.therapies.push({
        name: therapyName,
        percentage: discount,
        approvedBy: approvalby,
      });

      lastVisit.balance.therapies.push({
        name: therapyName,
        balance: totalAfterDiscount - receivedAmount,
      });
      lastVisit.therapyWithAmount.push({
        name: therapyName,
        receivedAmount: receivedAmount,
      });
    } else {
      // Others
      lastVisit.others = purpose;
      lastVisit.othersamount = totalAfterDiscount;

      lastVisit.discounts.others = {
        percentage: discount,
        approvedBy: approvalby,
      };

      lastVisit.balance.others.push({
        purpose,
        balance: totalAfterDiscount - receivedAmount,
      });
    }

    await lastVisit.save();

    // Load Excel Template
    const templatePath = path.join(
      __dirname,
      "../../assets/receiptGeneration.xlsx"
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet("Cash Receipt");

    if (!worksheet) {
      return res.status(400).json({ message: "Worksheet not found" });
    }

    // Set dynamic ID
    const phoneStr = String(patient.phone || "");
    const customID = `BD${(patient.firstName?.[0] || "").toUpperCase()}${(
      patient.lastName?.[0] || ""
    ).toUpperCase()}${phoneStr.slice(-3)}`;

    const date = new Date().toLocaleDateString();
    const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`;
    const address = `${patient.houseno || ""}, ${patient.city || ""}`;

    const updateCells = (cellMap) => {
      for (const [cell, value] of Object.entries(cellMap)) {
        worksheet.getCell(cell).value = value;
      }
    };

    const feeCellMap = {
      D5: `Cash Receipt for ${purpose || "Unknown Purpose"}`,
      D25: `Cash Receipt for ${purpose || "Unknown Purpose"}`,

      B6: patient.idno,
      B26: patient.idno,

      H6: lastVisit.date,
      H26: lastVisit.date,

      B7: fullName,
      B27: fullName,

      F7: patient.gender || "",
      F27: patient.gender || "",

      H7: patient.age || "",
      H27: patient.age || "",

      B8: address,
      B28: address,

      B9: patient.district || "",
      B29: patient.district || "",

      E9: patient.state || "",
      E29: patient.state || "",

      H9: patient.pin || "",
      H29: patient.pin || "",

      B10: patient.phone || "",
      B30: patient.phone || "",

      E10: numericFee,
      E30: numericFee,

      E11: numericDiscount,
      E31: numericDiscount,

      H11: approvalby,
      H31: approvalby,

      E12: totalAfterDiscount,
      E32: totalAfterDiscount,

      E13: numericReceived,
      E33: numericReceived,

      E14: balance,
      E34: balance,

      // Optional display for therapy name
      A18:
        purpose === "Therapy" && therapyName ? therapyName.toUpperCase() : "",
      A38:
        purpose === "Therapy" && therapyName ? therapyName.toUpperCase() : "",
    };

    updateCells(feeCellMap);

    // Send file to client
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `cash_receipt_${customID}_amount_${numericFee}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting cash receipt:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const prescriptionDone = async (req, res) => {
  const {
    visitId,
    observation,
    medicines,
    therapies,
    rogParikshan,
    nadiParikshaFindings,
    knownCaseOf,
    otherObservations,
  } = req.body;

  try {
    const visit = await visitModel.findByIdAndUpdate(
      visitId,
      {
        observation,
        medicines,
        therapies,
        rogParikshan: {
          stool: rogParikshan?.stool || "",
          urine: rogParikshan?.urine || "",
          appetite: rogParikshan?.appetite || "",
          sleep: rogParikshan?.sleep || "",
          tongue: rogParikshan?.tongue || "",
        },
        nadiParikshaFindings,
        knownCaseOf,
        otherObservations,
        status: "done",
      },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({
        status: 0,
        message: "Visit not found",
      });
    }

    res.status(200).json({
      status: 1,
      message: "Prescription updated successfully",
      visit,
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: "Error updating prescription",
      error: err.message,
    });
  }
};

const updateTherapy = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { therapyname, therapyamount } = req.body;

    if (!therapyname || !therapyamount) {
      return res.status(400).json({
        status: 0,
        message: "therapyname and therapyamount are required",
      });
    }

    const lastVisit = await visitModel
      .findOne({ patientId })
      .sort({ createdAt: -1 });

    if (!lastVisit) {
      return res.status(404).json({
        status: 0,
        message: "Last visit not found",
      });
    }

    lastVisit.therapyname = therapyname.trim();
    lastVisit.therapyamount = parseFloat(therapyamount);
    await lastVisit.save();

    res.json({
      status: 1,
      message: "Therapy details updated successfully",
      updatedVisit: lastVisit,
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: "Error updating therapy details",
      error: err.message,
    });
  }
};
// const axios = require("axios"); // If you're using internal request or move to DB query directly
const updateVisitPurposeWithAmount = async (req, res) => {
  const { id: patientId } = req.params;
  const { purpose, amount } = req.body;

  try {
    const lastVisit = await visitModel
      .findOne({ patientId })
      .sort({ createdAt: -1 });

    if (!lastVisit || !lastVisit._id) {
      return res
        .status(404)
        .json({ success: false, message: "Latest visit not found" });
    }

    lastVisit.others = purpose;
    lastVisit.othersamount = amount;
    await lastVisit.save();

    res.json({ success: true, data: lastVisit });
  } catch (error) {
    console.error("Error updating visit purpose:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update visit with custom purpose",
      error: error.message,
    });
  }
};
const updatePrakritiAmount = async (req, res) => {
  const { id: patientId } = req.params;

  try {
    const lastVisit = await visitModel
      .findOne({ patientId })
      .sort({ createdAt: -1 });

    if (!lastVisit || !lastVisit._id) {
      return res
        .status(404)
        .json({ success: false, message: "No last visit found" });
    }

    lastVisit.prakritiparikshanamount = 3000;
    await lastVisit.save();

    res.json({ success: true, data: lastVisit });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating prakriti parikshan amount",
      error: error.message,
    });
  }
};

const exportLastPatientToExcel = async (req, res) => {
  try {
    const patient = await patientModel.findOne().sort({ _id: -1 });
    if (!patient) {
      return res.status(404).json({ message: "No patient found" });
    }

    const templatePath = path.join(
      __dirname,
      "../../assets/patientRegistration.xlsx"
    );

    // Read file buffer and load into workbook
    const templateBuffer = fs.readFileSync(templatePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(templateBuffer);

    const worksheet = workbook.getWorksheet("Sheet1");
    if (!worksheet) {
      return res.status(400).json({
        message: "Sheet 'Sheet1' not found in template",
      });
    }

    const fields = {
      5: `${patient.firstName || ""} ${patient.lastName || ""}`,
      6: patient.gender || "",
      7: patient.age || "",
      8: patient.phone || "",
      9: patient.email || "",
      10: new Date().toLocaleDateString(),
      11: new Date().toLocaleTimeString(),
      12: patient.district || "",
      13: `${patient.city || ""} / ${patient.state || ""} / ${
        patient.pin || ""
      }`,
      14: patient.occupation || "",
      15: patient.maritalStatus || "",
      16: `Name: ${patient.emergencyContactName || ""}, Phone: ${
        patient.emergencyContactPhone || ""
      }`,
      17: patient.aadharnum || "",
      18: patient.sponsor || "",
    };

    for (const [rowNumber, value] of Object.entries(fields)) {
      worksheet.getCell(`B${rowNumber}`).value = value;
    }

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=exported_patient.xlsx"
    );

    // Stream workbook directly to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error exporting last patient:", err);
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

const patientDetailsInsert = async (req, res) => {
  try {
    const formattedDate = req.body.date;

    const {
      firstName,
      lastName,
      age,
      gender,
      maritalStatus,
      occupation,
      phone,
      email,
      aadharnum,
      houseno,
      city,
      state,
      district,
      pin,
      emergencyContactName,
      emergencyContactPhone,
      appointment,
      department,
      medicalHistory,
      sponsor,
      consultationamount = 0,
      prakritiparikshanamount = 0,
      others = "",
      othersamount = 0,
      discounts = {},
      rogParikshan = {},
      nadiParikshaFindings = "",
      knownCaseOf = "",
      otherObservations = "",
      balance = {},
    } = req.body;

    // ✅ Uniqueness check FIRST
    const duplicatePatient = await patientModel.findOne({
      firstName,
      lastName,
      phone,
    });

    if (duplicatePatient) {
      return res.status(409).send({
        status: 0,
        message:
          "Patient already registered. Found in patient management. Please schedule a reappointment.",
        existingPatientId: duplicatePatient.idno,
      });
    }

    const query = { $or: [] };
    if (aadharnum) query.$or.push({ aadharnum });
    if (email) query.$or.push({ email });

    let patient = null;
    if (query.$or.length > 0) {
      patient = await patientModel.findOne(query);
    }

    let savedPatient = patient;

    if (!patient) {
      // ✅ NOW generate counter and ID
      const counter = await counterModel.findOneAndUpdate(
        { name: "patient_id_counter" },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      const nextId = counter.value;
      const customId = `BD/N/C50/${nextId}`;

      const patientData = {
        idno: customId,
        firstName,
        age,
        gender,
        phone,
        houseno,
        city,
        state,
        district,
      };

      if (lastName) patientData.lastName = lastName;
      if (maritalStatus) patientData.maritalStatus = maritalStatus;
      if (occupation) patientData.occupation = occupation;
      if (email) patientData.email = email;
      if (aadharnum) patientData.aadharnum = aadharnum;
      if (medicalHistory) patientData.medicalHistory = medicalHistory;
      if (emergencyContactName)
        patientData.emergencyContactName = emergencyContactName;
      if (emergencyContactPhone)
        patientData.emergencyContactPhone = emergencyContactPhone;
      if (pin) patientData.pin = pin;

      savedPatient = new patientModel(patientData);
      await savedPatient.save();
    }

    const visitData = {
      patientId: savedPatient._id,
      date: formattedDate,
      appointment,
      consultationamount,
      prakritiparikshanamount,
      therapies: [],
      therapyWithAmount: [],
      medicines: [],
      others,
      othersamount,
      observation: "",
      status: "pending",
      discounts: {
        consultation: discounts.consultation || {},
        prakritiparikshan: discounts.prakritiparikshan || {},
        therapies: Array.isArray(discounts.therapies)
          ? discounts.therapies
          : [],
        others: discounts.others || {},
      },
      rogParikshan: {
        stool: rogParikshan.stool || "",
        urine: rogParikshan.urine || "",
        appetite: rogParikshan.appetite || "",
        sleep: rogParikshan.sleep || "",
        tongue: rogParikshan.tongue || "",
      },
      nadiParikshaFindings,
      knownCaseOf,
      otherObservations,
      balance: {
        consultation: balance.consultation || 0,
        prakritiparikshan: balance.prakritiparikshan || 0,
        therapies: Array.isArray(balance.therapies) ? balance.therapies : [],
        others: Array.isArray(balance.others) ? balance.others : [],
      },
    };

    if (department) visitData.department = department;
    if (sponsor) visitData.sponsor = sponsor;

    const visit = new visitModel(visitData);
    await visit.save();

    res.send({
      status: 1,
      message: "Patient visit recorded successfully",
      idno: savedPatient.idno,
    });
  } catch (err) {
    res.send({
      status: 0,
      message: "Error while saving patient/visit",
      error: err.message,
    });
  }
};

const addVisit = async (req, res) => {
  try {
    const {
      idno,
      appointment,
      department,
      sponsor,
      consultationamount = 0,
      prakritiparikshanamount = 0,
      others = "",
      othersamount = 0,
      discounts = {},
      rogParikshan = {},
      nadiParikshaFindings = "",
      knownCaseOf = "",
      otherObservations = "",
      balance = {},
      date,
    } = req.body;

    if (!idno || !appointment || !date) {
      return res.status(400).json({
        status: 0,
        message: "Missing required fields: idno, appointment, or date",
      });
    }

    const patient = await patientModel.findById(idno);
    if (!patient) {
      return res.status(404).json({
        status: 0,
        message: "Patient not found with provided ID",
      });
    }

    const visitData = {
      patientId: patient._id,
      date,
      appointment,
      consultationamount,
      prakritiparikshanamount,
      therapies: [],
      therapyWithAmount: [],
      medicines: [],
      others,
      othersamount,
      observation: "",
      status: "pending",
      discounts: {
        consultation: discounts.consultation || {},
        prakritiparikshan: discounts.prakritiparikshan || {},
        therapies: Array.isArray(discounts.therapies)
          ? discounts.therapies
          : [],
        others: discounts.others || {},
      },
      rogParikshan: {
        stool: rogParikshan.stool || "",
        urine: rogParikshan.urine || "",
        appetite: rogParikshan.appetite || "",
        sleep: rogParikshan.sleep || "",
        tongue: rogParikshan.tongue || "",
      },
      nadiParikshaFindings,
      knownCaseOf,
      otherObservations,
      balance: {
        consultation: balance.consultation || 0,
        prakritiparikshan: balance.prakritiparikshan || 0,
        therapies: Array.isArray(balance.therapies) ? balance.therapies : [],
        others: Array.isArray(balance.others) ? balance.others : [],
      },
    };

    // Add optional fields if provided
    if (department) visitData.department = department;
    if (sponsor) visitData.sponsor = sponsor;

    const newVisit = new visitModel(visitData);
    await newVisit.save();

    return res.status(200).json({
      status: 1,
      message: "Visit added successfully",
      visitId: newVisit._id,
      patientId: patient._id,
    });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: "Error adding visit",
      error: err.message,
    });
  }
};


const getVisitsByPatientId = async (req, res) => {
  try {
    const { idno } = req.params;

    // Step 1: Find patient
    const patient = await patientModel.findById(idno);

    if (!patient) {
      return res.status(404).json({
        status: 0,
        message: "Patient not found with provided ID",
      });
    }

    // Step 2: Fetch all visits for that patient
    const visits = await visitModel
      .find({ patientId: patient._id })
      .sort({ date: -1 });

    return res.status(200).json({
      status: 1,
      message: "Visits fetched successfully",
      data: visits,
    });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: "Error fetching visits",
      error: err.message,
    });
  }
};

const getLastVisit = async (req, res) => {
  try {
    const { idno } = req.params;

    if (!idno) {
      return res.status(400).json({
        status: 0,
        message: "Patient ID (idno) is required",
      });
    }

    // Find patient by idno
    const patient = await patientModel.findById(idno);

    if (!patient) {
      return res.status(404).json({
        status: 0,
        message: "Patient not found",
      });
    }

    // Find last visit using createdAt timestamp
    const lastVisit = await visitModel
      .findOne({ patientId: patient._id })
      .sort({ createdAt: -1 });

    if (!lastVisit) {
      return res.status(404).json({
        status: 0,
        message: "No visits found for this patient",
      });
    }

    res.status(200).json({
      status: 1,
      message: "Last visit fetched successfully",
      lastVisit,
    });
  } catch (error) {
    res.status(500).json({
      status: 0,
      message: "Error fetching last visit",
      error: error.message,
    });
  }
};

const patientList = async (req, res) => {
  const enquiry = await patientModel.find();
  res.send({ status: 1, enquiryList: enquiry });
};

const exportPatientMaster = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999); // Include end of day

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    // Step 1: Fetch patient list
    const enquiryList = await patientModel.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Patient Master");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 20 },
      { header: "Name", key: "name", width: 25 },
      { header: "Sex", key: "gender", width: 10 },
      { header: "Age", key: "age", width: 10 },
      { header: "House No", key: "houseno", width: 25 },
      { header: "City", key: "city", width: 15 },
      { header: "District", key: "district", width: 20 },
      { header: "State", key: "state", width: 15 },
      { header: "Pin", key: "pin", width: 10 },
      { header: "Aadhar number", key: "aadharnum", width: 20 },
      { header: "Mobile", key: "phone", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Date", key: "visitDate", width: 20 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FF000000" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD700" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.columns.forEach((col) => {
      col.alignment = { horizontal: "left" };
    });

    // Step 2: Add unique patients per visit date
    const uniquePatientVisitDates = new Set();

    for (const patient of enquiryList) {
      try {
        const visits = await visitModel
          .find({ patientId: patient._id })
          .sort({ date: -1 });

        for (const visit of visits) {
          if (!visit.date) continue;
          const visitDateObj = parseDDMMYYYY(visit.date);
          if (visitDateObj >= fromDate && visitDateObj <= toDate) {
            const key = `${patient._id}_${visit.date}`;
            if (uniquePatientVisitDates.has(key)) continue;

            uniquePatientVisitDates.add(key);

            worksheet.addRow({
              idno: patient.idno || "",
              name: `${patient.firstName?.trim() || ""} ${
                patient.lastName?.trim() || ""
              }`.trim(),
              gender: patient.gender || "",
              age: patient.age || "",
              houseno: patient.houseno || "",
              city: patient.city || "",
              district: patient.district || "",
              state: patient.state || "",
              pin: patient.pin || "",
              aadharnum: patient.aadharnum?.toString().padStart(12, "0") || "",
              phone: patient.phone || "",
              email: patient.email || "",
              visitDate: visit.date,
            });
          }
        }
      } catch (err) {
        console.error(
          `Error fetching visits for patient ${patient._id}: ${err.message}`
        );
      }
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PatientMaster.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting patient master:", error.message);
    res
      .status(500)
      .json({ message: "Failed to export Excel", error: error.message });
  }
};
const exportPatientBillingMaster = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    const enquiryList = await patientModel.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Patient Summary");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Age", key: "age", width: 10 },
      { header: "Sex", key: "gender", width: 10 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "Aadhar No.", key: "aadharnum", width: 20 },
      { header: "Consultation Amount", key: "consultationamount", width: 20 },
      {
        header: "Prakriti Parikshan Amount",
        key: "prakritiparikshanamount",
        width: 25,
      },
      { header: "Therapy Amount", key: "therapyamount", width: 18 },
      { header: "Total Amount", key: "totalamount", width: 18 },
      { header: "Therapy Name", key: "therapyname", width: 40 },
      { header: "Date", key: "date", width: 15 },
      { header: "Sponsor", key: "sponsor", width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FF000000" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD700" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.columns.forEach((col) => {
      col.alignment = { horizontal: "left" };
    });

    for (const patient of enquiryList) {
      try {
        const visits = await visitModel
          .find({ patientId: patient._id })
          .sort({ date: -1 });

        visits.forEach((visit) => {
          if (!visit.date) return;

          const visitDate = parseDDMMYYYY(visit.date);
          visitDate.setHours(0, 0, 0, 0);
          fromDate.setHours(0, 0, 0, 0);
          toDate.setHours(23, 59, 59, 999);

          if (
            visitDate.getTime() >= fromDate.getTime() &&
            visitDate.getTime() <= toDate.getTime()
          ) {
            const consultation = Number(visit.consultationamount) || 0;
            const prakriti = Number(visit.prakritiparikshanamount) || 0;

            const therapyWithAmountArray = Array.isArray(
              visit.therapyWithAmount
            )
              ? visit.therapyWithAmount
              : [];

            const therapy = therapyWithAmountArray.reduce(
              (sum, t) => sum + (Number(t.receivedAmount) || 0),
              0
            );

            const therapyNames = therapyWithAmountArray
              .map((t) => t.name)
              .join(", ");

            const total = consultation + prakriti + therapy;

            worksheet.addRow({
              idno: patient.idno || "",
              name: `${patient.firstName || ""} ${
                patient.lastName || ""
              }`.trim(),
              age: patient.age || "",
              gender: patient.gender || "",
              phone: patient.phone || "",
              aadharnum:
                `${patient.aadharnum?.toString().padStart(12, "0")}` || "",
              consultationamount: consultation,
              prakritiparikshanamount: prakriti,
              therapyamount: therapy,
              totalamount: total,
              therapyname: therapyNames,
              date: visit.date,
              sponsor: visit.sponsor || "",
            });
          }
        });
      } catch (err) {
        console.error(`Visit fetch failed for ${patient._id}:`, err.message);
      }
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PatientSummary.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting patient Summary:", error.message);
    res.status(500).json({
      message: "Failed to export Excel",
      error: error.message,
    });
  }
};

const exportPatientBillingById = async (req, res) => {
  try {
    const { patientId, dateFrom, dateTo } = req.query;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    fromDate.setHours(0, 0, 0, 0);

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    const selectedPatient = await patientModel.findOne({ idno: patientId });

    if (!selectedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const visits = await visitModel
      .find({ patientId: selectedPatient._id })
      .sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Patient Report");

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Consultation Amount", key: "consultationamount", width: 20 },
      {
        header: "Prakriti Parikshan Amount",
        key: "prakritiparikshanamount",
        width: 25,
      },
      { header: "Therapy Amount", key: "therapyamount", width: 18 },
      { header: "Total Amount", key: "totalamount", width: 18 },
      { header: "Therapy Name", key: "therapyname", width: 40 },
      { header: "Sponsor", key: "sponsor", width: 20 },
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: "FF000000" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD700" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Loop over visits
    visits.forEach((visit) => {
      if (!visit.date) return;

      const visitDate = parseDDMMYYYY(visit.date);
      visitDate.setHours(0, 0, 0, 0);

      if (
        visitDate.getTime() >= fromDate.getTime() &&
        visitDate.getTime() <= toDate.getTime()
      ) {
        const consultation = Number(visit.consultationamount) || 0;
        const prakriti = Number(visit.prakritiparikshanamount) || 0;

        const therapyWithAmountArray = Array.isArray(visit.therapyWithAmount)
          ? visit.therapyWithAmount
          : [];

        const therapyAmount = therapyWithAmountArray.reduce(
          (sum, t) => sum + Number(t.receivedAmount || 0),
          0
        );

        const therapyNames = therapyWithAmountArray
          .map((t) => t.name)
          .join(", ");

        const total = consultation + prakriti + therapyAmount;

        const addedRow = worksheet.addRow({
          date: visit.date,
          consultationamount: consultation,
          prakritiparikshanamount: prakriti,
          therapyamount: therapyAmount,
          totalamount: total,
          therapyname: therapyNames,
          sponsor: visit.sponsor || "",
        });

        addedRow.eachCell((cell) => {
          cell.alignment = { horizontal: "left" };
        });
      }
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=PatientBilling_${patientId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting patient billing by ID:", error.message);
    res.status(500).json({
      message: "Failed to export Excel",
      error: error.message,
    });
  }
};

const getLastPatient = async (req, res) => {
  try {
    const latestPatient = await patientModel.findOne().sort({ _id: -1 });
    if (!latestPatient) {
      return res.status(404).json({ status: 0, message: "No patient found" });
    }
    return res.status(200).json({ status: 1, patient: latestPatient });
  } catch (err) {
    return res
      .status(500)
      .json({ status: 0, message: "Server error", error: err.message });
  }
};

const exportRevenueReport = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res
        .status(400)
        .json({ message: "Missing dateFrom or dateTo in query params" });
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    // ----------------- 1. Fetch patient enquiries -----------------
    const enquiryList = await patientModel.find();

    let consultationSum = 0;
    let therapySum = 0;
    let otherServicesSum = 0;

    for (const patient of enquiryList) {
      try {
        const visits = await visitModel.find({ patientId: patient._id });

        visits.forEach((visit) => {
          if (!visit.date) return;

          const visitDate = parseDDMMYYYY(visit.date);
          if (visitDate >= fromDate && visitDate <= toDate) {
            consultationSum += Number(visit.consultationamount || 0);
            otherServicesSum += Number(visit.prakritiparikshanamount || 0);

            // ✅ New logic: Sum therapy amounts from therapies array
            if (Array.isArray(visit.therapyWithAmount)) {
              therapySum += visit.therapyWithAmount.reduce(
                (sum, t) => sum + Number(t.receivedAmount || 0),
                0
              );
            }
          }
        });
      } catch (err) {
        console.error(
          `Error fetching visits for patient ${patient._id}:`,
          err.message
        );
      }
    }

    // ----------------- 2. Fetch medicine sales -----------------
    const sales = await saleModel.find();

    const filteredSales = sales.filter((sale) => {
      const saleDate = new Date(sale.saleDate);
      return saleDate >= fromDate && saleDate <= toDate;
    });

    const medicineSum = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount || 0),
      0
    );

    const totalRevenue =
      consultationSum + therapySum + otherServicesSum + medicineSum;

    // ----------------- 3. Generate Excel -----------------
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Revenue Report");

    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 35;
    worksheet.getColumn(3).width = 20;

    worksheet.mergeCells("B1:C1");
    const titleCell = worksheet.getCell("B1");
    titleCell.value = `Revenue Report (${dateFrom} to ${dateTo})`;
    titleCell.font = { bold: true, size: 14, underline: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.addRow(["S.NO", "Source of Income", "Amount (INR)"]);
    worksheet.addRow(["1", "Consultation Fees", consultationSum]);
    worksheet.addRow(["2", "Medicine Sales", medicineSum]);
    worksheet.addRow(["3", "Panchakarma Treatments", therapySum]);
    worksheet.addRow(["4", "Prakriti Parikshans", otherServicesSum]);
    worksheet.addRow(["", "Total Revenue", totalRevenue]);

    const headerRow = worksheet.getRow(2);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCE5FF" },
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center" };
    });

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 2) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=RevenueReport.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting revenue report:", error);
    res
      .status(500)
      .json({ message: "Failed to export Excel", error: error.message });
  }
};

const exportMedicineStock = async (req, res) => {
  try {
    const medicines = await medicineModel.find();

    const sortedList = medicines.sort((a, b) => {
      const codeA = isNaN(a.Code) ? a.Code.toString() : Number(a.Code);
      const codeB = isNaN(b.Code) ? b.Code.toString() : Number(b.Code);
      return codeA > codeB ? 1 : -1;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Medicine Stock");

    worksheet.columns = [
      { header: "Code", key: "Code", width: 10 },
      { header: "Product Name", key: "ProductName", width: 40 },
      { header: "Unit", key: "Unit", width: 10 },
      { header: "Company", key: "Company", width: 20 },
      { header: "Quantity", key: "Quantity", width: 10 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    sortedList.forEach((item) => {
      const row = worksheet.addRow({
        Code: item.Code,
        ProductName: item["Product Name"],
        Unit: item.Unit,
        Company: item.Company,
        Quantity: item.Quantity,
      });
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=MedicineStockReport.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating medicine stock report:", error.message);
    res.status(500).json({
      message: "Failed to export medicine stock",
      error: error.message,
    });
  }
};

const exportLowStock = async (req, res) => {
  try {
    const medicines = await medicineModel.find();

    const filteredSortedList = medicines
      .filter((item) => Number(item.Quantity) <= 10)
      .sort((a, b) => {
        const codeA = isNaN(a.Code) ? a.Code.toString() : Number(a.Code);
        const codeB = isNaN(b.Code) ? b.Code.toString() : Number(b.Code);
        return codeA > codeB ? 1 : -1;
      });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Low Stock Medicines");

    worksheet.columns = [
      { header: "Code", key: "Code", width: 10 },
      { header: "Product Name", key: "ProductName", width: 40 },
      { header: "Unit", key: "Unit", width: 10 },
      { header: "Company", key: "Company", width: 20 },
      { header: "Quantity", key: "Quantity", width: 10 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    filteredSortedList.forEach((item) => {
      const row = worksheet.addRow({
        Code: item.Code,
        ProductName: item["Product Name"],
        Unit: item.Unit,
        Company: item.Company,
        Quantity: item.Quantity,
      });
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=LowStockMedicines.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating low stock report:", error.message);
    res.status(500).json({
      message: "Failed to export low stock",
      error: error.message,
    });
  }
};

const exportPrakritiParikshanPatients = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    const patients = await patientModel.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Prakriti Patients");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Age", key: "age", width: 10 },
      { header: "Sex", key: "gender", width: 10 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "Aadhar No.", key: "aadharnum", width: 20 },
      {
        header: "Prakriti Parikshan Amount",
        key: "prakritiparikshanamount",
        width: 30,
      },
      { header: "Date", key: "date", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FF000000" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFBBFFBB" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.columns.forEach((col) => {
      col.alignment = { horizontal: "left" };
    });

    for (const patient of patients) {
      const visits = await visitModel.find({ patientId: patient._id });

      visits.forEach((visit) => {
        if (!visit.date) return;
        const visitDate = parseDDMMYYYY(visit.date);

        if (
          visitDate >= fromDate &&
          visitDate <= toDate &&
          Number(visit.prakritiparikshanamount) > 0
        ) {
          worksheet.addRow({
            idno: patient.idno || "",
            name: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
            age: patient.age || "",
            gender: patient.gender || "",
            phone: patient.phone || "",
            aadharnum:
              `${patient.aadharnum?.toString().padStart(12, "0")}` || "",
            prakritiparikshanamount: Number(visit.prakritiparikshanamount),
            date: visit.date,
          });
        }
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PrakritiParikshanPatients.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(
      "Error exporting prakriti parikshan patients:",
      error.message
    );
    res.status(500).json({
      message: "Failed to export Excel",
      error: error.message,
    });
  }
};
const exportConsultationPatients = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    const patients = await patientModel.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Consultation Patients");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Age", key: "age", width: 10 },
      { header: "Sex", key: "gender", width: 10 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "Aadhar No.", key: "aadharnum", width: 20 },
      { header: "Consultation Amount", key: "consultationamount", width: 20 },
      { header: "Date", key: "date", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FF000000" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFA6D9F7" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    for (const patient of patients) {
      const visits = await visitModel.find({ patientId: patient._id });

      visits.forEach((visit) => {
        if (!visit.date) return;
        const visitDate = parseDDMMYYYY(visit.date);
        const consultationAmt = Number(visit.consultationamount || 0);

        if (
          visitDate >= fromDate &&
          visitDate <= toDate &&
          consultationAmt > 0
        ) {
          const row = worksheet.addRow({
            idno: patient.idno || "",
            name: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
            age: patient.age || "",
            gender: patient.gender || "",
            phone: patient.phone || "",
            aadharnum:
              `${patient.aadharnum?.toString().padStart(12, "0")}` || "",
            consultationamount: consultationAmt,
            date: visit.date,
          });

          row.eachCell((cell) => {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            };
          });
        }
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ConsultationPatients.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting consultation patients:", error.message);
    res.status(500).json({
      message: "Failed to export Excel",
      error: error.message,
    });
  }
};
const exportPatientsBySpeciality = async (req, res) => {
  try {
    const { dateFrom, dateTo, selectedSpecialty } = req.query;

    if (!selectedSpecialty || !dateFrom || !dateTo) {
      return res.status(400).json({
        message:
          "Missing selectedSpecialty, dateFrom or dateTo in query params",
      });
    }

    const specialties = selectedSpecialty
      .split(",")
      .map((s) => s.trim().toLowerCase());

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    const patients = await patientModel.find();
    const filteredRows = [];

    for (const patient of patients) {
      const visits = await visitModel.find({ patientId: patient._id });

      visits.forEach((visit) => {
        const visitSpecialty = visit.department?.trim().toLowerCase();
        if (!visit.date || !visitSpecialty) return;

        if (specialties.includes(visitSpecialty)) {
          const visitDate = parseDDMMYYYY(visit.date);
          if (visitDate >= fromDate && visitDate <= toDate) {
            filteredRows.push({
              idno: patient.idno,
              name: `${patient.firstName || ""} ${
                patient.lastName || ""
              }`.trim(),
              age: patient.age || "",
              gender: patient.gender || "",
              phone: patient.phone || "",
              aadharnum: `${patient.aadharnum?.toString().padStart(12, "0")}`,
              department: visit.department,
              date: visit.date,
            });
          }
        }
      });
    }

    if (filteredRows.length === 0) {
      return res.status(404).json({
        message: `No patients found for specialties: ${specialties.join(
          ", "
        )} between ${dateFrom} and ${dateTo}.`,
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Specialty Report");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Age", key: "age", width: 10 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "Aadhar No.", key: "aadharnum", width: 20 },
      { header: "Department", key: "department", width: 25 },
      { header: "Date", key: "date", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD700" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    filteredRows.forEach((row) => {
      const added = worksheet.addRow(row);
      added.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=SpecialityReport-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting speciality report:", error.message);
    res.status(500).json({
      message: "Failed to export Excel",
      error: error.message,
    });
  }
};

const exportTherapyReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, selectedTherapy } = req.query;

    if (!dateFrom || !dateTo || !selectedTherapy) {
      return res.status(400).json({
        message: "Missing dateFrom, dateTo, or selectedTherapy in query params",
      });
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    const selectedTherapies = selectedTherapy
      .split(",")
      .map((t) => t.trim().toLowerCase());

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    const patients = await patientModel.find();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Therapy Report");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Age", key: "age", width: 10 },
      { header: "Sex", key: "gender", width: 10 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "Aadhar No.", key: "aadharnum", width: 20 },
      { header: "Therapy Name", key: "therapyname", width: 30 },
      { header: "Therapy Amount", key: "therapyamount", width: 15 },
      { header: "Date", key: "date", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    let patientCount = 0;

    for (const patient of patients) {
      const visits = await visitModel.find({ patientId: patient._id });

      visits.forEach((visit) => {
        if (!visit.date || !Array.isArray(visit.therapyWithAmount)) return;

        const visitDate = parseDDMMYYYY(visit.date);
        if (visitDate < fromDate || visitDate > toDate) return;

        visit.therapyWithAmount.forEach((therapy) => {
          const therapyName = therapy?.name?.trim().toLowerCase();
          if (therapyName && selectedTherapies.includes(therapyName)) {
            worksheet.addRow({
              idno: patient.idno || "",
              name: `${patient.firstName || ""} ${
                patient.lastName || ""
              }`.trim(),
              age: patient.age || "",
              gender: patient.gender || "",
              phone: patient.phone || "",
              aadharnum: `${(patient.aadharnum || "")
                .toString()
                .padStart(12, "0")}`,
              therapyname: therapy.name,
              therapyamount: Number(therapy.receivedAmount) || 0,
              date: visit.date,
            });
            patientCount++;
          }
        });
      });
    }

    if (patientCount === 0) {
      return res.status(404).json({
        message: `No patients found for selected therapies: ${selectedTherapies.join(
          ", "
        )}`,
      });
    }

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Therapy_Report_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting therapy report:", error);
    res.status(500).json({
      message: "Failed to export therapy report",
      error: error.message,
    });
  }
};

const exportBalanceReport = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: "Missing dateFrom or dateTo" });
    }

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    const fromDate = parseDDMMYYYY(dateFrom);
    const toDate = parseDDMMYYYY(dateTo);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const patients = await patientModel.find();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Balance Report");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "Purpose", key: "purpose", width: 30 },
      { header: "Balance Amount", key: "amount", width: 18 },
      { header: "Date", key: "date", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFDD835" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    for (const patient of patients) {
      const visits = await visitModel.find({ patientId: patient._id });

      for (const visit of visits) {
        if (!visit.date || !visit.balance) continue;

        const visitDate = parseDDMMYYYY(visit.date);
        if (visitDate < fromDate || visitDate > toDate) continue;

        const commonData = {
          idno: patient.idno || "",
          name: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
          phone: patient.phone || "",
          date: visit.date,
        };

        // Consultation
        if (Number(visit.balance.consultation) > 0) {
          worksheet.addRow({
            ...commonData,
            purpose: "Consultation",
            amount: visit.balance.consultation,
          });
        }

        // Prakriti Parikshan
        if (Number(visit.balance.prakritiparikshan) > 0) {
          worksheet.addRow({
            ...commonData,
            purpose: "Prakriti Parikshan",
            amount: visit.balance.prakritiparikshan,
          });
        }

        // Therapies
        if (Array.isArray(visit.balance.therapies)) {
          for (const therapy of visit.balance.therapies) {
            if (Number(therapy.balance) > 0) {
              worksheet.addRow({
                ...commonData,
                purpose: `Therapy - ${therapy.name}`,
                amount: therapy.balance,
              });
            }
          }
        }

        // Others
        if (Array.isArray(visit.balance.others)) {
          for (const other of visit.balance.others) {
            if (Number(other.balance) > 0) {
              worksheet.addRow({
                ...commonData,
                purpose: `Others - ${other.purpose}`,
                amount: other.balance,
              });
            }
          }
        }
      }
    }

    // Align all cells left
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Balance_Report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting balance report:", error);
    res.status(500).json({
      message: "Failed to export balance report",
      error: error.message,
    });
  }
};
const exportSponsorReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, sponsor } = req.query;
    console.log(dateFrom, dateTo, sponsor);
    if (!sponsor || !dateFrom || !dateTo) {
      return res
        .status(400)
        .json({ message: "Missing sponsor, dateFrom, or dateTo" });
    }

    const parseDDMMYYYY = (str) => {
      if (!str) return null;
      if (str.includes("/")) {
        const [day, month, year] = str.split("/").map(Number);
        return new Date(year, month - 1, day);
      } else if (str.includes("-")) {
        return new Date(str); // parses ISO date
      }
      return null;
    };

    const fromDate = parseDDMMYYYY(dateFrom);
    const toDate = parseDDMMYYYY(dateTo);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const patients = await patientModel.find();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sponsor Report");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "City", key: "city", width: 15 },
      { header: "Date", key: "date", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD7CCC8" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
    const normalize = (str) => str.replace(/\s+/g, " ").trim().toLowerCase();

    for (const patient of patients) {
      const visits = await visitModel.find({ patientId: patient._id });

      for (const visit of visits) {
        if (!visit.date || !visit.sponsor) continue;

        const visitDate = parseDDMMYYYY(visit.date);
        if (
          visitDate >= fromDate &&
          visitDate <= toDate &&
          normalize(visit.sponsor) === normalize(sponsor)
        ) {
          console.log("entered here");
          const newRow = worksheet.addRow({
            idno: patient.idno || "",
            name: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
            gender: patient.gender || "",
            phone: patient.phone || "",
            city: patient.city || "",
            date: visit.date,
          });
          newRow.getCell("phone").alignment = { horizontal: "left" };
        }
      }
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Sponsor_Report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting sponsor report:", error);
    res.status(500).json({
      message: "Failed to export sponsor report",
      error: error.message,
    });
  }
};

const exportDiscountWiseReport = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        message: "Missing dateFrom or dateTo",
      });
    }

    const parseDDMMYYYY = (str) => {
      if (!str) return null;
      if (str.includes("/")) {
        const [day, month, year] = str.split("/").map(Number);
        return new Date(year, month - 1, day);
      } else if (str.includes("-")) {
        return new Date(str);
      }
      return null;
    };

    const fromDate = parseDDMMYYYY(dateFrom);
    const toDate = parseDDMMYYYY(dateTo);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const visits = await visitModel.find({}).populate("patientId");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Discount Report");

    worksheet.columns = [
      { header: "Patient ID", key: "idno", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "City", key: "city", width: 15 },
      { header: "Visit Date", key: "date", width: 15 },
      { header: "Discount Type", key: "type", width: 20 },
      { header: "Discount %", key: "percentage", width: 12 },
      { header: "Approved By", key: "approvedBy", width: 25 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFB3E5FC" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    for (const visit of visits) {
      const patient = visit.patientId;
      if (!patient || !visit.date || !visit.discounts) continue;

      const visitDate = parseDDMMYYYY(visit.date);
      if (!visitDate || visitDate < fromDate || visitDate > toDate) continue;

      const { consultation, prakritiparikshan, others, therapies } =
        visit.discounts;

      const pushIfExists = (type, discount) => {
        if (discount && discount.percentage > 0) {
          const newRow = worksheet.addRow({
            idno: patient.idno || "",
            name: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
            phone: `${patient.phone || ""}`,
            city: patient.city || "",
            date: visit.date || "",
            type,
            percentage: discount.percentage,
            approvedBy: discount.approvedBy || "-",
          });

          newRow.getCell("phone").alignment = { horizontal: "left" };
          newRow.getCell("percentage").alignment = { horizontal: "left" };
        }
      };

      pushIfExists("Consultation", consultation);
      pushIfExists("Prakriti Parikshan", prakritiparikshan);
      pushIfExists("Others", others);

      if (Array.isArray(therapies)) {
        for (const therapy of therapies) {
          if (therapy && therapy.percentage > 0) {
            const newRow = worksheet.addRow({
              idno: patient.idno || "",
              name: `${patient.firstName || ""} ${
                patient.lastName || ""
              }`.trim(),
              phone: `${patient.phone || ""}`,
              city: patient.city || "",
              date: visit.date || "",
              type: `Therapy - ${therapy.name}`,
              percentage: therapy.percentage,
              approvedBy: therapy.approvedBy || "-",
            });
            newRow.getCell("phone").alignment = { horizontal: "left" };
            newRow.getCell("percentage").alignment = { horizontal: "left" };
          }
        }
      }
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Discount_Report_All.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting discount-wise report:", error);
    res.status(500).json({
      message: "Failed to export discount-wise report",
      error: error.message,
    });
  }
};

const importBulkPatientData = async (req, res) => {
  try {
    const patientsData = req.body.data; // Expecting array

    if (!Array.isArray(patientsData)) {
      return res.status(400).json({ message: "Invalid input format. Expecting an array." });
    }

    for (const entry of patientsData) {
      const {
        firstName,
        lastName,
        gender,
        age,
        houseno,
        city,
        state,
        district,
        pin,
        aadharnum,
        phone,
        email,
        consultationamount = 0,
        appointment,
        date,
      } = entry;

      // Check if patient already exists
      const patient = await patientModel.findOne({
        firstName,
        lastName,
        phone,
      });

      let savedPatient = patient;

      if (!patient) {
        // Generate custom ID
        const counter = await counterModel.findOneAndUpdate(
          { name: "patient_id_counter" },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
        );
        const nextId = counter.value;
        const customId = `BD/N/C50/${nextId}`;

        const patientData = {
          idno: customId,
          firstName,
          lastName,
          gender,
          age,
          houseno,
          city,
          state,
          district,
          pin,
          phone,
        };

        if (email) patientData.email = email;
        if (aadharnum) patientData.aadharnum = aadharnum;

        savedPatient = new patientModel(patientData);
        await savedPatient.save();
      }

      // Format date from "DD-MM-YYYY" to "DD/MM/YYYY"
      let formattedDate = date;
      if (typeof date === "string" && date.includes("-")) {
        const parts = date.split("-");
        if (parts.length === 3) {
          formattedDate = `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
      }

      // Setup consultation discount
      const discounts = {
        consultation:
          consultationamount === 500
            ? { percentage: 0, approvedBy: "NONE" }
            : { percentage: 100, approvedBy: "FREE OPD" },
        prakritiparikshan: {},
        therapies: [],
        others: {},
      };

      // Create visit
      const visit = new visitModel({
        patientId: savedPatient._id,
        date: formattedDate,
        appointment,
        consultationamount,
        prakritiparikshanamount: 0,
        therapies: [],
        therapyWithAmount: [],
        medicines: [],
        others: "",
        othersamount: 0,
        observation: "",
        status: "pending",
        discounts,
        rogParikshan: {
          stool: "",
          urine: "",
          appetite: "",
          sleep: "",
          tongue: "",
        },
        nadiParikshaFindings: "",
        knownCaseOf: "",
        otherObservations: "",
        balance: {
          consultation: 0,
          prakritiparikshan: 0,
          therapies: [],
          others: [],
        },
      });

      await visit.save();
    }

    res.status(200).json({
      status: 1,
      message: "Bulk patient data imported successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 0,
      message: "Error while importing data",
      error: error.message,
    });
  }
};


// Replace the updatePatientDetails function in patientController.js

const updatePatientDetails = async (req, res) => {
  try {
    const patientId = req.params.id;
    const {
      firstName,
      lastName,
      age,
      gender,
      maritalStatus,
      occupation,
      phone,
      email,
      aadharnum,
      houseno,
      city,
      state,
      district,
      pin,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    console.log("Received update request:", req.body); // Debug log

    // Validate required fields
    if (!firstName || !age || !gender || !phone || !houseno || !city || !state || !district) {
      return res.status(400).json({
        status: 0,
        message: "Missing required fields",
      });
    }

    // Convert to numbers - handle both string and number inputs
    const phoneNum = typeof phone === 'string' ? Number(phone) : phone;
    const ageNum = typeof age === 'string' ? Number(age) : age;
    const aadharNum = aadharnum && aadharnum !== 0 ? (typeof aadharnum === 'string' ? Number(aadharnum) : aadharnum) : null;
    const pinNum = pin && pin !== 0 ? (typeof pin === 'string' ? Number(pin) : pin) : null;
    const emergencyPhoneNum = emergencyContactPhone && emergencyContactPhone !== 0 
      ? (typeof emergencyContactPhone === 'string' ? Number(emergencyContactPhone) : emergencyContactPhone) 
      : null;

    // Validate phone number (must be exactly 10 digits)
    const phoneStr = phoneNum.toString();
    if (phoneStr.length !== 10 || !/^\d{10}$/.test(phoneStr) || isNaN(phoneNum)) {
      return res.status(400).json({
        status: 0,
        message: "Phone number must be exactly 10 digits",
      });
    }

    // Validate Aadhar number if provided (must be exactly 12 digits)
    if (aadharNum && aadharNum !== 0) {
      const aadharStr = aadharNum.toString();
      if (aadharStr.length !== 12 || !/^\d{12}$/.test(aadharStr) || isNaN(aadharNum)) {
        return res.status(400).json({
          status: 0,
          message: "Aadhar number must be exactly 12 digits",
        });
      }
    }

    // Validate PIN code if provided (must be exactly 6 digits)
    if (pinNum && pinNum !== 0) {
      const pinStr = pinNum.toString();
      if (pinStr.length !== 6 || !/^\d{6}$/.test(pinStr) || isNaN(pinNum)) {
        return res.status(400).json({
          status: 0,
          message: "PIN code must be exactly 6 digits",
        });
      }
    }

    // Validate emergency contact phone if provided (must be exactly 10 digits)
    if (emergencyPhoneNum && emergencyPhoneNum !== 0) {
      const emergencyPhoneStr = emergencyPhoneNum.toString();
      if (emergencyPhoneStr.length !== 10 || !/^\d{10}$/.test(emergencyPhoneStr) || isNaN(emergencyPhoneNum)) {
        return res.status(400).json({
          status: 0,
          message: "Emergency contact phone must be exactly 10 digits",
        });
      }
    }

    // Find the patient
    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        status: 0,
        message: "Patient not found",
      });
    }

    // Build update object with only provided fields (store as numbers)
    const updateData = {
      firstName: firstName.trim(),
      age: ageNum,
      gender,
      phone: phoneNum,
      houseno: houseno.trim(),
      city: city.trim(),
      state: state.trim(),
      district: district.trim(),
    };

    // Add optional fields if provided
    if (lastName) updateData.lastName = lastName.trim();
    if (maritalStatus) updateData.maritalStatus = maritalStatus;
    if (occupation) updateData.occupation = occupation.trim();
    if (email) updateData.email = email.trim();
    if (aadharNum && aadharNum !== 0) updateData.aadharnum = aadharNum;
    if (pinNum && pinNum !== 0) updateData.pin = pinNum;
    if (emergencyContactName) updateData.emergencyContactName = emergencyContactName.trim();
    if (emergencyPhoneNum && emergencyPhoneNum !== 0) updateData.emergencyContactPhone = emergencyPhoneNum;

    console.log("Update data:", updateData); // Debug log

    // Update the patient
    const updatedPatient = await patientModel.findByIdAndUpdate(
      patientId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log("Updated patient:", updatedPatient); // Debug log

    return res.status(200).json({
      status: 1,
      message: "Patient details updated successfully",
      patient: updatedPatient,
    });
  } catch (err) {
    console.error("Error updating patient:", err);
    return res.status(500).json({
      status: 0,
      message: "Error updating patient details",
      error: err.message,
    });
  }
};


module.exports = {
  patientDetailsInsert,
  patientList,
  getLastPatient,
  exportLastPatientToExcel,
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
  updatePatientDetails
};
