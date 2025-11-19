import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, FileText, ShoppingCart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API_BASE_URL from "@/config/api.config";

interface Medicine {
  id: string;
  name: string;
  batchNumber: string;
  hsn: string;
  expiryDate: string;
  quantity: number;
  pricePerUnit: number;
  discountPercent: number;
  gstPercent: number;
  total: number;
}

interface MedicineOption {
  _id: string;
  "Product Name": string;
  HSN?: string;
  batchNumber?: string;
  expiryDate?: string;
  Price?: number;
}

interface Invoice {
  invoiceNumber: string;
  supplierName: string;
  supplierAddress: string;
  supplierContact: string;
  supplierGST: string;
  billingDate: string;   // ✅ new
  medicines: Medicine[];
  grandTotal: number;
}

const downloadPDF = (invoice: Invoice) => {
  const doc = new jsPDF() as jsPDF & { lastAutoTable: { finalY: number } };

  doc.setFontSize(16);
  doc.text("Purchase Invoice", 14, 20);
  doc.setFontSize(12);
  doc.text(`Date: ${new Date(invoice.billingDate).toLocaleDateString()}`, 14, 30);
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 40);
  
  doc.text(`Supplier: ${invoice.supplierName}`, 14, 50);
  doc.text(`Address: ${invoice.supplierAddress}`, 14, 60);
  doc.text(`Contact: ${invoice.supplierContact}`, 14, 70);
  doc.text(`GST No: ${invoice.supplierGST}`, 14, 80);

  const totalWithoutDiscount = invoice.medicines.reduce((sum, med) => sum + (med.quantity * med.pricePerUnit), 0);
  const totalDiscount = invoice.medicines.reduce((sum, med) => sum + ((med.quantity * med.pricePerUnit * med.discountPercent) / 100), 0);
  const totalGST = invoice.medicines.reduce((sum, med) => {
    const discountedAmount = (med.quantity * med.pricePerUnit) - ((med.quantity * med.pricePerUnit * med.discountPercent) / 100);
    return sum + ((discountedAmount * med.gstPercent) / 100);
  }, 0);

  autoTable(doc, {
    startY: 90,
    head: [['Medicine', 'Batch', 'HSN', 'Expiry', 'Qty', 'MRP', 'Discount (%)', 'GST (%)', 'Total']],
    body: invoice.medicines.map(med => [
      med.name,
      med.batchNumber,
      med.hsn,
      med.expiryDate,
      med.quantity.toString(),
      `${med.pricePerUnit.toFixed(2)}`,
      `${med.discountPercent}%`,
      `${med.gstPercent}%`,
      `${(med.quantity * med.pricePerUnit).toFixed(2)}`
    ]),
  });

  const summaryStartY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(12);
  doc.text(`Total (Without Discount): ${totalWithoutDiscount.toFixed(2)}`, 14, summaryStartY);
  doc.text(`Discount: ${totalDiscount.toFixed(2)}`, 14, summaryStartY + 10);
  doc.text(`Grand Total: ${invoice.grandTotal.toFixed(2)}`, 14, summaryStartY + 20);
  doc.text(`GST Total: ${totalGST.toFixed(2)}`, 150, summaryStartY + 20);

  doc.save('purchase_invoice.pdf');
};

