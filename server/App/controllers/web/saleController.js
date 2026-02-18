const medicineModel = require('../../models/medicineDetails.model');
const saleModel = require('../../models/sale.model');
const ExcelJS = require('exceljs');

const { generateBillNumber } = require('../../utils/billNumberGenerator');

// ✅ NEW: Generate Excel Bill matching your existing format
const generateExcelBill = async (saleId) => {
  try {
    // Fetch the sale
    const sale = await saleModel.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }

    const invoiceNumber = sale.billNumber || 'DRAFT';

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sale Receipt", {
      pageSetup: { 
        paperSize: 9, 
        orientation: "portrait",
        fitToPage: true,
        fitToHeight: 1,
        fitToWidth: 1,
      },
    });

    // Function to generate a single bill starting at a specific row
    const generateBill = (startRow) => {
      let rowIdx = startRow;

      // -------------------- Clinic Header --------------------
      const headerStyle = {
        alignment: { horizontal: "center" },
        font: { bold: true, size: 14 },
      };

      worksheet.mergeCells(`A${rowIdx}:H${rowIdx}`);
      worksheet.getCell(`A${rowIdx}`).value = "IMMUNITY CLINIC";
      Object.assign(worksheet.getCell(`A${rowIdx}`), headerStyle);
      rowIdx++;

      worksheet.mergeCells(`A${rowIdx}:H${rowIdx}`);
      worksheet.getCell(`A${rowIdx}`).value =
        "D-76, Ground Floor, besides LPS GLOBAL SCHOOL, BI";
      worksheet.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };
      rowIdx++;

      worksheet.mergeCells(`A${rowIdx}:H${rowIdx}`);
      worksheet.getCell(`A${rowIdx}`).value =
        "Phone: 0120-4026100, 9625963298 | Email: immunityclinic0@gmail.com";
      worksheet.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };
      rowIdx++;

      worksheet.mergeCells(`A${rowIdx}:H${rowIdx}`);
      worksheet.getCell(`A${rowIdx}`).value =
        "Reg No: 64793/2020 | GSTIN: 09AAJFI9867J1ZH";
      worksheet.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };
      rowIdx++;

      worksheet.addRow([]);
      rowIdx++;

      // -------------------- Invoice & Patient Info --------------------
      const invoiceRow = worksheet.addRow([
        "Invoice No:",
        invoiceNumber,
        "",
        "",
        "Sale Date:",
        sale.saleDate,
      ]);
      invoiceRow.getCell(1).alignment = { horizontal: "left" };
      invoiceRow.getCell(2).alignment = { horizontal: "left" };
      invoiceRow.getCell(5).alignment = { horizontal: "left" };
      invoiceRow.getCell(6).alignment = { horizontal: "left" };
      rowIdx++;

      worksheet.addRow([
        "Patient ID:",
        sale.patientId,
        "",
        "",
        "Patient Name:",
        sale.patientName,
      ]);
      rowIdx++;

      worksheet.addRow([]);
      rowIdx++;

      // -------------------- Medicine Table Header --------------------
      const headerRow = worksheet.addRow([
        "S.No",
        "Medicine Name",
        "Batch",
        "HSN",
        "Expiry",
        "Price/Unit",
        "Qty",
        "Total",
      ]);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF8800" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      rowIdx++;

      // -------------------- Medicine Data --------------------
      sale.medicines.forEach((med, index) => {
        const row = worksheet.addRow([
          index + 1,
          med.medicineName,
          med.batch || '',
          med.hsn || '',
          med.expiry || '',
          med.pricePerUnit,
          med.quantity,
          med.totalPrice,
        ]);
        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        rowIdx++;
      });

      worksheet.addRow([]);
      rowIdx++;

      // -------------------- Totals --------------------
      const addTotalRow = (label, value) => {
        const row = worksheet.addRow(["", "", "", "", "", label, "", value]);
        row.eachCell((cell, colNumber) => {
          if (colNumber >= 6) {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center" };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });
        rowIdx++;
      };

      addTotalRow("Subtotal (₹):", sale.subtotal.toFixed(2));

      const discountPercent = parseFloat(sale.discount) || 0;
      const discountAmount = (sale.subtotal * discountPercent) / 100;

      if (discountPercent > 0) {
        addTotalRow(`Discount ${discountPercent}%:`, `- ₹${discountAmount.toFixed(2)}`);
      }

      const afterDiscount = sale.subtotal - discountAmount;
      const sgst = sale.sgst || (sale.subtotal * 0.025);
      const cgst = sale.cgst || (sale.subtotal * 0.025);

      addTotalRow("SGST 2.5%:", `₹${sgst.toFixed(2)}`);
      addTotalRow("CGST 2.5%:", `₹${cgst.toFixed(2)}`);

      const roundoff = sale.totalAmount - (afterDiscount + sgst + cgst);
      addTotalRow("Roundoff:", `₹${roundoff.toFixed(2)}`);

      addTotalRow("GRAND TOTAL:", `₹${sale.totalAmount.toFixed(2)}`);

      // -------------------- Social Media Links (Bottom Left) --------------------
      rowIdx += 2; // Add spacing
      
      const socialHeaderRow = worksheet.addRow(["Also Follow Us On:"]);
      socialHeaderRow.getCell(1).font = { bold: true, size: 11 };
      socialHeaderRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
      rowIdx++;

      const instaRow = worksheet.addRow(["Instagram: https://www.instagram.com/clinicimmunity?igsh=YnhobzRyNTEwOXV5"]);
      instaRow.getCell(1).font = { size: 10, color: { argb: "FF000000" }, underline: false };
      instaRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
      rowIdx++;

      const fbRow = worksheet.addRow(["Facebook: https://www.facebook.com/share/p/1Fjjh1KvJi/"]);
      fbRow.getCell(1).font = { size: 10, color: { argb: "FF000000" }, underline: false };
      fbRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
      rowIdx++;

      return rowIdx;
    };

    // -------------------- Generate First Bill --------------------
    let currentRow = generateBill(1);

    // -------------------- Add Separator --------------------
    currentRow += 2;
    worksheet.addRow([]);
    currentRow++;
    
    // Add dashed line separator
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const separatorCell = worksheet.getCell(`A${currentRow}`);
    separatorCell.value = "✂️ ------------------------------------------------- CUT HERE ------------------------------------------------- ✂️";
    separatorCell.alignment = { horizontal: "center" };
    separatorCell.font = { bold: true, size: 10 };
    currentRow++;
    
    worksheet.addRow([]);
    currentRow += 2;

    // -------------------- Generate Second Bill (Duplicate) --------------------
    generateBill(currentRow);

    // -------------------- Set Column Widths --------------------
    worksheet.columns = [
      { key: "sno", width: 10 },
      { key: "medicineName", width: 30 },
      { key: "batch", width: 12 },
      { key: "hsn", width: 10 },
      { key: "expiry", width: 15 },
      { key: "pricePerUnit", width: 15 },
      { key: "quantity", width: 6 },
      { key: "total", width: 12 },
    ];

    // -------------------- Return Buffer --------------------
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;

  } catch (error) {
    console.error('Error generating Excel bill:', error);
    throw error;
  }
};

