const medicineModel = require('../../models/medicineDetails.model');
const saleModel = require('../../models/sale.model');
const ExcelJS = require('exceljs');

const { generateBillNumber } = require('../../utils/billNumberGenerator');

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
    const totalAmount = Math.round(subtotalAfterDiscount);

    const sale = new saleModel({
      billNumber,          // ✅ NEW
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

const getAllSales = async (req, res) => {
  try {
    const sales = await saleModel.find().sort({ saleDate: -1 }); // newest first
    res.status(200).json({ success: true, sales });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales' });
  }
};

// ✅ NEW: Get single sale by ID
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

// ✅ NEW: Update sale
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
    const totalAmount = Math.round(subtotalAfterDiscount);

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

    res.status(200).json({ message: 'Sale updated successfully', sale: existingSale });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ NEW: Delete sale
const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the sale
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

    // Delete the sale
    await saleModel.findByIdAndDelete(id);

    res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const generateSaleReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, patientId, patientName } = req.query;
    
    console.log("📊 Generating sales report with filters:", { dateFrom, dateTo, patientId, patientName });

    // Build query
    let query = {};
    
    // Date filter
    if (dateFrom && dateTo) {
      query.saleDate = {
        $gte: dateFrom,
        $lte: dateTo
      };
    }
    
    // Patient ID filter
    if (patientId && patientId.trim() !== "") {
      query.patientId = { $regex: patientId, $options: 'i' };
    }
    
    // Patient Name filter
    if (patientName && patientName.trim() !== "") {
      query.patientName = { $regex: patientName, $options: 'i' };
    }

    // Fetch sales
    const sales = await saleModel.find(query).sort({ saleDate: 1 }); // Sort by date ascending
    
    console.log(`Found ${sales.length} sales`);
    
    if (sales.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No sales found for the given criteria"
      });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Records');

    // Set column widths
    worksheet.columns = [
      { key: 'saleDate', width: 12 },
      { key: 'patientId', width: 15 },
      { key: 'billNumber', width: 18 },
      { key: 'patientName', width: 25 },
      { key: 'medicineName', width: 30 },
      { key: 'batch', width: 15 },
      { key: 'hsn', width: 12 },
      { key: 'expiry', width: 12 },
      { key: 'quantity', width: 10 },
      { key: 'pricePerUnit', width: 12 },
      { key: 'medicineTotal', width: 12 },
    ];

    // Add main header row
    const headerRow = worksheet.addRow([
      'Date',
      'Patient ID',
      'Bill No.',
      'Patient Name',
      'Medicine Name',
      'Batch No.',
      'HSN',
      'Expiry',
      'Qty',
      'Price/Unit',
      'Total (₹)'
    ]);

    // Style header
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' } // Blue color for sales
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add data rows grouped by date and patient
    let currentRowNumber = 2;
    let grandTotal = 0;

    // Group sales by date
    const salesByDate = {};
    sales.forEach(sale => {
      const date = sale.saleDate;
      if (!salesByDate[date]) {
        salesByDate[date] = [];
      }
      salesByDate[date].push(sale);
    });

    // Process each date group
    Object.keys(salesByDate).sort().forEach((date, dateIndex) => {
      const dateSales = salesByDate[date];
      let dateTotal = 0;

      // Add date separator row
      const dateSeparatorRow = worksheet.addRow([date, '', '', '', '', '', '', '', '', '']);
      dateSeparatorRow.font = { bold: true, size: 11, color: { argb: 'FF0066CC' } };
      dateSeparatorRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F2FF' }
      };
      worksheet.mergeCells(`A${currentRowNumber}:J${currentRowNumber}`);
      dateSeparatorRow.alignment = { horizontal: 'left', vertical: 'middle' };
      dateSeparatorRow.height = 22;
      currentRowNumber++;

      // Process each sale for this date
      dateSales.forEach((sale, saleIndex) => {
        const medicines = sale.medicines || [];
        
        if (medicines.length === 0) {
          console.warn(`⚠️ Sale ${sale._id} has no medicines`);
          // Add a single row for sale without medicines
          const row = worksheet.addRow({
            saleDate: '',
            patientId: sale.patientId,
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
          // Add medicine rows for this sale
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

            // Styling
            row.alignment = { horizontal: 'center', vertical: 'middle' };
            row.height = 20;

            // Add borders
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

        // Add sale subtotal row
        const saleTotal = sale.totalAmount || 0;
        const subtotalRow = worksheet.addRow({
          saleDate: '',
          patientId: '',
          patientName: '',
          medicineName: '',
          batch: '',
          hsn: '',
          expiry: '',
          quantity: '',
          pricePerUnit: 'Subtotal:',
          medicineTotal: saleTotal.toFixed(2)
        });

        // Show discount if applicable
        if (sale.discount > 0) {
          const discountRow = worksheet.addRow({
            saleDate: '',
            patientId: '',
            patientName: '',
            medicineName: '',
            batch: '',
            hsn: '',
            expiry: '',
            quantity: '',
            pricePerUnit: `Discount (${sale.discount}%):`,

          });
          discountRow.font = { italic: true, size:8, color: { argb: 'FF666666' } };
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

        // Add spacing between sales
        if (saleIndex < dateSales.length - 1) {
          worksheet.addRow([]);
          currentRowNumber++;
        }
      });

      // Add date total row
      const dateTotalRow = worksheet.addRow([
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'Date Total:',
        dateTotal.toFixed(2)
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

      // Add spacing between dates
      if (dateIndex < Object.keys(salesByDate).length - 1) {
        worksheet.addRow([]);
        currentRowNumber++;
      }
    });

    // Add grand total section
    worksheet.addRow([]);
    currentRowNumber++;
    
    const grandTotalRow = worksheet.addRow([
      '',
      '',
      `Total Sales: ${sales.length}`,
      '',
      '',
      '',
      '',
      '',
      'Grand Total:',
      grandTotal.toFixed(2)
    ]);

    grandTotalRow.font = { bold: true, size: 10, color: { argb: 'FF0066CC' } };
    grandTotalRow.alignment = { horizontal: 'right', vertical: 'middle' };
    grandTotalRow.height = 30;
    
    // Merge cells for grand total
    worksheet.mergeCells(`C${currentRowNumber}:H${currentRowNumber}`);

    // Style grand total row
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

    // Generate buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Sales_Records_Detailed_Report.xlsx');
    
    res.send(buffer);
    
    console.log(`✅ Sales report generated successfully with ${sales.length} sales`);
    
  } catch (error) {
    console.error("❌ Error generating sales report:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to generate sales report",
      error: error.message
    });
  }
};

// Update the exports at the bottom of the file
module.exports = { 
  recordSale, 
  getAllSales, 
  getSaleById,
  updateSale,
  deleteSale,
  generateSaleReport 
};