const PurchaseForm = () => {
  const [invoice, setInvoice] = useState<Invoice>({
    invoiceNumber: '',
    supplierName: '',
    supplierAddress: '',
    supplierContact: '',
    supplierGST: '',
    billingDate: '',   // ✅ new
    medicines: [
      {
        id: '1',
        name: '',
        batchNumber: '',
        hsn: '',
        expiryDate: '',
        quantity: 0,
        pricePerUnit: 0,
        discountPercent: 0,
        gstPercent: 0,
        total: 0,
      },
    ],
    grandTotal: 0,
  });

  const [medicineOptions, setMedicineOptions] = useState<MedicineOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
  const [filteredSuggestions, setFilteredSuggestions] = useState<{ [key: string]: MedicineOption[] }>({});
  const suggestionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/medicine/view`);
        const data = await response.json();
        if (data.status === 1 && data.medicineList) {
          setMedicineOptions(data.medicineList);
        }
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
      }
    };

    fetchMedicines();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideSuggestion = Object.values(suggestionRefs.current).some(
        ref => ref && ref.contains(target)
      );
      
      if (!clickedInsideSuggestion) {
        setShowSuggestions({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const calculateMedicineTotal = (medicine: Medicine): number => {
    const subtotal = medicine.quantity * medicine.pricePerUnit;
    const discount = (subtotal * medicine.discountPercent) / 100;
    return subtotal - discount;
  };

  const calculateGrandTotal = (medicines: Medicine[]): number => {
    return medicines.reduce((sum, medicine) => sum + medicine.total, 0);
  };

  const updateMedicine = (medicineId: string, field: keyof Medicine, value: string | number) => {
    setInvoice(prevInvoice => {
      const updatedMedicines = prevInvoice.medicines.map(medicine => {
        if (medicine.id === medicineId) {
          const updatedMedicine = { ...medicine, [field]: value };
          updatedMedicine.total = calculateMedicineTotal(updatedMedicine);
          return updatedMedicine;
        }
        return medicine;
      });

      const grandTotal = calculateGrandTotal(updatedMedicines);
      return { ...prevInvoice, medicines: updatedMedicines, grandTotal };
    });
  };

  const updateInvoiceField = (field: keyof Omit<Invoice, 'medicines' | 'grandTotal'>, value: string) => {
    setInvoice(prevInvoice => ({ ...prevInvoice, [field]: value }));
  };

  const handleMedicineNameChange = (medicineId: string, value: string) => {
    updateMedicine(medicineId, 'name', value);
    
    if (value.trim()) {
      const filtered = medicineOptions.filter(option =>
        option["Product Name"].toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(prev => ({ ...prev, [medicineId]: filtered }));
      setShowSuggestions(prev => ({ ...prev, [medicineId]: true }));
      
      const exactMatch = medicineOptions.find(option =>
        option["Product Name"].toLowerCase() === value.toLowerCase()
      );
      if (exactMatch) {
        autoFillMedicineDetails(medicineId, exactMatch);
        setShowSuggestions(prev => ({ ...prev, [medicineId]: false }));
      }
    } else {
      setShowSuggestions(prev => ({ ...prev, [medicineId]: false }));
    }
  };

  const autoFillMedicineDetails = (medicineId: string, selectedMedicine: MedicineOption) => {
    if (selectedMedicine.HSN) updateMedicine(medicineId, 'hsn', selectedMedicine.HSN);
    if (selectedMedicine.batchNumber) updateMedicine(medicineId, 'batchNumber', selectedMedicine.batchNumber);
    if (selectedMedicine.expiryDate) {
      const [day, month, year] = selectedMedicine.expiryDate.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      updateMedicine(medicineId, 'expiryDate', formattedDate);
    }
    if (selectedMedicine.Price !== undefined && selectedMedicine.Price > 0) {
      updateMedicine(medicineId, 'pricePerUnit', selectedMedicine.Price);
    }
  };

  const selectMedicine = (medicineId: string, selectedMedicine: MedicineOption) => {
    updateMedicine(medicineId, 'name', selectedMedicine["Product Name"]);
    autoFillMedicineDetails(medicineId, selectedMedicine);
    setShowSuggestions(prev => ({ ...prev, [medicineId]: false }));
  };

  const addMedicine = () => {
    const newMedicine: Medicine = {
      id: Date.now().toString(),
      name: '',
      batchNumber: '',
      hsn: '',
      expiryDate: '',
      quantity: 0,
      pricePerUnit: 0,
      discountPercent: 0,
      gstPercent: 0,
      total: 0,
    };

    setInvoice(prevInvoice => ({
      ...prevInvoice,
      medicines: [...prevInvoice.medicines, newMedicine]
    }));
  };

  const removeMedicine = (medicineId: string) => {
    setInvoice(prevInvoice => {
      let updatedMedicines = prevInvoice.medicines.filter(medicine => medicine.id !== medicineId);
      if (updatedMedicines.length === 0) {
        updatedMedicines = [{
          id: Date.now().toString(),
          name: '',
          batchNumber: '',
          hsn: '',
          expiryDate: '',
          quantity: 0,
          pricePerUnit: 0,
          discountPercent: 0,
          gstPercent: 0,
          total: 0,
        }];
      }
      const grandTotal = calculateGrandTotal(updatedMedicines);
      return { ...prevInvoice, medicines: updatedMedicines, grandTotal };
    });
  };

  const generateBill = async () => {
    const isValid = 
      invoice.invoiceNumber.trim() !== '' &&
      invoice.supplierName.trim() !== '' &&
      invoice.supplierAddress.trim() !== '' &&
      invoice.supplierContact.trim() !== '' &&
      invoice.supplierGST.trim() !== '' &&
      invoice.billingDate.trim() !== '' &&  // ✅ check billingDate
      invoice.medicines.some(medicine => 
        medicine.name.trim() !== '' && 
        medicine.batchNumber.trim() !== '' &&
        medicine.hsn.trim() !== '' &&
        medicine.expiryDate.trim() !== '' &&
        medicine.quantity > 0 && 
        medicine.pricePerUnit > 0
      );

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields for the invoice and medicines.",
        variant: "destructive",
      });
      return;
    }

    try {
      const requestData = {
        billingDate: invoice.billingDate,   // ✅ send user date
        invoiceNumber: invoice.invoiceNumber,
        supplierName: invoice.supplierName,
        supplierAddress: invoice.supplierAddress,
        supplierContact: invoice.supplierContact,
        supplierGST: invoice.supplierGST,
        medicines: invoice.medicines,
        grandTotal: invoice.grandTotal,
      };

      await fetch(`${API_BASE_URL}/api/purchase/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      downloadPDF(invoice);

      toast({
        title: "Success",
        description: "Bill generated and downloaded!",
      });

      setInvoice({
        invoiceNumber: '',
        supplierName: '',
        supplierAddress: '',
        supplierContact: '',
        supplierGST: '',
        billingDate: '',   // reset date
        medicines: [{
          id: Date.now().toString(),
          name: '',
          batchNumber: '',
          hsn: '',
          expiryDate: '',
          quantity: 0,
          pricePerUnit: 0,
          discountPercent: 0,
          gstPercent: 0,
          total: 0,
        }],
        grandTotal: 0,
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Purchase Management</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Purchase Invoice
          </CardTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                value={invoice.invoiceNumber}
                onChange={(e) => updateInvoiceField('invoiceNumber', e.target.value)}
                placeholder="Enter invoice number"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Input
                id="supplierName"
                value={invoice.supplierName}
                onChange={(e) => updateInvoiceField('supplierName', e.target.value)}
                placeholder="Enter supplier name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="supplierContact">Supplier Contact *</Label>
              <Input
                id="supplierContact"
                value={invoice.supplierContact}
                onChange={(e) => updateInvoiceField('supplierContact', e.target.value)}
                placeholder="Enter contact number"
                className="mt-1"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="supplierAddress">Supplier Address *</Label>
              <Input
                id="supplierAddress"
                value={invoice.supplierAddress}
                onChange={(e) => updateInvoiceField('supplierAddress', e.target.value)}
                placeholder="Enter supplier address"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="supplierGST">GST No. *</Label>
              <Input
                id="supplierGST"
                value={invoice.supplierGST}
                onChange={(e) => updateInvoiceField('supplierGST', e.target.value)}
                placeholder="Enter GST number"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="billingDate">Billing Date *</Label>
              <Input
                id="billingDate"
                type="date"
                value={invoice.billingDate}
                onChange={(e) => updateInvoiceField('billingDate', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardHeader>

        {/* Medicines */}
        <CardContent className="space-y-4">
          {invoice.medicines.map((medicine, medicineIndex) => (
            <div key={medicine.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Medicine #{medicineIndex + 1}</h4>
                {invoice.medicines.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMedicine(medicine.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Medicine name with suggestions */}
                <div className="relative">
                  <Label htmlFor={`medicine-name-${medicine.id}`}>Medicine Name *</Label>
                  <Input
                    id={`medicine-name-${medicine.id}`}
                    value={medicine.name}
                    onChange={(e) => handleMedicineNameChange(medicine.id, e.target.value)}
                    placeholder="Enter medicine name"
                    className="mt-1"
                  />
                  {showSuggestions[medicine.id] && filteredSuggestions[medicine.id]?.length > 0 && (
                    <div
                      ref={el => suggestionRefs.current[medicine.id] = el}
                      className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1"
                    >
                      {filteredSuggestions[medicine.id].map((option) => (
                        <div
                          key={option._id}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => selectMedicine(medicine.id, option)}
                        >
                          {option["Product Name"]}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor={`batch-${medicine.id}`}>Batch Number *</Label>
                  <Input
                    id={`batch-${medicine.id}`}
                    value={medicine.batchNumber}
                    onChange={(e) => updateMedicine(medicine.id, 'batchNumber', e.target.value)}
                    placeholder="Enter batch number"
                    className="mt-1"
                  />
                </div>


                <div>
                  <Label htmlFor={`hsn-${medicine.id}`}>HSN *</Label>
                  <Input
                    id={`hsn-${medicine.id}`}
                    value={medicine.hsn}
                    onChange={(e) => updateMedicine(medicine.id, 'hsn', e.target.value)}
                    placeholder="Enter HSN code"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`expiry-${medicine.id}`}>Expiry Date *</Label>
                  <Input
                    id={`expiry-${medicine.id}`}
                    type="date"
                    value={medicine.expiryDate}
                    onChange={(e) => updateMedicine(medicine.id, 'expiryDate', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`quantity-${medicine.id}`}>Quantity *</Label>
                  <Input
                    id={`quantity-${medicine.id}`}
                    type="number"
                    min="0"
                    value={medicine.quantity || ''}
                    onChange={(e) => updateMedicine(medicine.id, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`price-${medicine.id}`}>M.R.P *</Label>
                  <Input
                    id={`price-${medicine.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={medicine.pricePerUnit || ''}
                    onChange={(e) => updateMedicine(medicine.id, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                    placeholder="Enter price per unit"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`discount-${medicine.id}`}>Discount (%)</Label>
                  <Input
                    id={`discount-${medicine.id}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={medicine.discountPercent || ''}
                    onChange={(e) => updateMedicine(medicine.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                    placeholder="Enter discount percentage"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`gst-${medicine.id}`}>GST (%)</Label>
                  <Input
                    id={`gst-${medicine.id}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={medicine.gstPercent || ''}
                    onChange={(e) => updateMedicine(medicine.id, 'gstPercent', parseFloat(e.target.value) || 0)}
                    placeholder="Enter GST percentage"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-end">
                  <div className="w-full">
                    <Label>Total Amount</Label>
                    <div className="mt-1 p-2 bg-white border rounded-md font-medium text-lg">
                      {(medicine.quantity * medicine.pricePerUnit).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addMedicine}
            className="w-full mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Medicine
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <div className="text-right">
          <div className="text-sm text-muted-foreground mb-1">Grand Total</div>
          <div className="text-2xl font-bold text-primary">{invoice.grandTotal.toFixed(2)}</div>
        </div>
      </div>

      <Separator />

      <div className="flex justify-center">
        <Button
          onClick={generateBill}
          size="lg"
          className="px-8 py-3 text-lg"
        >
          <FileText className="h-5 w-5 mr-2" />
          Generate Bill
        </Button>
      </div>
    </div>
  );
};

export default PurchaseForm;