// ✅ EXISTING: Record Sale
const recordSale = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      saleDate,
      medicines,
      discount = 0,
      discountApprovedBy = "",
    } = req.body;

    // ✅ GENERATE BILL NUMBER
    const billNumber = await generateBillNumber('sale');

    let subtotal = 0;

    for (let med of medicines) {
      const stockMed = await medicineModel.findOne({ "Product Name": med.medicineName });

      if (!stockMed) {
        return res.status(404).json({ message: `Medicine "${med.medicineName}" not found in stock` });
      }

      if (stockMed.Quantity < med.quantity) {
        return res.status(400).json({
          message: `Not enough stock for "${med.medicineName}". Available: ${stockMed.Quantity}`,
        });
      }

      stockMed.Quantity -= med.quantity;
      await stockMed.save();

      med.totalPrice = med.quantity * med.pricePerUnit;
      subtotal += med.totalPrice;
    }

    const sgst = subtotal * 0.025;
    const cgst = subtotal * 0.025;
    const discountAmount = (subtotal * discount) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const totalAmount = Math.round(subtotalAfterDiscount + sgst + cgst);

    const sale = new saleModel({
      billNumber,
      patientId,
      patientName,
      saleDate,
      medicines,
      subtotal,
      sgst,
      cgst,
      totalAmount,
      discount,
      discountApprovedBy,
    });

    await sale.save();

    res.status(201).json({ message: 'Sale recorded successfully', sale });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ EXISTING: Get All Sales
