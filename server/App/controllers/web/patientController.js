const patientModel = require("../../models/patientDetails.model");
const counterModel = require("../../models/counterDetails");
const PurchaseModel = require("../../models/purchase.model"); // Add this line
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const visitModel = require("../../models/visitDetails.model");
const saleModel = require("../../models/sale.model");
const medicineModel = require("../../models/medicineDetails.model");

const { generateBillNumber } = require('../../utils/billNumberGenerator');

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


// FINAL VERSION - Add this to patientController.js
// This version is optimized based on your screenshot template structure

// CORRECTED VERSION - Add this to patientController.js
// This function fetches therapies from the database, not from query parameters

// COMPLETE FUNCTION - Replace the entire exportTherapyCashReceipt function in patientController.js
// This version ONLY fixes alignment - NO dimension changes

// ==========================================
// FIXED VERSION - Replace exportTherapyCashReceipt in patientController.js
// This version ONLY creates session boxes for therapies that actually exist
// ==========================================

const exportTherapyCashReceipt = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Fetch patient details
    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Fetch last visit with therapies
    const lastVisit = await visitModel
      .findOne({ patientId: patient._id })
      .sort({ createdAt: -1 });

    if (!lastVisit) {
      return res.status(404).json({ message: "No last visit found" });
    }

    // Get therapies from database (already stored in visit)
    const therapies = lastVisit.therapies || [];
    
    if (therapies.length === 0) {
      return res.status(400).json({ 
        message: "No therapies found for this patient's last visit" 
      });
    }

    // Limit to first 3 therapies for the receipt
    const therapyList = therapies.slice(0, 3);

    // Generate Bill Number with T prefix
    let billNumber;
    if (lastVisit.therapyBillNumber) {
      billNumber = lastVisit.therapyBillNumber;
      console.log(`♻️ Reusing therapy bill: ${billNumber}`);
    } else {
      billNumber = await generateBillNumber('therapy');
      lastVisit.therapyBillNumber = billNumber;
      console.log(`✨ New therapy bill: ${billNumber}`);
    }

    console.log(`💾 Saving therapy visit`);
    await lastVisit.save();
    console.log(`✅ Saved: ${lastVisit._id}`);

    // Calculate totals from therapyWithAmount (amounts already paid for therapies)
    let totalFee = 0;
    let totalReceived = 0;
    let totalDiscount = 0;

    // Calculate from the therapies prescribed
    therapyList.forEach(therapy => {
      const fee = Number(therapy.amount || 0);
      totalFee += fee;
      
      // Find received amount for this therapy
      const therapyPayment = lastVisit.therapyWithAmount?.find(
        t => t.name === therapy.name
      );
      if (therapyPayment) {
        totalReceived += Number(therapyPayment.receivedAmount || 0);
      }

      // Find discount for this therapy
      const therapyDiscount = lastVisit.discounts?.therapies?.find(
        t => t.name === therapy.name
      );
      if (therapyDiscount) {
        const discountAmount = (fee * Number(therapyDiscount.percentage || 0)) / 100;
        totalDiscount += discountAmount;
      }
    });

    const totalAfterDiscount = totalFee - totalDiscount;
    const balance = totalAfterDiscount - totalReceived;
    const discountPercentage = totalFee > 0 ? ((totalDiscount / totalFee) * 100).toFixed(2) : 0;

    // Get approved by names
    const approvedByList = [];
    therapyList.forEach(therapy => {
      const therapyDiscount = lastVisit.discounts?.therapies?.find(
        t => t.name === therapy.name
      );
      if (therapyDiscount?.approvedBy) {
        approvedByList.push(therapyDiscount.approvedBy);
      }
    });
    const approvedBy = [...new Set(approvedByList)].join(", ") || "";

    // Load Excel Template
    const templatePath = path.join(
      __dirname,
      "../../assets/receiptGenerationTherapy.xlsx"
    );
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ 
        message: "Template file not found",
        path: templatePath
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet("Cash Receipt") || workbook.getWorksheet("Sheet1");

    if (!worksheet) {
      return res.status(400).json({ 
        message: "Worksheet 'Cash Receipt' or 'Sheet1' not found in template" 
      });
    }

    // Prepare data
    const date = lastVisit.date || new Date().toLocaleDateString('en-GB');
    const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
    const address = `${patient.houseno || ""}, ${patient.city || ""}`.trim();

    // Helper function to update cells safely
    const updateCell = (cellAddress, value) => {
      try {
        const cell = worksheet.getCell(cellAddress);
        cell.value = value;
      } catch (error) {
        console.error(`Error updating cell ${cellAddress}:`, error.message);
      }
    };

    // ✅ NEW: Helper function to clear borders from a cell
    const clearBorders = (cellAddress) => {
      try {
        const cell = worksheet.getCell(cellAddress);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
        };
      } catch (error) {
        console.error(`Error clearing borders ${cellAddress}:`, error.message);
      }
    };

    // ✅ NEW: Helper function to clear therapy rows that aren't being used
    const clearUnusedTherapyRows = (startRow, therapyCount) => {
      // Clear rows for therapies that don't exist
      // Each therapy takes 2 rows, so clear based on how many therapies we have
      const maxTherapies = 3;
      const usedRows = therapyCount * 2;
      const totalPossibleRows = maxTherapies * 2; // 6 rows total
      
      // Calculate which rows need to be cleared
      const rowsToClear = totalPossibleRows - usedRows;
      const clearStartRow = startRow + usedRows;
      
      for (let rowOffset = 0; rowOffset < rowsToClear; rowOffset++) {
        const currentRowNum = clearStartRow + rowOffset;
        
        // Clear therapy name in column A
        updateCell(`A${currentRowNum}`, "");
        const nameCell = worksheet.getCell(`A${currentRowNum}`);
        nameCell.font = { bold: false, size: 11 };
        
        // Clear session cells in columns D-H
        const sessionCells = ['D', 'E', 'F', 'G', 'H'];
        for (const col of sessionCells) {
          const cellAddress = `${col}${currentRowNum}`;
          updateCell(cellAddress, "");
          clearBorders(cellAddress);
        }
      }
    };

    // ==========================================
    // FIRST COPY (Top Bill)
    // ==========================================
    
    updateCell('B5', billNumber);
    updateCell('E5', patient.idno || "");
    updateCell('H5', date);

    updateCell('B6', fullName);
    updateCell('F6', patient.gender || "");
    updateCell('H6', patient.age || "");

    updateCell('B7', address);
    updateCell('H7', patient.phone || "");

    updateCell('B8', totalFee);
    updateCell('E8', `${discountPercentage}%`);
    updateCell('H8', approvedBy);

    updateCell('B9', totalAfterDiscount);
    updateCell('E9', totalReceived);
    updateCell('H9', balance);

    // ✅ FIXED: Therapy names and session rectangles - First Copy
    let currentRow = 11;
    
    therapyList.forEach((therapy, index) => {
      const sessions = Math.min(Number(therapy.sessions || 1), 7);
      
      // Therapy name in column A
      updateCell(`A${currentRow}`, therapy.name.toUpperCase());
      const nameCell = worksheet.getCell(`A${currentRow}`);
      nameCell.font = { bold: true, size: 11 };
      nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
      
      // Session rectangles in columns D-H (first 5 sessions)
      const sessionCells = ['D', 'E', 'F', 'G', 'H'];
      
      for (let i = 0; i < Math.min(sessions, 5); i++) {
        const cellAddress = `${sessionCells[i]}${currentRow}`;
        const cell = worksheet.getCell(cellAddress);
        
        cell.value = ""; // Empty cell
        cell.border = {
          top: { style: 'thick', color: { argb: 'FF000000' } },
          left: { style: 'thick', color: { argb: 'FF000000' } },
          bottom: { style: 'thick', color: { argb: 'FF000000' } },
          right: { style: 'thick', color: { argb: 'FF000000' } }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      
      // ✅ FIXED: Clear remaining session cells in first row if less than 5 sessions
      for (let i = sessions; i < 5; i++) {
        const cellAddress = `${sessionCells[i]}${currentRow}`;
        updateCell(cellAddress, "");
        clearBorders(cellAddress);
      }
      
      // If more than 5 sessions, add remaining in next row
      if (sessions > 5) {
        const nextRow = currentRow + 1;
        const remainingSessions = Math.min(sessions - 5, 2); // Max 2 more (sessions 6 & 7)
        
        for (let i = 0; i < remainingSessions; i++) {
          const cellAddress = `${sessionCells[i]}${nextRow}`;
          const cell = worksheet.getCell(cellAddress);
          
          cell.value = "";
          cell.border = {
            top: { style: 'thick', color: { argb: 'FF000000' } },
            left: { style: 'thick', color: { argb: 'FF000000' } },
            bottom: { style: 'thick', color: { argb: 'FF000000' } },
            right: { style: 'thick', color: { argb: 'FF000000' } }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        // ✅ FIXED: Clear remaining cells in second row
        for (let i = remainingSessions; i < 5; i++) {
          const cellAddress = `${sessionCells[i]}${nextRow}`;
          updateCell(cellAddress, "");
          clearBorders(cellAddress);
        }
      } else {
        // ✅ FIXED: Clear ALL cells in second row if 5 or fewer sessions
        const nextRow = currentRow + 1;
        for (let i = 0; i < 5; i++) {
          const cellAddress = `${sessionCells[i]}${nextRow}`;
          updateCell(cellAddress, "");
          clearBorders(cellAddress);
        }
      }
      
      // Move to next therapy (skip 2 rows)
      currentRow += 2;
    });
    
    // ✅ FIXED: Clear unused therapy rows
    clearUnusedTherapyRows(11, therapyList.length);

    // ==========================================
    // SECOND COPY (Middle Bill)
    // ==========================================
    
    updateCell('B23', billNumber);
    updateCell('E23', patient.idno || "");
    updateCell('H23', date);

    updateCell('B24', fullName);
    updateCell('F24', patient.gender || "");
    updateCell('H24', patient.age || "");

    updateCell('B25', address);
    updateCell('H25', patient.phone || "");

    updateCell('B26', totalFee);
    updateCell('E26', `${discountPercentage}%`);
    updateCell('H26', approvedBy);

    updateCell('B27', totalAfterDiscount);
    updateCell('E27', totalReceived);
    updateCell('H27', balance);

    // ✅ FIXED: Therapy names and session rectangles - Second Copy
    currentRow = 29;
    
    therapyList.forEach((therapy, index) => {
      const sessions = Math.min(Number(therapy.sessions || 1), 7);
      
      // Therapy name in column A
      updateCell(`A${currentRow}`, therapy.name.toUpperCase());
      const nameCell = worksheet.getCell(`A${currentRow}`);
      nameCell.font = { bold: true, size: 11 };
      nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
      
      // Session rectangles in columns D-H
      const sessionCells = ['D', 'E', 'F', 'G', 'H'];
      
      for (let i = 0; i < Math.min(sessions, 5); i++) {
        const cellAddress = `${sessionCells[i]}${currentRow}`;
        const cell = worksheet.getCell(cellAddress);
        
        cell.value = "";
        cell.border = {
          top: { style: 'thick', color: { argb: 'FF000000' } },
          left: { style: 'thick', color: { argb: 'FF000000' } },
          bottom: { style: 'thick', color: { argb: 'FF000000' } },
          right: { style: 'thick', color: { argb: 'FF000000' } }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      
      // ✅ FIXED: Clear remaining session cells in first row
      for (let i = sessions; i < 5; i++) {
        const cellAddress = `${sessionCells[i]}${currentRow}`;
        updateCell(cellAddress, "");
        clearBorders(cellAddress);
      }
      
      // Handle sessions 6-7
      if (sessions > 5) {
        const nextRow = currentRow + 1;
        const remainingSessions = Math.min(sessions - 5, 2);
        
        for (let i = 0; i < remainingSessions; i++) {
          const cellAddress = `${sessionCells[i]}${nextRow}`;
          const cell = worksheet.getCell(cellAddress);
          
          cell.value = "";
          cell.border = {
            top: { style: 'thick', color: { argb: 'FF000000' } },
            left: { style: 'thick', color: { argb: 'FF000000' } },
            bottom: { style: 'thick', color: { argb: 'FF000000' } },
            right: { style: 'thick', color: { argb: 'FF000000' } }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        // ✅ FIXED: Clear remaining cells in second row
        for (let i = remainingSessions; i < 5; i++) {
          const cellAddress = `${sessionCells[i]}${nextRow}`;
          updateCell(cellAddress, "");
          clearBorders(cellAddress);
        }
      } else {
        // ✅ FIXED: Clear ALL cells in second row if 5 or fewer sessions
        const nextRow = currentRow + 1;
        for (let i = 0; i < 5; i++) {
          const cellAddress = `${sessionCells[i]}${nextRow}`;
          updateCell(cellAddress, "");
          clearBorders(cellAddress);
        }
      }
      
      currentRow += 2;
    });
    
    // ✅ FIXED: Clear unused therapy rows
    clearUnusedTherapyRows(29, therapyList.length);

    // ==========================================
    // STRIP SECTION (Bottom)
    // ==========================================
    
    updateCell('B37', patient.idno || "");
    updateCell('B38', billNumber);
    updateCell('E37', fullName);
    updateCell('H37', date);

    // ✅ FIXED: Therapy names and session rectangles - Strip
    currentRow = 39;
    
    therapyList.forEach((therapy, index) => {
      const sessions = Math.min(Number(therapy.sessions || 1), 7);
      
      // Therapy name in column A
      updateCell(`A${currentRow}`, therapy.name.toUpperCase());
      const nameCell = worksheet.getCell(`A${currentRow}`);
      nameCell.font = { bold: true, size: 10 };
      nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
      
      // Session rectangles in columns D-H
      const sessionCells = ['D', 'E', 'F', 'G', 'H'];
      
      for (let i = 0; i < Math.min(sessions, 5); i++) {
        const cellAddress = `${sessionCells[i]}${currentRow}`;
        const cell = worksheet.getCell(cellAddress);
        
        cell.value = "";
        cell.border = {
          top: { style: 'thick', color: { argb: 'FF000000' } },
          left: { style: 'thick', color: { argb: 'FF000000' } },
          bottom: { style: 'thick', color: { argb: 'FF000000' } },
          right: { style: 'thick', color: { argb: 'FF000000' } }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      
      // ✅ FIXED: Clear remaining session cells in first row
      for (let i = sessions; i < 5; i++) {
        const cellAddress = `${sessionCells[i]}${currentRow}`;
        updateCell(cellAddress, "");
        clearBorders(cellAddress);
      }
      
      // Handle sessions 6-7
      if (sessions > 5) {
        const nextRow = currentRow + 1;
        const remainingSessions = Math.min(sessions - 5, 2);
        
        for (let i = 0; i < remainingSessions; i++) {
          const cellAddress = `${sessionCells[i]}${nextRow}`;
          const cell = worksheet.getCell(cellAddress);
          
          cell.value = "";
          cell.border = {
            top: { style: 'thick', color: { argb: 'FF000000' } },
            left: { style: 'thick', color: { argb: 'FF000000' } },
            bottom: { style: 'thick', color: { argb: 'FF000000' } },
            right: { style: 'thick', color: { argb: 'FF000000' } }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        // ✅ FIXED: Clear remaining cells in second row
        for (let i = remainingSessions; i < 5; i++) {
          const cellAddress = `${sessionCells[i]}${nextRow}`;
          updateCell(cellAddress, "");
          clearBorders(cellAddress);
        }
      } else {
        // ✅ FIXED: Clear ALL cells in second row if 5 or fewer sessions
        const nextRow = currentRow + 1;
        for (let i = 0; i < 5; i++) {
          const cellAddress = `${sessionCells[i]}${nextRow}`;
          updateCell(cellAddress, "");
          clearBorders(cellAddress);
        }
      }
      
      currentRow += 2;
    });
    
    // ✅ FIXED: Clear unused therapy rows
    clearUnusedTherapyRows(39, therapyList.length);

    // Send file
    const buffer = await workbook.xlsx.writeBuffer();
    const cleanPatientName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanBillNumber = billNumber.replace(/\//g, '_');
    const therapyNames = therapyList.map(t => t.name).join('_');

    const fileName = `${cleanBillNumber}_${cleanPatientName}_${therapyNames}_therapy_receipt.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);

  } catch (error) {
    console.error("Error exporting therapy cash receipt:", error);
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Export this function in module.exports at the bottom of patientController.js
// Don't forget to add this to module.exports at the bottom of patientController.js


// ===================================================================
// CORRECTED exportPrakritiCashReceipt Function
// Replace this entire function in patientController.js (starts around line 482)
// ===================================================================

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

    // ✅ Gets most recent visit that HAS therapies
const lastVisit = await visitModel
  .findOne({ 
    patientId: patient._id,
    'therapies.0': { $exists: true }
  })
  .sort({ createdAt: -1 });

    if (!lastVisit) {
      return res.status(404).json({ message: "No last visit found" });
    }

    // ✅ FIX 1: ALWAYS Generate NEW Bill Number for EACH receipt
    // Don't reuse existing bill numbers - each receipt should be unique
    let billNumber;

    if (purpose === "Consultation") {
      billNumber = await generateBillNumber('consultation');
      lastVisit.consultationBillNumber = billNumber;
      console.log(`✨ Generated NEW consultation bill: ${billNumber}`);
      
    } else if (purpose === "Prakriti Parikshan") {
      billNumber = await generateBillNumber('prakriti');
      lastVisit.prakritiBillNumber = billNumber;
      console.log(`✨ Generated NEW prakriti bill: ${billNumber}`);
      
    } else {
      return res.status(400).json({ 
        message: "Invalid purpose. Must be 'Consultation' or 'Prakriti Parikshan'" 
      });
    }

    console.log(`📝 Bill Number: ${billNumber} for ${purpose}`);

    // ✅ FIX 2: Calculate amounts properly
    const numericFee = Number(feeAmount);
    const numericReceived = Number(receivedAmount);
    const numericDiscount = Number(discount);
    const totalAfterDiscount = numericFee - (numericFee * numericDiscount) / 100;
    const balance = totalAfterDiscount - numericReceived;

    // ✅ FIX 3: Update visit fields based on purpose with proper logging
    if (purpose === "Consultation") {
      lastVisit.consultationamount = numericFee;
      lastVisit.balance.consultation = balance;
      lastVisit.discounts.consultation = {
        percentage: numericDiscount,
        approvedBy: approvalby,
      };
      
      console.log(`💰 Consultation - Fee: ₹${numericFee}, Discount: ${numericDiscount}%, Received: ₹${numericReceived}, Balance: ₹${balance}`);
      
    } else if (purpose === "Prakriti Parikshan") {
      lastVisit.prakritiparikshanamount = numericFee;
      lastVisit.balance.prakritiparikshan = balance;
      lastVisit.discounts.prakritiparikshan = {
        percentage: numericDiscount,
        approvedBy: approvalby,
      };
      
      console.log(`💰 Prakriti - Fee: ₹${numericFee}, Discount: ${numericDiscount}%, Received: ₹${numericReceived}, Balance: ₹${balance}`);
    }

    // ✅ FIX 4: SAVE visit BEFORE generating Excel (critical!)
    console.log(`💾 Saving ${purpose} visit with bill number: ${billNumber}`);
    await lastVisit.save();
    console.log(`✅ Visit saved successfully - ID: ${lastVisit._id}`);

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

    const date = new Date().toLocaleDateString();
    const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`;
    const address = `${patient.houseno || ""}, ${patient.city || ""}`;

    const updateCells = (cellMap) => {
      for (const [cell, value] of Object.entries(cellMap)) {
        worksheet.getCell(cell).value = value;
      }
    };

    const feeCellMap = {
      // ✅ Bill Number (Column B, Row 6 and 26)
      B6: billNumber,
      B26: billNumber,

      // Receipt Title
      D5: `Cash Receipt for ${purpose || "Unknown Purpose"}`,
      D25: `Cash Receipt for ${purpose || "Unknown Purpose"}`,

      // ✅ ID No. moved to Column D (Row 6 and 26)
      E6: patient.idno,
      E26: patient.idno,

      // Date
      H6: lastVisit.date,
      H26: lastVisit.date,

      // Patient Details
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

      // Financial Details
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

      // Optional therapy name display
      A18:
        purpose === "Therapy" && therapyName ? therapyName.toUpperCase() : "",
      A38:
        purpose === "Therapy" && therapyName ? therapyName.toUpperCase() : "",
    };

    updateCells(feeCellMap);

    // ✅ Send file with bill number in filename
    const buffer = await workbook.xlsx.writeBuffer();
    const cleanPatientName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanPurpose = purpose.replace(/\s+/g, '_');
    const cleanBillNumber = billNumber.replace(/\//g, '_');

    const fileName = `${cleanBillNumber}_${cleanPatientName}_receipt_${cleanPurpose}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
    
    console.log(`📥 Receipt downloaded: ${fileName}`);
    
  } catch (error) {
    console.error("❌ Error exporting cash receipt:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// ===================================================================
// Key Changes Made:
// ===================================================================
// 1. REMOVED the bill number reuse logic (if lastVisit.consultationBillNumber)
// 2. ALWAYS generate new bill numbers for each receipt
// 3. Added comprehensive console logging for debugging
// 4. Ensured visit.save() happens BEFORE Excel generation
// 5. Added detailed logging of amounts, discounts, and balances
// ===================================================================
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
    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  "attachment; filename=exported_patient.xlsx"
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
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

   const billNumbers = {};

// ✅ FIXED: Generate bill numbers with logging
if (consultationamount && consultationamount > 0) {
  const billNumber = await generateBillNumber('consultation');
  billNumbers.consultationBillNumber = billNumber;
  console.log(`✅ Generated consultation bill: ${billNumber}`);
}

if (prakritiparikshanamount && prakritiparikshanamount > 0) {
  const billNumber = await generateBillNumber('prakriti');
  billNumbers.prakritiBillNumber = billNumber;
  console.log(`✅ Generated prakriti bill: ${billNumber}`);
}

    const visitData = {
      patientId: patient._id,
      ...billNumbers,
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
    
    console.log(`💾 Saving Consultation - Bill: ${billNumbers.consultationBillNumber || 'None'}`);
    await newVisit.save();
    console.log(`✅ Saved visit: ${newVisit._id}`);

    return res.status(200).json({
      status: 1,
      message: "Visit added successfully",
      visitId: newVisit._id,
      patientId: patient._id,
      billNumbers: billNumbers, // ✅ ADD THIS LINE
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

// OPTIMIZED VERSION - Replace the existing exportPatientMaster function

const exportPatientMaster = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    // Parse dates once
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    // Helper function to parse DD/MM/YYYY
    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    // 🔥 OPTIMIZATION 1: Single aggregation query instead of N+1 queries
    const patientsWithVisits = await patientModel.aggregate([
      {
        $lookup: {
          from: "visits",
          localField: "_id",
          foreignField: "patientId",
          as: "visits",
        },
      },
      {
        $unwind: {
          path: "$visits",
          preserveNullAndEmptyArrays: false, // Only patients with visits
        },
      },
      {
        $project: {
          idno: 1,
          firstName: 1,
          lastName: 1,
          gender: 1,
          age: 1,
          houseno: 1,
          city: 1,
          district: 1,
          state: 1,
          pin: 1,
          aadharnum: 1,
          phone: 1,
          email: 1,
          visitDate: "$visits.date",
        },
      },
    ]);

    // 🔥 OPTIMIZATION 2: Filter in memory (faster than DB for date strings)
    const filteredData = patientsWithVisits.filter((record) => {
      if (!record.visitDate) return false;
      const visitDate = parseDDMMYYYY(record.visitDate);
      return visitDate >= fromDate && visitDate <= toDate;
    });

    // 🔥 OPTIMIZATION 3: Remove duplicates efficiently using Set
    const uniqueRecords = new Map();
    filteredData.forEach((record) => {
      const key = `${record._id}_${record.visitDate}`;
      if (!uniqueRecords.has(key)) {
        uniqueRecords.set(key, record);
      }
    });

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

    // Style header
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

    // 🔥 OPTIMIZATION 4: Batch add rows (much faster)
    const rows = Array.from(uniqueRecords.values()).map((record) => ({
      idno: record.idno || "",
      name: `${record.firstName?.trim() || ""} ${record.lastName?.trim() || ""}`.trim(),
      gender: record.gender || "",
      age: record.age || "",
      houseno: record.houseno || "",
      city: record.city || "",
      district: record.district || "",
      state: record.state || "",
      pin: record.pin || "",
      aadharnum: record.aadharnum?.toString().padStart(12, "0") || "",
      phone: record.phone || "",
      email: record.email || "",
      visitDate: record.visitDate,
    }));

    worksheet.addRows(rows);

    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  "attachment; filename=PatientMaster.xlsx"
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
  } catch (error) {
    console.error("Error exporting patient master:", error.message);
    res.status(500).json({ 
      message: "Failed to export Excel", 
      error: error.message 
    });
  }
};
// OPTIMIZED VERSION - Replace exportPatientBillingMaster function

const exportPatientBillingMaster = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    fromDate.setHours(0, 0, 0, 0);

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    // 🔥 OPTIMIZATION: Single aggregation with all data
    const billingData = await patientModel.aggregate([
      {
        $lookup: {
          from: "visits",
          localField: "_id",
          foreignField: "patientId",
          as: "visits",
        },
      },
      {
        $unwind: {
          path: "$visits",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          idno: 1,
          firstName: 1,
          lastName: 1,
          age: 1,
          gender: 1,
          phone: 1,
          aadharnum: 1,
          visitDate: "$visits.date",
          consultationamount: "$visits.consultationamount",
          prakritiparikshanamount: "$visits.prakritiparikshanamount",
          therapyWithAmount: "$visits.therapyWithAmount",
          sponsor: "$visits.sponsor",
        },
      },
    ]);

    // Filter by date
    const filteredData = billingData.filter((record) => {
      if (!record.visitDate) return false;
      const visitDate = parseDDMMYYYY(record.visitDate);
      visitDate.setHours(0, 0, 0, 0);
      return (
        visitDate.getTime() >= fromDate.getTime() &&
        visitDate.getTime() <= toDate.getTime()
      );
    });

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
      { header: "Prakriti Parikshan Amount", key: "prakritiparikshanamount", width: 25 },
      { header: "Therapy Amount", key: "therapyamount", width: 18 },
      { header: "Total Amount", key: "totalamount", width: 18 },
      { header: "Therapy Name", key: "therapyname", width: 40 },
      { header: "Date", key: "date", width: 15 },
      { header: "Sponsor", key: "sponsor", width: 20 },
    ];

    // Style header
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

    // Prepare rows
    const rows = filteredData.map((record) => {
      const consultation = Number(record.consultationamount) || 0;
      const prakriti = Number(record.prakritiparikshanamount) || 0;

      const therapyWithAmountArray = Array.isArray(record.therapyWithAmount)
        ? record.therapyWithAmount
        : [];

      const therapy = therapyWithAmountArray.reduce(
        (sum, t) => sum + (Number(t.receivedAmount) || 0),
        0
      );

      const therapyNames = therapyWithAmountArray
        .map((t) => t.name)
        .join(", ");

      const total = consultation + prakriti + therapy;

      return {
        idno: record.idno || "",
        name: `${record.firstName || ""} ${record.lastName || ""}`.trim(),
        age: record.age || "",
        gender: record.gender || "",
        phone: record.phone || "",
        aadharnum: `${record.aadharnum?.toString().padStart(12, "0")}` || "",
        consultationamount: consultation,
        prakritiparikshanamount: prakriti,
        therapyamount: therapy,
        totalamount: total,
        therapyname: therapyNames,
        date: record.visitDate,
        sponsor: record.sponsor || "",
      };
    });

    worksheet.addRows(rows);

    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  "attachment; filename=PatientSummary.xlsx"
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
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
    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  `attachment; filename=PatientBilling_${patientId}.xlsx`
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
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

    // ----------------- 1. Fetch ALL visits at once (OPTIMIZED) -----------------
    const allVisits = await visitModel.find().lean(); // ✅ Single query with lean()

    let consultationSum = 0;
    let therapySum = 0;
    let otherServicesSum = 0;
    let consultationCount = 0;
    let therapyCount = 0;
    let prakritiCount = 0;

    // ✅ Process all visits in a single loop
    allVisits.forEach((visit) => {
      if (!visit.date) return;

      try {
        const visitDate = parseDDMMYYYY(visit.date);
        
        // ✅ Check if date is valid
        if (isNaN(visitDate.getTime())) return;
        
        if (visitDate >= fromDate && visitDate <= toDate) {
          // Consultation - Store raw amounts first, round only for display
          const consultationAmount = Number(visit.consultationamount || 0);
          if (consultationAmount > 0) {
            consultationSum += consultationAmount;
            consultationCount++;
          }

          // Prakriti Parikshan - Store raw amounts first
          const prakritiAmount = Number(visit.prakritiparikshanamount || 0);
          if (prakritiAmount > 0) {
            otherServicesSum += prakritiAmount;
            prakritiCount++;
          }

          // Therapy - count each therapy separately - Store raw amounts
          if (Array.isArray(visit.therapyWithAmount)) {
            visit.therapyWithAmount.forEach((therapy) => {
              const amount = Number(therapy.receivedAmount || 0);
              if (amount > 0) {
                therapySum += amount;
                therapyCount++;
              }
            });
          }
        }
      } catch (err) {
        console.error(`Error parsing date for visit ${visit._id}:`, visit.date, err.message);
      }
    });

    // ----------------- 2. Fetch medicine sales -----------------
    const sales = await saleModel.find().lean();

    const filteredSales = sales.filter((sale) => {
      if (!sale.saleDate) return false;
      const saleDate = new Date(sale.saleDate);
      return !isNaN(saleDate.getTime()) && saleDate >= fromDate && saleDate <= toDate;
    });

    // ✅ Round medicine sales - sum accurate amounts first, then round
    const medicineSum = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount || 0),
      0
    );
    const medicineCount = filteredSales.length;

    // ✅ Calculate totals with accurate data, round only for display
    const totalRevenue = consultationSum + therapySum + otherServicesSum + medicineSum;

    // Round all values for display
    const displayValues = {
      consultationSum: Math.round(consultationSum),
      therapySum: Math.round(therapySum),
      otherServicesSum: Math.round(otherServicesSum),
      medicineSum: Math.round(medicineSum),
      totalRevenue: Math.round(totalRevenue)
    };

    // ----------------- 3. Generate Excel -----------------
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Revenue Report");

    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 35;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 20;

    // Title row
    worksheet.mergeCells("B1:D1");
    const titleCell = worksheet.getCell("B1");
    titleCell.value = `Revenue Report (${dateFrom} to ${dateTo})`;
    titleCell.font = { bold: true, size: 14, underline: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    // Add header row
    const headerRow = worksheet.addRow(["S.NO", "Source of Income", "No. Of Count", "Amount (₹)"]);
    
    // Add data rows - ✅ Use rounded display values
    worksheet.addRow(["1", "Consultation Fees", consultationCount, displayValues.consultationSum]);
    worksheet.addRow(["2", "Medicine Sales", medicineCount, displayValues.medicineSum]);
    worksheet.addRow(["3", "Panchakarma Treatments", therapyCount, displayValues.therapySum]);
    worksheet.addRow(["4", "Prakriti Parikshans", prakritiCount, displayValues.otherServicesSum]);
    worksheet.addRow(["", "Total Revenue", "", displayValues.totalRevenue]);

    // Style header row
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCE5FF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add borders to all data rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 2) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
          if (cell.col === 3 || cell.col === 4) {
            cell.alignment = { horizontal: "center" };
          }
        });
      }
    });

    // Bold the total row
    const totalRow = worksheet.lastRow;
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  "attachment; filename=RevenueReport.xlsx"
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
  } catch (error) {
    console.error("Error exporting revenue report:", error);
    res
      .status(500)
      .json({ message: "Failed to export Excel", error: error.message });
  }
};

const exportMedicineStock = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    // Get all medicines with current stock
    const medicines = await medicineModel.find();
    
    if (dateFrom && dateTo) {
      // Use the END date (dateTo) to calculate stock as of that date
      const selectedDate = new Date(dateTo);
      selectedDate.setHours(23, 59, 59, 999);
      
      // Get ALL purchases and sales
      const allPurchases = await PurchaseModel.find({});
      const allSales = await saleModel.find({});
      
      // Parse sale date helper
      const parseSaleDate = (dateStr) => {
        if (!dateStr) return null;
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/').map(Number);
          return new Date(year, month - 1, day);
        }
        return new Date(dateStr);
      };
      
      // Calculate quantities AFTER the selected date
      const purchaseAfter = {};
      const soldAfter = {};
      
      // Process ALL purchases that happened AFTER the selected date
      allPurchases.forEach(p => {
        const purchaseDate = new Date(p.billingDate);
        purchaseDate.setHours(0, 0, 0, 0);
        
        if (purchaseDate > selectedDate && p.medicines) {
          p.medicines.forEach(m => {
            const medicineName = m.name;
            const qty = m.quantity || 0;
            purchaseAfter[medicineName] = (purchaseAfter[medicineName] || 0) + qty;
          });
        }
      });
      
      // Process ALL sales that happened AFTER the selected date
      allSales.forEach(s => {
        const saleDate = parseSaleDate(s.saleDate);
        if (saleDate) {
          saleDate.setHours(0, 0, 0, 0);
          
          if (saleDate > selectedDate && s.medicines) {
            s.medicines.forEach(m => {
              const medicineName = m.medicineName;
              const qty = m.quantity || 0;
              soldAfter[medicineName] = (soldAfter[medicineName] || 0) + qty;
            });
          }
        }
      });
      
      // Calculate stock as it was on the selected date
      medicines.forEach(med => {
        const name = med['Product Name'];
        const currentStock = med.Quantity || 0;
        
        // Formula: Stock on Selected Date = Current Stock + All Purchases After - All Sales After
        const purchasedAfterDate = purchaseAfter[name] || 0;
        const soldAfterDate = soldAfter[name] || 0;
        
        const stockOnDate = currentStock + purchasedAfterDate - soldAfterDate;
        
        med._doc.stockAtDate = Math.max(0, stockOnDate);
      });
    }

    const sortedList = medicines.sort((a, b) => {
      const codeA = isNaN(a.Code) ? a.Code.toString() : Number(a.Code);
      const codeB = isNaN(b.Code) ? b.Code.toString() : Number(b.Code);
      return codeA > codeB ? 1 : -1;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Medicine Stock");

    // ✅ ADD TITLE AND DATE HEADERS
    if (dateFrom && dateTo) {
      const displayDate = dateFrom === dateTo ? dateTo : `${dateFrom} to ${dateTo}`;
      
      // Row 1: Main Title
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `Stock on  Date`;
      titleCell.font = { bold: true, size: 16, color: { argb: 'FF000000' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" },
      };
      
      // Row 2: Date Info
      worksheet.mergeCells('A2:F2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Report Date: ${displayDate}`;
      dateCell.font = { bold: true, size: 12 };
      dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Row 3: Empty row for spacing
      worksheet.addRow([]);
      
      // Row 4: Column Headers
      worksheet.addRow(["Code", "Product Name", "Unit", "Company", "Current Stock", "Stock on Selected Date"]);
      
      // Style the column header row (row 4)
      const headerRow = worksheet.getRow(4);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 11 };
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
      
      // Set column widths
      worksheet.getColumn(1).width = 10;  // Code
      worksheet.getColumn(2).width = 40;  // Product Name
      worksheet.getColumn(3).width = 10;  // Unit
      worksheet.getColumn(4).width = 20;  // Company
      worksheet.getColumn(5).width = 15;  // Current Stock
      worksheet.getColumn(6).width = 20;  // Stock on Selected Date
      
    } else {
      // Without dates - simple header
      worksheet.columns = [
        { header: "Code", key: "code", width: 10 },
        { header: "Product Name", key: "name", width: 40 },
        { header: "Unit", key: "unit", width: 10 },
        { header: "Company", key: "company", width: 20 },
        { header: "Quantity", key: "quantity", width: 15 }
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
    }

    // Add data rows
    sortedList.forEach((item) => {
      const rowData = dateFrom && dateTo
        ? [
            item.Code,
            item["Product Name"],
            item.Unit,
            item.Company,
            item.Quantity, // Current stock (today)
            item._doc?.stockAtDate ?? item.Quantity // Stock on selected date
          ]
        : [
            item.Code,
            item["Product Name"],
            item.Unit,
            item.Company,
            item.Quantity
          ];
      
      const row = worksheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  "attachment; filename=MedicineStockReport.xlsx"
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
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
    const { dateFrom, dateTo } = req.query;
    const MIN_STOCK = 10;
    
    // Get all medicines
    const medicines = await medicineModel.find();
    
    // If dates provided, calculate stock as it was on that date
    if (dateFrom && dateTo) {
      // Use the END date to calculate stock
      const selectedDate = new Date(dateTo);
      selectedDate.setHours(23, 59, 59, 999);
      
      const allPurchases = await PurchaseModel.find({});
      const allSales = await saleModel.find({});
      
      const purchaseAfter = {};
      const soldAfter = {};
      
      // Parse sale date helper
      const parseSaleDate = (dateStr) => {
        if (!dateStr) return null;
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/').map(Number);
          return new Date(year, month - 1, day);
        }
        return new Date(dateStr);
      };
      
      // Process purchases AFTER selected date
      allPurchases.forEach(p => {
        const purchaseDate = new Date(p.billingDate);
        purchaseDate.setHours(0, 0, 0, 0);
        
        if (purchaseDate > selectedDate && p.medicines) {
          p.medicines.forEach(m => {
            const medicineName = m.name;
            const qty = m.quantity || 0;
            purchaseAfter[medicineName] = (purchaseAfter[medicineName] || 0) + qty;
          });
        }
      });
      
      // Process sales AFTER selected date
      allSales.forEach(s => {
        const saleDate = parseSaleDate(s.saleDate);
        if (saleDate) {
          saleDate.setHours(0, 0, 0, 0);
          
          if (saleDate > selectedDate && s.medicines) {
            s.medicines.forEach(m => {
              const medicineName = m.medicineName;
              const qty = m.quantity || 0;
              soldAfter[medicineName] = (soldAfter[medicineName] || 0) + qty;
            });
          }
        }
      });
      
      // Calculate stock on selected date
      medicines.forEach(med => {
        const name = med['Product Name'];
        const currentStock = med.Quantity || 0;
        
        const purchasedAfterDate = purchaseAfter[name] || 0;
        const soldAfterDate = soldAfter[name] || 0;
        
        const stockOnDate = currentStock + purchasedAfterDate - soldAfterDate;
        
        med._doc.stockAtDate = Math.max(0, stockOnDate);
      });
    }

    // Filter for low stock based on calculated stock at date
    const filteredSortedList = medicines
      .filter((item) => {
        const stockToCheck = dateFrom && dateTo 
          ? (item._doc?.stockAtDate ?? item.Quantity)
          : item.Quantity;
        return Number(stockToCheck) <= MIN_STOCK;
      })
      .sort((a, b) => {
        const codeA = isNaN(a.Code) ? a.Code.toString() : Number(a.Code);
        const codeB = isNaN(b.Code) ? b.Code.toString() : Number(b.Code);
        return codeA > codeB ? 1 : -1;
      });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Low Stock Alert");

    // ✅ MATCH RUNNING STOCK REPORT STRUCTURE
    if (dateFrom && dateTo) {
      const displayDate = dateFrom === dateTo ? dateTo : `${dateFrom} to ${dateTo}`;
      
      // Row 1: Main Title
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `Low Stock Alert`;
      titleCell.font = { bold: true, size: 16, color: { argb: 'FF000000' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" },
      };
      
      // Row 2: Date Info
      worksheet.mergeCells('A2:F2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Report Date: ${displayDate}`;
      dateCell.font = { bold: true, size: 12 };
      dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Row 3: Empty row for spacing
      worksheet.addRow([]);
      
      // Row 4: Column Headers (EXACTLY matching running stock report)
      worksheet.addRow(["Code", "Product Name", "Unit", "Company", "Current Stock", "Stock on Selected Date"]);
      
      // Style the column header row (row 4)
      const headerRow = worksheet.getRow(4);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 11 };
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
      
      // Set column widths (EXACTLY matching running stock report)
      worksheet.getColumn(1).width = 10;  // Code
      worksheet.getColumn(2).width = 40;  // Product Name
      worksheet.getColumn(3).width = 10;  // Unit
      worksheet.getColumn(4).width = 20;  // Company
      worksheet.getColumn(5).width = 15;  // Current Stock
      worksheet.getColumn(6).width = 20;  // Stock on Selected Date
      
    } else {
      // Without dates - simple header
      worksheet.columns = [
        { header: "Code", key: "code", width: 10 },
        { header: "Product Name", key: "name", width: 40 },
        { header: "Unit", key: "unit", width: 10 },
        { header: "Company", key: "company", width: 20 },
        { header: "Quantity", key: "quantity", width: 15 }
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
    }

    // Add data rows
    filteredSortedList.forEach((item) => {
      const rowData = dateFrom && dateTo
        ? [
            item.Code,
            item["Product Name"],
            item.Unit,
            item.Company,
            item.Quantity, // Current stock (today)
            item._doc?.stockAtDate ?? item.Quantity // Stock on selected date
          ]
        : [
            item.Code,
            item["Product Name"],
            item.Unit,
            item.Company,
            item.Quantity
          ];
      
      const row = worksheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  "attachment; filename=LowStockAlert.xlsx"
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
  } catch (error) {
    console.error("Error generating low stock report:", error.message);
    res.status(500).json({
      message: "Failed to export low stock",
      error: error.message,
    });
  }
};

// OPTIMIZED VERSION - Replace exportPrakritiParikshanPatients function

const exportPrakritiParikshanPatients = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    fromDate.setHours(0, 0, 0, 0);

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    // 🔥 OPTIMIZATION: Single aggregation with filter
    const prakritiData = await patientModel.aggregate([
      {
        $lookup: {
          from: "visits",
          localField: "_id",
          foreignField: "patientId",
          as: "visits",
        },
      },
      {
        $unwind: {
          path: "$visits",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "visits.prakritiparikshanamount": { $gt: 0 }, // Filter at DB level
        },
      },
      {
        $project: {
          idno: 1,
          firstName: 1,
          lastName: 1,
          age: 1,
          gender: 1,
          phone: 1,
          aadharnum: 1,
          visitDate: "$visits.date",
          prakritiparikshanamount: "$visits.prakritiparikshanamount",
          prakritiBillNumber: "$visits.prakritiBillNumber",
        },
      },
    ]);

    // Filter by date in memory
    const filteredData = prakritiData.filter((record) => {
      if (!record.visitDate) return false;
      const visitDate = parseDDMMYYYY(record.visitDate);
      visitDate.setHours(0, 0, 0, 0);
      return (
        visitDate.getTime() >= fromDate.getTime() &&
        visitDate.getTime() <= toDate.getTime()
      );
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Prakriti Patients");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Bill No.", key: "billNumber", width: 18 },
      { header: "Name", key: "name", width: 25 },
      { header: "Age", key: "age", width: 10 },
      { header: "Sex", key: "gender", width: 10 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "Aadhar No.", key: "aadharnum", width: 20 },
      { header: "Prakriti Parikshan Amount", key: "prakritiparikshanamount", width: 30 },
      { header: "Date", key: "date", width: 15 },
    ];

    // Style header
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

    // Prepare rows
    const rows = filteredData.map((record) => ({
      idno: record.idno || "",
      billNumber: record.prakritiBillNumber || "N/A",
      name: `${record.firstName || ""} ${record.lastName || ""}`.trim(),
      age: record.age || "",
      gender: record.gender || "",
      phone: record.phone || "",
      aadharnum: `${record.aadharnum?.toString().padStart(12, "0")}` || "",
      prakritiparikshanamount: Number(record.prakritiparikshanamount),
      date: record.visitDate,
    }));

    worksheet.addRows(rows);

    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  "attachment; filename=PrakritiParikshanPatients.xlsx"
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
  } catch (error) {
    console.error("Error exporting prakriti parikshan patients:", error.message);
    res.status(500).json({
      message: "Failed to export Excel",
      error: error.message,
    });
  }
};
// OPTIMIZED VERSION - Replace exportConsultationPatients function

const exportConsultationPatients = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    fromDate.setHours(0, 0, 0, 0);

    const parseDDMMYYYY = (str) => {
      const [day, month, year] = str.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    // 🔥 OPTIMIZATION: Single aggregation with DB-level filtering
    const consultationData = await patientModel.aggregate([
      {
        $lookup: {
          from: "visits",
          localField: "_id",
          foreignField: "patientId",
          as: "visits",
        },
      },
      {
        $unwind: {
          path: "$visits",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "visits.consultationamount": { $gt: 0 }, // Filter at DB level
        },
      },
      {
        $project: {
          idno: 1,
          firstName: 1,
          lastName: 1,
          age: 1,
          gender: 1,
          phone: 1,
          aadharnum: 1,
          visitDate: "$visits.date",
          consultationamount: "$visits.consultationamount",
          consultationBillNumber: "$visits.consultationBillNumber",
        },
      },
    ]);

    // Filter by date
    const filteredData = consultationData.filter((record) => {
      if (!record.visitDate) return false;
      const visitDate = parseDDMMYYYY(record.visitDate);
      visitDate.setHours(0, 0, 0, 0);
      return (
        visitDate.getTime() >= fromDate.getTime() &&
        visitDate.getTime() <= toDate.getTime()
      );
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Consultation Patients");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Bill No.", key: "billNumber", width: 18 }, 
      { header: "Name", key: "name", width: 25 },
      { header: "Age", key: "age", width: 10 },
      { header: "Sex", key: "gender", width: 10 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "Aadhar No.", key: "aadharnum", width: 20 },
      { header: "Consultation Amount", key: "consultationamount", width: 20 },
      { header: "Date", key: "date", width: 15 },
    ];

    // Style header
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

    // Prepare and add rows
    const rows = filteredData.map((record) => {
      const row = {
        idno: record.idno || "",
        billNumber: record.consultationBillNumber || "N/A",
        name: `${record.firstName || ""} ${record.lastName || ""}`.trim(),
        age: record.age || "",
        gender: record.gender || "",
        phone: record.phone || "",
        aadharnum: `${record.aadharnum?.toString().padStart(12, "0")}` || "",
        consultationamount: Number(record.consultationamount),
        date: record.visitDate,
      };
      return row;
    });

    worksheet.addRows(rows);

    // Center align all cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
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

    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  "attachment; filename=ConsultationPatients.xlsx"
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
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

    console.log("📊 Disease Analysis Report Request:", { dateFrom, dateTo, selectedSpecialty });

    if (!selectedSpecialty || !dateFrom || !dateTo) {
      return res.status(400).json({
        message: "Missing selectedSpecialty, dateFrom or dateTo in query params",
      });
    }

    // Parse specialties (case-insensitive)
    const specialties = selectedSpecialty
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(s => s.length > 0);

    if (specialties.length === 0) {
      return res.status(400).json({
        message: "No valid specialties provided",
      });
    }

    // ✅ FIX: Universal date parser that handles BOTH formats
    const parseDate = (str) => {
      if (!str) return null;
      
      // Handle DD/MM/YYYY format
      if (str.includes("/")) {
        const [day, month, year] = str.split("/").map(Number);
        return new Date(year, month - 1, day);
      }
      
      // Handle YYYY-MM-DD format (from frontend)
      if (str.includes("-")) {
        return new Date(str);
      }
      
      return null;
    };

    const fromDate = parseDate(dateFrom);
    const toDate = parseDate(dateTo);
    
    if (!fromDate || !toDate || isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY",
      });
    }
    
    toDate.setHours(23, 59, 59, 999);
    fromDate.setHours(0, 0, 0, 0);

    console.log("📅 Parsed Date Range:", { fromDate, toDate });
    console.log("🥼 Looking for specialties:", specialties);

    // Single aggregation query
    const results = await patientModel.aggregate([
      {
        $lookup: {
          from: "visits",
          localField: "_id",
          foreignField: "patientId",
          as: "visits",
        },
      },
      {
        $unwind: {
          path: "$visits",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          idno: 1,
          firstName: 1,
          lastName: 1,
          age: 1,
          gender: 1,
          phone: 1,
          aadharnum: 1,
          department: "$visits.department",
          visitDate: "$visits.date",
        },
      },
    ]);

    console.log(`📦 Total records from DB: ${results.length}`);

    // ✅ FIX: Parse visit dates with same universal parser
    const filteredRows = results.filter((record) => {
      // Check specialty match (case-insensitive)
      const visitSpecialty = record.department?.trim().toLowerCase();
      if (!visitSpecialty) {
        console.log("⚠️ Record missing department:", record.idno);
        return false;
      }
      
      if (!specialties.includes(visitSpecialty)) {
        return false;
      }

      // Check date range
      if (!record.visitDate) {
        console.log("⚠️ Record missing visit date:", record.idno);
        return false;
      }
      
      try {
        const visitDate = parseDate(record.visitDate);
        if (!visitDate || isNaN(visitDate.getTime())) {
          console.log("⚠️ Invalid visit date format:", record.visitDate);
          return false;
        }
        
        visitDate.setHours(0, 0, 0, 0);
        return visitDate >= fromDate && visitDate <= toDate;
      } catch (e) {
        console.error("❌ Date parse error:", record.visitDate, e);
        return false;
      }
    });

    console.log(`✅ Filtered records: ${filteredRows.length}`);

    if (filteredRows.length === 0) {
      return res.status(404).json({
        message: `No patients found for selected specialties between ${dateFrom} and ${dateTo}.`,
      });
    }

    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Disease Master Report");

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

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
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

    // Add rows
    const rows = filteredRows.map((record) => ({
      idno: record.idno || "",
      name: `${record.firstName || ""} ${record.lastName || ""}`.trim(),
      age: record.age || "",
      gender: record.gender || "",
      phone: record.phone || "",
      aadharnum: record.aadharnum ? record.aadharnum.toString().padStart(12, "0") : "",
      department: record.department || "",
      date: record.visitDate || "",
    }));

    worksheet.addRows(rows);

    // Center align data
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
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

    console.log("✅ Excel generated successfully");

    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  `attachment; filename=Disease_Master_Report_${new Date().toISOString().split("T")[0]}.xlsx`
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
  } catch (error) {
    console.error("❌ Error exporting disease master report:", error);
    res.status(500).json({
      message: "Failed to export Excel",
      error: error.message,
    });
  }
};

const exportTherapyReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, selectedTherapy } = req.query;

    console.log("💆 Therapy Report Request:", { dateFrom, dateTo, selectedTherapy });

    if (!dateFrom || !dateTo || !selectedTherapy) {
      return res.status(400).json({
        message: "Missing dateFrom, dateTo, or selectedTherapy in query params",
      });
    }

    // Parse therapies (case-insensitive)
    const selectedTherapies = selectedTherapy
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    if (selectedTherapies.length === 0) {
      return res.status(400).json({
        message: "No valid therapies provided",
      });
    }

    // ✅ FIXED: Universal date parser that handles BOTH formats
    const parseDate = (str) => {
      if (!str) return null;
      
      // Handle DD/MM/YYYY format (from database)
      if (str.includes("/")) {
        const [day, month, year] = str.split("/").map(Number);
        return new Date(year, month - 1, day);
      }
      
      // Handle YYYY-MM-DD format (from frontend)
      if (str.includes("-")) {
        return new Date(str);
      }
      
      return null;
    };

    const fromDate = parseDate(dateFrom);
    const toDate = parseDate(dateTo);
    
    if (!fromDate || !toDate || isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY",
      });
    }
    
    toDate.setHours(23, 59, 59, 999);
    fromDate.setHours(0, 0, 0, 0);

    console.log("📅 Parsed Date Range:", { fromDate, toDate });
    console.log("💆 Looking for therapies:", selectedTherapies);

    // Single aggregation query
    const results = await patientModel.aggregate([
      {
        $lookup: {
          from: "visits",
          localField: "_id",
          foreignField: "patientId",
          as: "visits",
        },
      },
      {
        $unwind: {
          path: "$visits",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $unwind: {
          path: "$visits.therapyWithAmount",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          idno: 1,
          firstName: 1,
          lastName: 1,
          age: 1,
          gender: 1,
          phone: 1,
          aadharnum: 1,
          visitDate: "$visits.date",
          therapyName: "$visits.therapyWithAmount.name",
          therapyBillNumber: "$visits.therapyBillNumber",
          therapyAmount: "$visits.therapyWithAmount.receivedAmount",
        },
      },
    ]);

    console.log(`📦 Total therapy records from DB: ${results.length}`);

    // ✅ FIXED: Parse visit dates with universal parser
    const filteredRows = results.filter((record) => {
      // Check therapy match (case-insensitive)
      const therapyName = record.therapyName?.trim().toLowerCase();
      if (!therapyName) {
        console.log("⚠️ Record missing therapy name:", record.idno);
        return false;
      }
      
      if (!selectedTherapies.includes(therapyName)) {
        return false;
      }

      // Check date range
      if (!record.visitDate) {
        console.log("⚠️ Record missing visit date:", record.idno);
        return false;
      }
      
      try {
        const visitDate = parseDate(record.visitDate);
        if (!visitDate || isNaN(visitDate.getTime())) {
          console.log("⚠️ Invalid visit date format:", record.visitDate);
          return false;
        }
        
        visitDate.setHours(0, 0, 0, 0);
        return visitDate >= fromDate && visitDate <= toDate;
      } catch (e) {
        console.error("❌ Date parse error:", record.visitDate, e);
        return false;
      }
    });

    console.log(`✅ Filtered therapy records: ${filteredRows.length}`);

    if (filteredRows.length === 0) {
      return res.status(404).json({
        message: `No patients found for selected therapies between ${dateFrom} and ${dateTo}.`,
      });
    }

    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Therapy Report");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Bill No.", key: "billNumber", width: 18 },
      { header: "Name", key: "name", width: 25 },
      { header: "Age", key: "age", width: 10 },
      { header: "Sex", key: "gender", width: 10 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "Aadhar No.", key: "aadharnum", width: 20 },
      { header: "Therapy Name", key: "therapyname", width: 30 },
      { header: "Therapy Amount", key: "therapyamount", width: 15 },
      { header: "Date", key: "date", width: 15 },
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
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

    // Add rows
    const rows = filteredRows.map((record) => ({
      idno: record.idno || "",
      billNumber: index === 0 ? (record.therapyBillNumber || "N/A") : "",
      name: `${record.firstName || ""} ${record.lastName || ""}`.trim(),
      age: record.age || "",
      gender: record.gender || "",
      phone: record.phone || "",
      aadharnum: record.aadharnum ? record.aadharnum.toString().padStart(12, "0") : "",
      therapyname: record.therapyName || "",
      therapyamount: Number(record.therapyAmount) || 0,
      date: record.visitDate || "",
    }));

    worksheet.addRows(rows);

    // Center align data
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
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

    console.log("✅ Excel generated successfully");

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Therapy_Report_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error("❌ Error exporting therapy report:", error);
    res.status(500).json({
      message: "Failed to generate therapy report",
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

    // Convert DD/MM/YYYY to Date
    const parseDDMMYYYY = (str) => {
      const [d, m, y] = str.split("/").map(Number);
      return new Date(y, m - 1, d);
    };

    const fromDate = parseDDMMYYYY(dateFrom);
    const toDate = parseDDMMYYYY(dateTo);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    // 🔥 Single aggregated query instead of N+1 queries
    const data = await patientModel.aggregate([
      {
        $lookup: {
          from: "visits",
          localField: "_id",
          foreignField: "patientId",
          as: "visits",
        },
      },
      {
        $project: {
          idno: 1,
          firstName: 1,
          lastName: 1,
          phone: 1,
          visits: {
            date: 1,
            balance: 1,
          },
        },
      },
    ]);

    const rows = [];

    for (const p of data) {
      const name = `${p.firstName || ""} ${p.lastName || ""}`.trim();

      for (const v of p.visits) {
        if (!v.date || !v.balance) continue;

        const visitDate = parseDDMMYYYY(v.date);
        if (visitDate < fromDate || visitDate > toDate) continue;

        const base = {
          idno: p.idno || "",
          name,
          phone: p.phone || "",
          date: v.date,
        };

        // Consultation
        if (Number(v.balance.consultation) > 0) {
          rows.push({
            ...base,
            purpose: "Consultation",
            amount: v.balance.consultation,
          });
        }

        // Prakriti
        if (Number(v.balance.prakritiparikshan) > 0) {
          rows.push({
            ...base,
            purpose: "Prakriti Parikshan",
            amount: v.balance.prakritiparikshan,
          });
        }

        // Therapies
        if (Array.isArray(v.balance.therapies)) {
          for (const t of v.balance.therapies) {
            if (Number(t.balance) > 0) {
              rows.push({
                ...base,
                purpose: `Therapy - ${t.name}`,
                amount: t.balance,
              });
            }
          }
        }

        // Others
        if (Array.isArray(v.balance.others)) {
          for (const o of v.balance.others) {
            if (Number(o.balance) > 0) {
              rows.push({
                ...base,
                purpose: `Others - ${o.purpose}`,
                amount: o.balance,
              });
            }
          }
        }
      }
    }

    // 🔥 Excel generation (fast batch insert)
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Balance Report");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "Purpose", key: "purpose", width: 30 },
      { header: "Balance Amount", key: "amount", width: 18 },
      { header: "Sponsor", key: "sponsor", width: 25 }, // ✅ ADD THIS
      { header: "Date", key: "date", width: 15 },
    ];

    // Add all rows at once (VERY FAST)
    worksheet.addRows(rows);

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDD835" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  "attachment; filename=Balance_Report.xlsx"
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
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

    console.log("👥 Sponsor Report Request:", { dateFrom, dateTo, sponsor });

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: "Missing date range" });
    }

    // ✅ FIXED: Universal date parser
    const parseDDMMYYYY = (str) => {
      if (!str) return null;
      
      // Handle DD/MM/YYYY format
      if (str.includes("/")) {
        const [day, month, year] = str.split("/").map(Number);
        return new Date(year, month - 1, day);
      } 
      // Handle YYYY-MM-DD format
      else if (str.includes("-")) {
        return new Date(str);
      }
      return null;
    };

    const fromDate = parseDDMMYYYY(dateFrom);
    const toDate = parseDDMMYYYY(dateTo);
    
    if (!fromDate || !toDate || isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    console.log("📅 Parsed Date Range:", { fromDate, toDate });
    console.log("🏢 Looking for sponsor:", sponsor || "All sponsors");

    // ✅ STEP 1: Fetch visits with optional sponsor filter
    const visitFilter = {};
    if (sponsor && sponsor.trim() !== "") {
      // Case-insensitive partial match
      visitFilter.sponsor = new RegExp(sponsor.trim(), "i");
      console.log("🔍 Using sponsor filter:", visitFilter.sponsor);
    }

    const visits = await visitModel.find(visitFilter).lean();
    console.log(`📦 Total visits from DB: ${visits.length}`);

    // ✅ STEP 2: Filter visits by date range
    const filteredVisits = visits.filter((visit) => {
      if (!visit.date || !visit.patientId) {
        console.log("⚠️ Visit missing date or patientId:", visit._id);
        return false;
      }
      
      const visitDate = parseDDMMYYYY(visit.date);
      if (!visitDate || isNaN(visitDate.getTime())) {
        console.log("⚠️ Invalid visit date:", visit.date);
        return false;
      }
      
      visitDate.setHours(0, 0, 0, 0);
      const inRange = visitDate >= fromDate && visitDate <= toDate;
      
      if (!inRange) {
        console.log(`❌ Visit ${visit._id} outside range: ${visit.date}`);
      }
      
      return inRange;
    });

    console.log(`✅ Filtered visits: ${filteredVisits.length}`);

    if (filteredVisits.length === 0) {
      return res.status(404).json({
        message: `No visits found for ${sponsor || "any sponsor"} between ${dateFrom} and ${dateTo}.`,
      });
    }

    // ✅ STEP 3: Fetch only needed patients
    const patientIds = [
      ...new Set(filteredVisits.map(v => v.patientId.toString()))
    ];

    console.log(`👥 Fetching ${patientIds.length} unique patients`);

    const patients = await patientModel
      .find({ _id: { $in: patientIds } })
      .lean();

    const patientMap = new Map(
      patients.map(p => [p._id.toString(), p])
    );

    console.log(`✅ Found ${patients.length} patients`);

    // ✅ STEP 4: Generate Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sponsor Report");

    worksheet.columns = [
      { header: "ID No.", key: "idno", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Mobile", key: "phone", width: 15 },
      { header: "City", key: "city", width: 15 },
      { header: "Sponsor", key: "sponsor", width: 25 },
      { header: "Date", key: "date", width: 15 },
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
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

    // Add rows
    filteredVisits.forEach((visit) => {
      const patient = patientMap.get(visit.patientId.toString());
      if (!patient) {
        console.log("⚠️ Patient not found for visit:", visit._id);
        return;
      }

      worksheet.addRow({
        idno: patient.idno || "",
        name: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
        gender: patient.gender || "",
        phone: patient.phone || "",
        city: patient.city || "",
        sponsor: visit.sponsor || "N/A",
        date: visit.date,
      });
    });

    // Center align all cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
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

    console.log("✅ Excel generated successfully");

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Sponsor_Report_${sponsor ? sponsor.replace(/\s+/g, '_') : 'All'}_${dateFrom}_to_${dateTo}.xlsx`
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (err) {
    console.error("❌ Sponsor report error:", err);
    res.status(500).json({ 
      message: "Failed to export sponsor report",
      error: err.message 
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

    const buffer = await workbook.xlsx.writeBuffer();

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.setHeader(
  "Content-Disposition",
  "attachment; filename=Discount_Report_All.xlsx"
);
res.setHeader('Content-Length', buffer.length);

res.send(buffer);
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
  exportTherapyCashReceipt,
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
