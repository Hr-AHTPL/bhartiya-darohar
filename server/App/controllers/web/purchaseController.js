const PurchaseModel = require("../../models/purchase.model");
const medicineModel = require("../../models/medicineDetails.model");
const ExcelJS = require('exceljs');

const createPurchase = async (req, res) => {
  try {
    let {
      billingDate,
      invoiceNumber,
      supplierName,
      supplierAddress,
      supplierContact,
      supplierGST,
      medicines,
      grandTotal,
    } = req.body;

    console.log("📥 Received purchase data:", { billingDate, invoiceNumber, medicineCount: medicines?.length });

    // Validation
    if (
      !billingDate ||
      !invoiceNumber ||
      !supplierName ||
      !supplierAddress ||
      !supplierContact ||
      !supplierGST ||
      !Array.isArray(medicines) ||
      medicines.length === 0 ||
      grandTotal == null
    ) {
      return res.status(400).json({ 
        success: false,
        message: "Missing or invalid purchase data" 
      });
    }

    // Parse billingDate as Date
    const parsedDate = new Date(billingDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid billing date format" 
      });
    }

    // Process medicines and update inventory
    const processedMedicines = [];
    
    for (const med of medicines) {
      const { name, quantity, hsn, expiryDate, batchNumber, pricePerUnit, discountPercent, gstPercent, total } = med;

      if (!name || quantity == null) {
        console.warn(`⚠️ Skipping medicine with missing name or quantity`);
        continue;
      }

      // Format expiryDate to dd/mm/yyyy string
      let formattedExpiry = null;
      if (expiryDate) {
        const d = new Date(expiryDate);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          formattedExpiry = `${day}/${month}/${year}`;
        }
      }

      // Add to processed medicines
      processedMedicines.push({
        name,
        batchNumber: batchNumber || "N/A",
        hsn: hsn || "N/A",
        expiryDate: formattedExpiry || "N/A",
        quantity,
        pricePerUnit: pricePerUnit || 0,
        discountPercent: discountPercent || 0,
        gstPercent: gstPercent || 0,
        total: total || (quantity * pricePerUnit),
      });

      // Update medicine inventory
      const existingMedicine = await medicineModel.findOne({ "Product Name": name });

      if (existingMedicine) {
        console.log(`🔄 Updating existing medicine: ${name}`);
        await medicineModel.updateOne(
          { "Product Name": name },
          {
            $inc: { Quantity: quantity },
            $set: {
              Price: pricePerUnit || existingMedicine.Price,
              HSN: hsn || existingMedicine.HSN,
              expiryDate: formattedExpiry || existingMedicine.expiryDate,
              batchNumber: batchNumber || existingMedicine.batchNumber,
            },
          }
        );
      } else {
        console.log(`➕ Adding new medicine: ${name}`);
        const lastMed = await medicineModel.findOne().sort({ Code: -1 });
        const newCode = lastMed ? lastMed.Code + 1 : 1;

        const newMed = new medicineModel({
          Code: newCode,
          "Product Name": name,
          Company: supplierName || "Unknown",
          Quantity: quantity,
          Price: pricePerUnit || 0,
          Unit: "N/A",
          HSN: hsn || "N/A",
          batchNumber: batchNumber || "N/A",
          expiryDate: formattedExpiry || "N/A",
        });

        await newMed.save();
      }
    }

    // Save purchase record
    const newPurchase = new PurchaseModel({
      billingDate: parsedDate,
      invoiceNumber,
      supplierName,
      supplierAddress,
      supplierContact,
      supplierGST,
      medicines: processedMedicines,
      grandTotal,
    });

    const saved = await newPurchase.save();
    console.log(`✅ Purchase saved successfully with ${processedMedicines.length} medicines`);

    res.status(201).json({
      success: true,
      message: "Purchase saved successfully and inventory updated",
      purchase: saved,
    });
  } catch (error) {
    console.error("❌ Error saving purchase:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to save purchase",
      error: error.message 
    });
  }
};