const getAllSales = async (req, res) => {
  try {
    const sales = await saleModel.find().sort({ saleDate: -1 });
    res.status(200).json({ success: true, sales });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales' });
  }
};

// ✅ EXISTING: Get Single Sale
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await saleModel.findById(id);
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    res.status(200).json({ success: true, sale });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sale' });
  }
};

// ✅ MODIFIED: Update Sale with Bill Generation
const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientId,
      patientName,
      saleDate,
      medicines,
      discount = 0,
      discountApprovedBy = "",
    } = req.body;

    // Find existing sale
    const existingSale = await saleModel.findById(id);
    if (!existingSale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore stock from old sale
    for (let oldMed of existingSale.medicines) {
      const stockMed = await medicineModel.findOne({ "Product Name": oldMed.medicineName });
      if (stockMed) {
        stockMed.Quantity += oldMed.quantity;
        await stockMed.save();
      }
    }

    // Deduct stock for new medicines
    let subtotal = 0;
    for (let med of medicines) {
      const stockMed = await medicineModel.findOne({ "Product Name": med.medicineName });

      if (!stockMed) {
        // Restore the stock we just added back
        for (let oldMed of existingSale.medicines) {
          const restoreMed = await medicineModel.findOne({ "Product Name": oldMed.medicineName });
          if (restoreMed) {
            restoreMed.Quantity -= oldMed.quantity;
            await restoreMed.save();
          }
        }
        return res.status(404).json({ message: `Medicine "${med.medicineName}" not found in stock` });
      }

      if (stockMed.Quantity < med.quantity) {
        // Restore the stock we just added back
        for (let oldMed of existingSale.medicines) {
          const restoreMed = await medicineModel.findOne({ "Product Name": oldMed.medicineName });
          if (restoreMed) {
            restoreMed.Quantity -= oldMed.quantity;
            await restoreMed.save();
          }
        }
        return res.status(400).json({
          message: `Not enough stock for "${med.medicineName}". Available: ${stockMed.Quantity}`,
        });
      }

      // Reduce stock
      stockMed.Quantity -= med.quantity;
      await stockMed.save();

      // Compute totalPrice for each medicine
      med.totalPrice = med.quantity * med.pricePerUnit;
      subtotal += med.totalPrice;
    }

    // Calculate GST and totals
    const sgst = subtotal * 0.025;
    const cgst = subtotal * 0.025;
    const discountAmount = (subtotal * discount) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const totalAmount = Math.round(subtotalAfterDiscount + sgst + cgst);

    // Update sale
    existingSale.patientId = patientId;
    existingSale.patientName = patientName;
    existingSale.saleDate = saleDate;
    existingSale.medicines = medicines;
    existingSale.subtotal = subtotal;
    existingSale.sgst = sgst;
    existingSale.cgst = cgst;
    existingSale.totalAmount = totalAmount;
    existingSale.discount = discount;
    existingSale.discountApprovedBy = discountApprovedBy;

    await existingSale.save();

    res.status(200).json({ 
      message: 'Sale updated successfully', 
      sale: existingSale,
      saleId: existingSale._id // Send the ID for bill download
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ NEW: Download Updated Bill (Excel format matching your existing format)
const downloadUpdatedBill = async (req, res) => {
  try {
    const { id } = req.params;

    // Generate the Excel bill
    const excelBuffer = await generateExcelBill(id);

    // Fetch sale for filename
    // Fetch sale for filename
    const sale = await saleModel.findById(id);
    const billNumber = (sale.billNumber || sale.patientId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Updated_Invoice_${billNumber}_${new Date().getTime()}.xlsx`;

// Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`); // ✅ No quotes
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);

    console.log(`✅ Updated bill downloaded: ${fileName}`);
  } catch (error) {
    console.error('Error downloading updated bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download updated bill',
      error: error.message
    });
  }
};

// ✅ EXISTING: Delete Sale
const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await saleModel.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore stock for all medicines in the sale
    for (let med of sale.medicines) {
      const stockMed = await medicineModel.findOne({ "Product Name": med.medicineName });
      if (stockMed) {
        stockMed.Quantity += med.quantity;
        await stockMed.save();
      }
    }

    await saleModel.findByIdAndDelete(id);

    res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ EXISTING: Generate Sale Report
const generateSaleReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, patientId, patientName } = req.query;
    
    console.log("📊 Generating sales report with filters:", { dateFrom, dateTo, patientId, patientName });

    // Build query
    let query = {};
    
    if (dateFrom && dateTo) {
      query.saleDate = {
        $gte: dateFrom,
        $lte: dateTo
      };
    }
    
    if (patientId && patientId.trim() !== "") {
      query.patientId = { $regex: patientId, $options: 'i' };
    }
    
    if (patientName && patientName.trim() !== "") {
      query.patientName = { $regex: patientName, $options: 'i' };
    }

    const sales = await saleModel.find(query).sort({ saleDate: 1 });
    
    console.log(`Found ${sales.length} sales`);
    
    if (sales.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No sales found for the specified criteria"
      });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Records');

    // Set column widths
    worksheet.columns = [
      { header: 'Date', key: 'saleDate', width: 12 },
      { header: 'Patient ID', key: 'patientId', width: 15 },
      { header: 'Bill No.', key: 'billNumber', width: 15 },
      { header: 'Patient Name', key: 'patientName', width: 20 },
      { header: 'Medicine', key: 'medicineName', width: 25 },
      { header: 'Batch', key: 'batch', width: 12 },
      { header: 'HSN', key: 'hsn', width: 12 },
      { header: 'Expiry', key: 'expiry', width: 12 },
      { header: 'Qty', key: 'quantity', width: 8 },
      { header: 'Rate (₹)', key: 'pricePerUnit', width: 12 },
      { header: 'Total (₹)', key: 'medicineTotal', width: 12 }
    ];

    // Header styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add data rows
    let currentRowNumber = 2;
    let grandTotal = 0;

    const salesByDate = {};
    sales.forEach(sale => {
      const date = sale.saleDate;
      if (!salesByDate[date]) {
        salesByDate[date] = [];
      }
      salesByDate[date].push(sale);
    });

    Object.keys(salesByDate).sort().forEach((date, dateIndex) => {
      const dateSales = salesByDate[date];
      let dateTotal = 0;

      // Date separator
      const dateSeparatorRow = worksheet.addRow([date, '', '', '', '', '', '', '', '', '']);
      dateSeparatorRow.font = { bold: true, size: 11, color: { argb: 'FF0066CC' } };
      dateSeparatorRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F2FF' }
      };
      worksheet.mergeCells(`A${currentRowNumber}:K${currentRowNumber}`);
      dateSeparatorRow.alignment = { horizontal: 'left', vertical: 'middle' };
      dateSeparatorRow.height = 22;
      currentRowNumber++;

      dateSales.forEach((sale, saleIndex) => {
        const medicines = sale.medicines || [];
        
        if (medicines.length === 0) {
          const row = worksheet.addRow({
            saleDate: '',
            patientId: sale.patientId,
            billNumber: sale.billNumber || 'N/A',
            patientName: sale.patientName || 'N/A',
            medicineName: 'No medicines recorded',
            batch: '-',
            hsn: '-',
            expiry: '-',
            quantity: 0,
            pricePerUnit: '0.00',
            medicineTotal: '0.00'
          });
          
          row.alignment = { horizontal: 'center', vertical: 'middle' };
          row.height = 20;
          currentRowNumber++;
        } else {
          medicines.forEach((medicine, medIndex) => {
            const row = worksheet.addRow({
              saleDate: medIndex === 0 ? '' : '',
              patientId: medIndex === 0 ? sale.patientId : '',
              billNumber: medIndex === 0 ? (sale.billNumber || 'N/A') : '',
              patientName: medIndex === 0 ? (sale.patientName || 'N/A') : '',
              medicineName: medicine.medicineName || 'Unknown',
              batch: medicine.batch || 'N/A',
              hsn: medicine.hsn || 'N/A',
              expiry: medicine.expiry || 'N/A',
              quantity: medicine.quantity || 0,
              pricePerUnit: (medicine.pricePerUnit || 0).toFixed(2),
              medicineTotal: (medicine.totalPrice || 0).toFixed(2)
            });

            row.alignment = { horizontal: 'center', vertical: 'middle' };
            row.height = 20;

            row.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
              };
            });

            currentRowNumber++;
          });
        }

        // Sale subtotal
        const saleTotal = sale.totalAmount || 0;
        const subtotalRow = worksheet.addRow({
          saleDate: '',
          patientId: '',
          billNumber: '',
          patientName: '',
          medicineName: '',
          batch: '',
          hsn: '',
          expiry: '',
          quantity: '',
          pricePerUnit: 'Subtotal:',
          medicineTotal: saleTotal.toFixed(2)
        });

        if (sale.discount > 0) {
          const discountRow = worksheet.addRow({
            saleDate: '',
            patientId: '',
            billNumber: '',
            patientName: '',
            medicineName: '',
            batch: '',
            hsn: '',
            expiry: '',
            quantity: '',
            pricePerUnit: `Discount (${sale.discount}%):`,
            medicineTotal: ''
          });
          discountRow.font = { italic: true, size: 8, color: { argb: 'FF666666' } };
          discountRow.alignment = { horizontal: 'right', vertical: 'middle' };
          currentRowNumber++;
        }

        subtotalRow.font = { bold: true };
        subtotalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F8FF' }
        };
        subtotalRow.alignment = { horizontal: 'right', vertical: 'middle' };
        
        subtotalRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF0066CC' } },
            bottom: { style: 'medium', color: { argb: 'FF0066CC' } }
          };
        });

        dateTotal += saleTotal;
        currentRowNumber++;

        if (saleIndex < dateSales.length - 1) {
          worksheet.addRow([]);
          currentRowNumber++;
        }
      });

      // Date total
      const dateTotalRow = worksheet.addRow([
        '', '', '', '', '', '', '', '', '', 'Date Total:', dateTotal.toFixed(2)
      ]);

      dateTotalRow.font = { bold: true, size: 11, color: { argb: 'FF0066CC' } };
      dateTotalRow.alignment = { horizontal: 'right', vertical: 'middle' };
      dateTotalRow.height = 25;
      dateTotalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCE5FF' }
      };
      
      dateTotalRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'double', color: { argb: 'FF0066CC' } },
          bottom: { style: 'double', color: { argb: 'FF0066CC' } }
        };
      });

      grandTotal += dateTotal;
      currentRowNumber++;

      if (dateIndex < Object.keys(salesByDate).length - 1) {
        worksheet.addRow([]);
        currentRowNumber++;
      }
    });

    // Grand total
    worksheet.addRow([]);
    currentRowNumber++;
    
    const grandTotalRow = worksheet.addRow([
      '', '', `Total Sales: ${sales.length}`, '', '', '', '', '', '', 'Grand Total:', grandTotal.toFixed(2)
    ]);

    grandTotalRow.font = { bold: true, size: 10, color: { argb: 'FF0066CC' } };
    grandTotalRow.alignment = { horizontal: 'right', vertical: 'middle' };
    grandTotalRow.height = 30;
    
    worksheet.mergeCells(`C${currentRowNumber}:I${currentRowNumber}`);

    grandTotalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'double', color: { argb: 'FF0066CC' } },
        bottom: { style: 'double', color: { argb: 'FF0066CC' } }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB3D9FF' }
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Sales_Records_Detailed_Report.xlsx');
    
    res.send(buffer);
    
    console.log(`✅ Sales report generated successfully with ${sales.length} sales`);
    
  } catch (error) {
    console.error("❌ Error generating sales report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate sales report",
      error: error.message
    });
  }
};

module.exports = { 
  recordSale, 
  getAllSales, 
  getSaleById,
  updateSale,
  deleteSale,
  generateSaleReport,
  downloadUpdatedBill // ✅ NEW
};