const viewPurchases = async (req, res) => {
  try {
    console.log("📊 Fetching all purchases...");
    
    const purchases = await PurchaseModel.find().sort({ billingDate: -1 });
    
    console.log(`✅ Found ${purchases.length} purchases in database`);
    
    res.status(200).json({
      success: true,
      count: purchases.length,
      purchases: purchases,
    });
  } catch (error) {
    console.error("❌ Error fetching purchases:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
};

// ✅ FIXED FUNCTION - Enhanced with proper null checks
const generatePurchaseReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, supplier } = req.query;
    
    console.log("📊 Generating purchase report with filters:", { dateFrom, dateTo, supplier });

    // Build query
    let query = {};
    
    if (dateFrom && dateTo) {
      query.billingDate = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }
    
    if (supplier && supplier.trim() !== "") {
      query.supplierName = { $regex: supplier, $options: 'i' };
    }

    // Fetch purchases
    const purchases = await PurchaseModel.find(query).sort({ billingDate: -1 });
    
    console.log(`Found ${purchases.length} purchases`);
    
    if (purchases.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No purchases found for the given criteria"
      });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Purchase Records');

    // Set column widths
    worksheet.columns = [
      { key: 'billingDate', width: 12 },
      { key: 'invoiceNumber', width: 15 },
      { key: 'supplierName', width: 25 },
      { key: 'supplierContact', width: 14 },
      { key: 'medicineName', width: 30 },
      { key: 'batchNumber', width: 15 },
      { key: 'hsn', width: 12 },
      { key: 'expiryDate', width: 12 },
      { key: 'quantity', width: 10 },
      { key: 'pricePerUnit', width: 12 },
      { key: 'discount', width: 10 },
      { key: 'gst', width: 8 },
      { key: 'total', width: 12 },
    ];

    // Add main header row
    const headerRow = worksheet.addRow([
      'Date',
      'Invoice No.',
      'Supplier Name',
      'Contact',
      'Medicine Name',
      'Batch No.',
      'HSN',
      'Expiry',
      'Qty',
      'Price/Unit',
      'Disc %',
      'GST %',
      'Total (₹)'
    ]);

    // Style header
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6600' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add data rows with medicine details
    let currentRowNumber = 2;
    let totalAmount = 0;

    purchases.forEach((purchase, purchaseIndex) => {
      const purchaseDate = new Date(purchase.billingDate).toLocaleDateString('en-IN');
      
      // Check if medicines array exists and has items
      const medicines = purchase.medicines || [];
      
      if (medicines.length === 0) {
        console.warn(`⚠️ Purchase ${purchase.invoiceNumber} has no medicines`);
        // Add a single row for purchase without medicines
        const row = worksheet.addRow({
          billingDate: purchaseDate,
          invoiceNumber: purchase.invoiceNumber,
          supplierName: purchase.supplierName || 'N/A',
          supplierContact: purchase.supplierContact || 'N/A',
          medicineName: 'No medicines recorded',
          batchNumber: '-',
          hsn: '-',
          expiryDate: '-',
          quantity: 0,
          pricePerUnit: '0.00',
          discount: 0,
          gst: 0,
          total: '0.00'
        });
        
        row.alignment = { horizontal: 'center', vertical: 'middle' };
        row.height = 20;
        currentRowNumber++;
      } else {
        medicines.forEach((medicine, medIndex) => {
          const row = worksheet.addRow({
            billingDate: medIndex === 0 ? purchaseDate : '',
            invoiceNumber: medIndex === 0 ? purchase.invoiceNumber : '',
            supplierName: medIndex === 0 ? (purchase.supplierName || 'N/A') : '',
            supplierContact: medIndex === 0 ? (purchase.supplierContact || 'N/A') : '',
            medicineName: medicine.name || 'Unknown',
            batchNumber: medicine.batchNumber || 'N/A',
            hsn: medicine.hsn || 'N/A',
            expiryDate: medicine.expiryDate || 'N/A',
            quantity: medicine.quantity || 0,
            pricePerUnit: (medicine.pricePerUnit || 0).toFixed(2),
            discount: medicine.discountPercent || 0,
            gst: medicine.gstPercent || 0,
            total: (medicine.total || 0).toFixed(2)
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

      // Add purchase subtotal row
      const purchaseTotal = purchase.grandTotal || 0;
      const subtotalRow = worksheet.addRow({
        billingDate: '',
        invoiceNumber: '',
        supplierName: '',
        supplierContact: '',
        medicineName: '',
        batchNumber: '',
        hsn: '',
        expiryDate: '',
        quantity: '',
        pricePerUnit: '',
        discount: '',
        gst: 'Subtotal:',
        total: purchaseTotal.toFixed(2)
      });

      subtotalRow.font = { bold: true };
      subtotalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF4E6' }
      };
      subtotalRow.alignment = { horizontal: 'right', vertical: 'middle' };
      
      subtotalRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'medium', color: { argb: 'FFFF6600' } },
          bottom: { style: 'medium', color: { argb: 'FFFF6600' } }
        };
      });

      totalAmount += purchaseTotal;
      currentRowNumber++;

      // Add spacing between purchases
      if (purchaseIndex < purchases.length - 1) {
        worksheet.addRow([]);
        currentRowNumber++;
      }
    });

    // Add grand total section
    worksheet.addRow([]);
    const grandTotalRow = worksheet.addRow([
      '',
      '',
      `Total Purchases: ${purchases.length}`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'GRAND TOTAL:',
      totalAmount.toFixed(2)
    ]);

    grandTotalRow.font = { bold: true, size: 12, color: { argb: 'FFFF6600' } };
    grandTotalRow.alignment = { horizontal: 'right', vertical: 'middle' };
    grandTotalRow.height = 30;
    
    // Merge cells for grand total
    worksheet.mergeCells(`A${currentRowNumber + 2}:B${currentRowNumber + 2}`);
    worksheet.mergeCells(`C${currentRowNumber + 2}:K${currentRowNumber + 2}`);

    // Style grand total row
    grandTotalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'double', color: { argb: 'FFFF6600' } },
        bottom: { style: 'double', color: { argb: 'FFFF6600' } }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE0B2' }
      };
    });

    // Generate buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Purchase_Records_Detailed_Report.xlsx');
    
    res.send(buffer);
    
    console.log(`✅ Purchase report generated successfully with ${purchases.length} purchases`);
    
  } catch (error) {
    console.error("❌ Error generating purchase report:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to generate purchase report",
      error: error.message
    });
  }
};

module.exports = { createPurchase, viewPurchases, generatePurchaseReport };