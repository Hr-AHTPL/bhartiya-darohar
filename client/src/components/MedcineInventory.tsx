/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Textarea } from "@/components/ui/textarea";
import debounce from "lodash.debounce";
import API_BASE_URL from "@/config/api.config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Pill,
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  IndianRupee,
  Code,
  Search,
  X,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import PurchaseForm from "./PurchaseForm";

interface Medicine {
  id: string;
  Code: string;
  "Product Name": string;
  Unit: string;
  Company: string;
  Quantity: number;
  Price: number;
}

interface SaleMedicine {
  id: string;
  medicineName: string;
  batch: string;
  hsn: string;
  expiry: string;
  pricePerUnit: number;
  quantity: number;
  totalPrice: number;
}

interface Sale {
  id: number;
  patientId: string;
  patientName: string;
  medicines: SaleMedicine[];
  subtotal: number;
  sgst: number;
  cgst: number;
  totalAmount: number;
  saleDate: string;
}

const MedicineInventory = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  // ✅ ADD THIS STATE
  const [purchases, setPurchases] = useState<any[]>([]);
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/sale/view`);
        const data = await response.json();
        if (data.success) {
          setSales(data.sales);
        }
      } catch (error) {
        console.error("Failed to fetch sales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // ✅ ADD THIS useEffect TO FETCH PURCHASES
useEffect(() => {
  const fetchPurchases = async () => {
    try {
      console.log("📄 Fetching purchases from API...");
      const response = await fetch(`${API_BASE_URL}/api/purchase/view`);
      
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📦 Received purchases data:", data);
      
      if (data.success && Array.isArray(data.purchases)) {
        setPurchases(data.purchases);
        console.log(`✅ Loaded ${data.purchases.length} purchases`);
      } else {
        console.error("❌ API returned unexpected format:", data);
        setPurchases([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch purchases:", error);
      setPurchases([]);
    }
  };

  fetchPurchases();
}, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [salesCurrentPage, setSalesCurrentPage] = useState(1);
  const [salesItemsPerPage] = useState(10);

  const [isAddingMedicine, setIsAddingMedicine] = useState(false);
  const [isEditingMedicine, setIsEditingMedicine] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(
    null
  );
  const [isRecordingSale, setIsRecordingSale] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");

  const [newMedicine, setNewMedicine] = useState({
    code: "",
    productName: "",
    unit: "",
    company: "",
    quantity: "",
    price: "",
  });

  const [newSale, setNewSale] = useState({
    patientId: "",
    patientName: "",
    medicines: [],
    saleDate: new Date().toISOString().split("T")[0],
    discount: "", // ⬅ new
    discountApprovedBy: "", // ⬅ new
  });

  const [currentMedicine, setCurrentMedicine] = useState({
    medicineName: "",
    batch: "",
    hsn: "",
    expiry: "",
    pricePerUnit: "",
    quantity: "",
  });


  const [editSuggestions, setEditSuggestions] = useState([]);
const [showEditSuggestions, setShowEditSuggestions] = useState(false);
const editWrapperRef = useRef(null);
  
const [isEditingSale, setIsEditingSale] = useState(false);
const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
const [editSale, setEditSale] = useState({
  patientId: "",
  patientName: "",
  medicines: [],
  saleDate: "",
  discount: "",
  discountApprovedBy: "",
});
const [editCurrentMedicine, setEditCurrentMedicine] = useState({
  medicineName: "",
  batch: "",
  hsn: "",
  expiry: "",
  pricePerUnit: "",
  quantity: "",
});

  // Static min stock value as requested
  const MIN_STOCK = 10;

  const filteredMedicines = medicines.filter((medicine) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      medicine["Product Name"]?.toLowerCase().includes(searchLower) ||
      medicine.Code?.toString().toLowerCase().includes(searchLower) ||
      medicine.Company?.toLowerCase().includes(searchLower) ||
      medicine.Unit?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMedicines = filteredMedicines.slice(startIndex, endIndex);

  const salesTotalPages = Math.ceil(sales.length / salesItemsPerPage);
  const salesStartIndex = (salesCurrentPage - 1) * salesItemsPerPage;
  const salesEndIndex = salesStartIndex + salesItemsPerPage;
  const currentSales = sales.slice(salesStartIndex, salesEndIndex);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  const [closingStock, setClosingStock] = useState(935);
const [isEditingClosingStock, setIsEditingClosingStock] = useState(false);
const [editClosingStockValue, setEditClosingStockValue] = useState("");
const [closingStockYear, setClosingStockYear] = useState(new Date().getFullYear());
const [closingStockNotes, setClosingStockNotes] = useState("");
const [closingStockUpdatedBy, setClosingStockUpdatedBy] = useState("");

  const fetchSuggestions = debounce(async (query) => {
    try {
      if (!query.trim()) return setSuggestions([]);

      const res = await axios.get(`${API_BASE_URL}/medicine/view`);
      if (res.data.status === 1) {
        const filtered = res.data.medicineList.filter((med) =>
          med["Product Name"].toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Error fetching medicine list:", err);
    }
  }, 300);

  // Fetch suggestions for edit modal
const fetchEditSuggestions = debounce(async (query) => {
  try {
    if (!query.trim()) return setEditSuggestions([]);

    const res = await axios.get(`${API_BASE_URL}/medicine/view`);
    if (res.data.status === 1) {
      const filtered = res.data.medicineList.filter((med: any) =>
        med["Product Name"].toLowerCase().includes(query.toLowerCase())
      );
      setEditSuggestions(filtered);
      setShowEditSuggestions(true);
    }
  } catch (err) {
    console.error("Error fetching medicine list:", err);
  }
}, 300);

// Handle click outside for edit suggestions
useEffect(() => {
  function handleClickOutside(event: any) {
    if (editWrapperRef.current && !editWrapperRef.current.contains(event.target)) {
      setShowEditSuggestions(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// Handle edit suggestion click
const handleEditSuggestionClick = (med: any) => {
  setEditCurrentMedicine({
    ...editCurrentMedicine,
    medicineName: med["Product Name"],
    pricePerUnit: med.Price?.toString() || "",
  });
  setShowEditSuggestions(false);
};

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Update quantity of medicine in edit sale
const updateMedicineQuantityInEdit = (medicineId: string, newQuantity: number) => {
  setEditSale({
    ...editSale,
    medicines: editSale.medicines.map((med) =>
      med.id === medicineId
        ? {
            ...med,
            quantity: newQuantity,
            totalPrice: newQuantity * med.pricePerUnit,
          }
        : med
    ),
  });
};

// Update price of medicine in edit sale
const updateMedicinePriceInEdit = (medicineId: string, newPrice: number) => {
  setEditSale({
    ...editSale,
    medicines: editSale.medicines.map((med) =>
      med.id === medicineId
        ? {
            ...med,
            pricePerUnit: newPrice,
            totalPrice: med.quantity * newPrice,
          }
        : med
    ),
  });
};

  // Generate page numbers for sales pagination
  const getSalesPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      salesCurrentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(salesTotalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Fetch medicines from API
  
    const fetchMedicines = async () => {
  try {
    setLoading(true);
    console.log("Fetching medicines from API...");
    const response = await axios.get(`${API_BASE_URL}/medicine/view`);
    console.log("API Response:", response.data);

    let medicineData = [];

    if (response.data && Array.isArray(response.data.medicineList)) {
      medicineData = response.data.medicineList;
    } else {
      console.error("Unexpected API response format:", response.data);
      throw new Error(
        "API returned unexpected data format - medicineList not found"
      );
    }

    const transformedData = medicineData.map(
      (item: any, index: number) => ({
        id: item.Code || `med-${index}`,
        Code: item.Code || "",
        "Product Name": item["Product Name"] || "",
        Unit: item.Unit || "",
        Company: item.Company || "",
        Quantity: Number(item.Quantity) || 0,
        Price: Number(item.Price) || 0,
      })
    );

    const sortedData = transformedData.sort((a, b) => {
      const codeA = isNaN(a.Code) ? a.Code : Number(a.Code);
      const codeB = isNaN(b.Code) ? b.Code : Number(b.Code);
      return codeA > codeB ? 1 : codeA < codeB ? -1 : 0;
    });

    console.log("Sorted data:", sortedData);
    setMedicines(sortedData);
    setError(null);
  } catch (err) {
    console.error("Error fetching medicines:", err);
    setError(
      "Failed to fetch medicines from API. Please check if the API server is running."
    );
    setMedicines([]);
  } finally {
    setLoading(false);
  }
};

 useEffect(() => {
  fetchMedicines();
}, []);

  const [salesSummary, setSalesSummary] = useState({
    todayTotal: 0,
    monthlyTotal: 0,
    overallTotal: 0,
  });

  useEffect(() => {
    const fetchSalesSummary = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/sale/view`);
        const salesData = res.data.sales;

        const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        let todayTotal = 0,
          monthlyTotal = 0,
          overallTotal = 0;

        for (const sale of salesData) {
          const saleDate = new Date(sale.saleDate);
          overallTotal += sale.totalAmount;

          if (saleDate.toISOString().split("T")[0] === today) {
            todayTotal += sale.totalAmount;
          }

          if (
            saleDate.getMonth() === currentMonth &&
            saleDate.getFullYear() === currentYear
          ) {
            monthlyTotal += sale.totalAmount;
          }
        }

        setSalesSummary({
          todayTotal,
          monthlyTotal,
          overallTotal,
        });
      } catch (err) {
        console.error("Failed to fetch sales summary", err);
      }
    };

    fetchSalesSummary();
  }, []);

  useEffect(() => {
  const fetchClosingStock = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await axios.get(
        `${API_BASE_URL}/api/closing-stock/current?year=${currentYear}`
      );
      
      if (response.data.success) {
        setClosingStock(response.data.data.closingStock);
        setClosingStockYear(response.data.data.year);
        setClosingStockNotes(response.data.data.notes || "");
        setClosingStockUpdatedBy(response.data.data.lastUpdatedBy || "");
      }
    } catch (error) {
      console.error("Failed to fetch closing stock:", error);
    }
  };

  fetchClosingStock();
}, []);


// Delete Sale Handler
const handleDeleteSale = async (saleId: string) => {
  if (!confirm("Are you sure you want to delete this sale? The stock will be restored to inventory.")) {
    return;
  }

  try {
    const response = await axios.delete(`${API_BASE_URL}/api/sale/${saleId}`);
    
    if (response.status === 200) {
      alert("Sale deleted successfully! Stock has been restored.");
      
      // Refresh sales list
      const salesResponse = await fetch(`${API_BASE_URL}/api/sale/view`);
      const data = await salesResponse.json();
      if (data.success) {
        setSales(data.sales);
      }
      
      // Refresh medicine inventory
      fetchMedicines();
    }
  } catch (error: any) {
    console.error("Error deleting sale:", error);
    alert("Failed to delete sale: " + (error.response?.data?.message || error.message));
  }
};

// Edit Sale Handler
const handleEditSale = async (saleId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/sale/${saleId}`);
    
    if (response.data.success) {
      const sale = response.data.sale;
      setEditingSaleId(sale._id);
      setEditSale({
        patientId: sale.patientId,
        patientName: sale.patientName,
        medicines: sale.medicines,
        saleDate: sale.saleDate,
        discount: sale.discount?.toString() || "",
        discountApprovedBy: sale.discountApprovedBy || "",
      });
      setIsEditingSale(true);
    }
  } catch (error: any) {
    console.error("Error fetching sale:", error);
    alert("Failed to load sale details: " + (error.response?.data?.message || error.message));
  }
};

// Update Sale Handler
const handleUpdateSale = async () => {
  if (!editSale.patientId || !editSale.patientName || editSale.medicines.length === 0) {
    alert("Please fill in all required fields and add at least one medicine.");
    return;
  }

  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/sale/${editingSaleId}`,
      {
        patientId: editSale.patientId,
        patientName: editSale.patientName,
        saleDate: editSale.saleDate,
        medicines: editSale.medicines,
        discount: parseFloat(editSale.discount) || 0,
        discountApprovedBy: editSale.discountApprovedBy,
      }
    );

    if (response.status === 200) {
      alert("Sale updated successfully!");
      setIsEditingSale(false);
      setEditingSaleId(null);
      setEditSale({
        patientId: "",
        patientName: "",
        medicines: [],
        saleDate: "",
        discount: "",
        discountApprovedBy: "",
      });
      setEditCurrentMedicine({
        medicineName: "",
        batch: "",
        hsn: "",
        expiry: "",
        pricePerUnit: "",
        quantity: "",
      });
      
      // Refresh sales list
      const salesResponse = await fetch(`${API_BASE_URL}/api/sale/view`);
      const data = await salesResponse.json();
      if (data.success) {
        setSales(data.sales);
      }
      
      // Refresh medicine inventory
      fetchMedicines();
    }
  } catch (error: any) {
    console.error("Error updating sale:", error);
    alert("Failed to update sale: " + (error.response?.data?.message || error.message));
  }
};

// Add Medicine to Edit Sale
const addMedicineToEditSale = () => {
  if (
    !editCurrentMedicine.medicineName ||
    !editCurrentMedicine.pricePerUnit ||
    !editCurrentMedicine.quantity
  ) {
    alert("Please fill in medicine name, price, and quantity.");
    return;
  }

  const newMed = {
    id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ✅ UNIQUE ID
    medicineName: editCurrentMedicine.medicineName,
    batch: editCurrentMedicine.batch,
    hsn: editCurrentMedicine.hsn,
    expiry: editCurrentMedicine.expiry,
    pricePerUnit: parseFloat(editCurrentMedicine.pricePerUnit),
    quantity: parseFloat(editCurrentMedicine.quantity),
    totalPrice:
      parseFloat(editCurrentMedicine.pricePerUnit) *
      parseFloat(editCurrentMedicine.quantity),
  };

  setEditSale({
    ...editSale,
    medicines: [...editSale.medicines, newMed],
  });

  setEditCurrentMedicine({
    medicineName: "",
    batch: "",
    hsn: "",
    expiry: "",
    pricePerUnit: "",
    quantity: "",
  });
  
  setShowEditSuggestions(false);
};

// Remove Medicine from Edit Sale
const removeMedicineFromEditSale = (medicineId: string) => {
  setEditSale({
    ...editSale,
    medicines: editSale.medicines.filter((m) => m.id !== medicineId),
  });
};

// Calculate Edit Sale Total
const calculateEditSaleTotal = () => {
  const subtotal = editSale.medicines.reduce(
    (sum, med) => sum + med.totalPrice,
    0
  );
  const discountAmount = (subtotal * (parseFloat(editSale.discount) || 0)) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const sgst = subtotal * 0.025;
  const cgst = subtotal * 0.025;
  const totalBeforeRound = subtotalAfterDiscount;
  const totalAmount = Math.round(totalBeforeRound);
  const roundoff = totalAmount - totalBeforeRound;

  return {
    subtotal,
    discountAmount,
    sgst,
    cgst,
    roundoff,
    totalAmount,
  };
};




const handleUpdateClosingStock = async () => {
  if (!editClosingStockValue || editClosingStockValue.trim() === "") {
    alert("⚠️ Please enter a valid closing stock value");
    return;
  }

  if (!closingStockUpdatedBy || closingStockUpdatedBy.trim() === "") {
    alert("⚠️ Please enter your name in the 'Updated By' field");
    return;
  }

  try {
    console.log("📤 Sending update request with data:", {
      year: closingStockYear,
      closingStock: parseInt(editClosingStockValue),
      lastUpdatedBy: closingStockUpdatedBy,
      notes: closingStockNotes
    });

    const response = await axios.put(
      `${API_BASE_URL}/api/closing-stock/update`,
      {
        year: closingStockYear,
        closingStock: parseInt(editClosingStockValue),
        lastUpdatedBy: closingStockUpdatedBy,
        notes: closingStockNotes
      }
    );

    console.log("📥 Received response:", response.data);

    if (response.data.success) {
      setClosingStock(parseInt(editClosingStockValue));
      setIsEditingClosingStock(false);
      setEditClosingStockValue("");
      alert(`✅ Closing stock for ${closingStockYear} updated successfully to ${parseInt(editClosingStockValue).toLocaleString()} units!`);
    } else {
      alert(`❌ ${response.data.message || 'Failed to update closing stock'}`);
    }
  } catch (error) {
    console.error("❌ Error updating closing stock:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
    
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
    alert(`❌ Failed to update closing stock.\n\nError: ${errorMessage}`);
  }
};

  const handleAddMedicine = async () => {
    if (newMedicine.productName && newMedicine.quantity) {
      const medicine: Medicine = {
        id: Date.now().toString(),
        Code: newMedicine.code || Date.now().toString(),
        "Product Name": newMedicine.productName,
        Unit: newMedicine.unit,
        Company: newMedicine.company,
        Quantity: parseInt(newMedicine.quantity),
        Price: parseFloat(newMedicine.price) || 0,
      };

      try {
        const res = await axios.post(
          `${API_BASE_URL}/medicine/insert`,
          medicine
        );
        if (res.data.status === 1) {
          setMedicines((prev: Medicine[]) => [...prev, medicine]);
          resetMedicineForm();
          setIsAddingMedicine(false);
          alert("Medicine added successfully!");
        } else {
          alert("Error: " + res.data.message);
        }
      } catch (error) {
        console.error("Error adding medicine:", error);
        alert("Something went wrong while adding medicine.");
      }
    }
  };

  const handleEditMedicine = async () => {
    if (newMedicine.productName && newMedicine.quantity && editingMedicineId) {
      const updatedMedicine: Medicine = {
        id: editingMedicineId,
        Code: newMedicine.code,
        "Product Name": newMedicine.productName,
        Unit: newMedicine.unit,
        Company: newMedicine.company,
        Quantity: parseInt(newMedicine.quantity),
        Price: parseFloat(newMedicine.price) || 0,
      };

      try {
        const response = await axios.put(
          `${API_BASE_URL}/medicine/update/${newMedicine.code}`,
          updatedMedicine
        );

        if (response.data.status === 1) {
          setMedicines(
            medicines.map((med) =>
              med.id === editingMedicineId ? updatedMedicine : med
            )
          );

          resetMedicineForm();
          setIsEditingMedicine(false);
          setEditingMedicineId(null);
        } else {
          alert(response.data.message || "Failed to update medicine");
        }
      } catch (error) {
        console.error("Error updating medicine:", error);
        alert("Error updating medicine. Please try again.");
      }
    }
  };

  const resetMedicineForm = () => {
    setNewMedicine({
      code: "",
      productName: "",
      unit: "",
      company: "",
      quantity: "",
      price: "",
    });
  };

  const openEditModal = (medicine: Medicine) => {
    setNewMedicine({
      code: medicine.Code,
      productName: medicine["Product Name"],
      unit: medicine.Unit,
      company: medicine.Company,
      quantity: medicine.Quantity.toString(),
      price: medicine.Price.toString(),
    });
    setEditingMedicineId(medicine.id);
    setIsEditingMedicine(true);
  };

  const handleDeleteMedicine = async (Code: string) => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/medicine/delete/${Code}`
      );
      if (res.data.status === 1) {
        setMedicines((prev) => prev.filter((med) => med.Code !== Code));
        alert("Medicine deleted successfully!");
      } else {
        alert("Delete failed: " + res.data.message);
      }
    } catch (err) {
      console.error("Error deleting medicine:", err);
      alert("Something went wrong while deleting medicine.");
    }
  };

  const getLowStockMedicines = () => {
    return medicines.filter((med) => med.Quantity <= MIN_STOCK);
  };

  const getCurrentStock = () => {
  return medicines.reduce((total, med) => total + (med.Quantity || 0), 0);
};
  const handleModalCancel = () => {
    resetMedicineForm();
    setIsAddingMedicine(false);
    setIsEditingMedicine(false);
    setEditingMedicineId(null);
  };

  // Sale related functions
  
const addMedicineToSale = () => {
  if (
    !currentMedicine.medicineName ||
    !currentMedicine.pricePerUnit ||
    !currentMedicine.quantity
  ) {
    alert("Please fill in medicine name, price, and quantity.");
    return;
  }

  const newMed = {
    id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ✅ UNIQUE ID
    medicineName: currentMedicine.medicineName,
    batch: currentMedicine.batch,
    hsn: currentMedicine.hsn,
    expiry: currentMedicine.expiry,
    pricePerUnit: parseFloat(currentMedicine.pricePerUnit),
    quantity: parseFloat(currentMedicine.quantity),
    totalPrice:
      parseFloat(currentMedicine.pricePerUnit) *
      parseFloat(currentMedicine.quantity),
  };

  setNewSale({
    ...newSale,
    medicines: [...newSale.medicines, newMed],
  });

  setCurrentMedicine({
    medicineName: "",
    batch: "",
    hsn: "",
    expiry: "",
    pricePerUnit: "",
    quantity: "",
  });
  
  setShowSuggestions(false);
};

  const removeMedicineFromSale = (medicineId: string) => {
    setNewSale({
      ...newSale,
      medicines: newSale.medicines.filter((med) => med.id !== medicineId),
    });
  };

  const calculateSaleTotal = () => {
  const subtotal = newSale.medicines.reduce(
    (total, med) => total + med.totalPrice,
    0
  );

  const discountPercent =
    !isNaN(parseFloat(newSale.discount)) && newSale.discount.trim() !== ""
      ? parseFloat(newSale.discount)
      : 0;

  const discountAmount = (subtotal * discountPercent) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;

  // GST calculated but not added to total
  const sgst = subtotal * 0.025;
  const cgst = subtotal * 0.025;

  const totalAmount = Math.round(subtotalAfterDiscount);
  const roundoff = totalAmount - subtotalAfterDiscount;

  return { subtotal, discountAmount, sgst, cgst, totalAmount, roundoff };
};

  const [enquiryList, setEnquiryList] = useState([]);
  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/website/enquiry/view`
        );
        if (Array.isArray(response.data.enquiryList)) {
          setEnquiryList(response.data.enquiryList);
        }
      } catch (err) {
        console.error("Failed to fetch patient list", err);
      }
    };

    fetchEnquiries();
  }, []);

  useEffect(() => {
    const found = enquiryList.find((p) => p.idno === newSale.patientId);
    if (found) {
      const fullName = `${found.firstName} ${found.lastName}`.trim();
      setNewSale((prev) => ({ ...prev, patientName: fullName }));
    } else {
      setNewSale((prev) => ({ ...prev, patientName: "" }));
    }
  }, [newSale.patientId, enquiryList]);

  const getNextInvoiceNumber = () => {
    const lastInvoice = localStorage.getItem("lastInvoiceNumber");
    const next = lastInvoice ? parseInt(lastInvoice) + 1 : 1001;
    localStorage.setItem("lastInvoiceNumber", next.toString());
    return `BD/2025-26/M/${next}`; // ✅ Return with prefix
  };

  const generateExcelReceipt = async (sale) => {
  const invoiceNumber = getNextInvoiceNumber();

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
  const generateBill = (startRow: number) => {
    let rowIdx = startRow;

    // -------------------- Clinic Header --------------------
    const headerStyle = {
      alignment: { horizontal: "center" },
      font: { bold: true, size: 14 },
    };

    worksheet.mergeCells(`A${rowIdx}:G${rowIdx}`);
    worksheet.getCell(`A${rowIdx}`).value = "IMMUNITY CLINIC";
    Object.assign(worksheet.getCell(`A${rowIdx}`), headerStyle);
    rowIdx++;

    worksheet.mergeCells(`A${rowIdx}:G${rowIdx}`);
    worksheet.getCell(`A${rowIdx}`).value =
      "D-76, Ground Floor, besides LPS GLOBAL SCHOOL, BI";
    worksheet.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };
    rowIdx++;

    worksheet.mergeCells(`A${rowIdx}:G${rowIdx}`);
    worksheet.getCell(`A${rowIdx}`).value =
      "Phone: 0120-4026100, 9625963298 | Email: immunityclinic0@gmail.com";
    worksheet.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };
    rowIdx++;

    worksheet.mergeCells(`A${rowIdx}:G${rowIdx}`);
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
        med.batch,
        med.hsn,
        med.expiry,
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

const discountPercent = parseFloat(sale?.discount) || 0;
const discountAmount = (sale.subtotal * discountPercent) / 100;

if (discountPercent > 0) {
  addTotalRow(`Discount ${discountPercent}%:`, `- ₹${discountAmount.toFixed(2)}`);
}

const afterDiscount = sale.subtotal - discountAmount;
const sgst = sale.subtotal * 0.025;
const cgst = sale.subtotal * 0.025;

addTotalRow("SGST 2.5%:", `₹${sgst.toFixed(2)}`);
addTotalRow("CGST 2.5%:", `₹${cgst.toFixed(2)}`);

const roundoff = Math.round(afterDiscount) - afterDiscount;
addTotalRow("Roundoff:", `₹${roundoff.toFixed(2)}`);

addTotalRow("GRAND TOTAL:", `₹${Math.round(afterDiscount).toFixed(2)}`);

    // -------------------- Social Media Links (Bottom Left) --------------------
    rowIdx += 2; // Add spacing
    
    const socialHeaderRow = worksheet.addRow(["Also Follow Us On:"]);
    socialHeaderRow.getCell(1).font = { bold: true, size: 11 };
    socialHeaderRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    rowIdx++;

    const instaRow = worksheet.addRow(["Instagram: https://www.instagram.com/clinicimmunity?igsh=YnhobzRyNTEwOXV5"]);
    instaRow.getCell(1).font = { size: 10, color: { argb: "FF000000" }, underline:false };
    instaRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    rowIdx++;

    const fbRow = worksheet.addRow(["Facebook: https://www.facebook.com/share/p/1Fjjh1KvJi/"]);
    fbRow.getCell(1).font = { size: 10, color: { argb: "FF000000" }, underline:false };
    fbRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    rowIdx++;

    return rowIdx;
  };

  // -------------------- Generate First Bill --------------------
  let currentRow = generateBill(1);

  // -------------------- Add Separator --------------------
  currentRow += 2; // Add spacing
  worksheet.addRow([]);
  currentRow++;
  
  // Add dashed line separator
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
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

  // -------------------- Export File --------------------
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Sale_Invoice_${invoiceNumber}.xlsx`);
};

  const handleRecordSale = async () => {
  if (
    newSale.patientId &&
    newSale.patientName &&
    newSale.medicines.length > 0
  ) {
    const { subtotal, sgst, cgst, totalAmount } = calculateSaleTotal();

    const sale = {
      patientId: newSale.patientId,
      patientName: newSale.patientName,
      medicines: newSale.medicines,
      subtotal,
      sgst,
      cgst,
      totalAmount,
      saleDate: newSale.saleDate,
      discount: newSale.discount, // ✅ Include discount
      discountApprovedBy: newSale.discountApprovedBy, // ✅ Include approver
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/sale/record`,
        sale
      );
      const updatedSales = await axios.get(
        `${API_BASE_URL}/api/sale/view`
      );
      setSales(updatedSales.data.sales);
      await generateExcelReceipt(sale);

      // Reset form
      setNewSale({
        patientId: "",
        patientName: "",
        medicines: [],
        saleDate: new Date().toISOString().split("T")[0],
        discount: "", // ✅ Reset
        discountApprovedBy: "", // ✅ Reset
      });
      setIsRecordingSale(false);

      alert("Invoice generated successfully!");
    } catch (error) {
      console.error("Error recording sale:", error);
      alert("Failed to record sale. Please try again.");
    }
  } else {
    alert("Please fill patient details and add at least one medicine");
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading medicines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-red-100">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="flex bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-2xl p-2">
            <Button
              variant={activeTab === "purchase" ? "default" : "ghost"}
              onClick={() => setActiveTab("purchase")}
              className={`rounded-xl font-bold px-6 py-3 ${
                activeTab === "purchase"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                  : ""
              }`}
            >
              <IndianRupee className="h-4 w-4 mr-2" />
              Purchase
            </Button>
            <Button
              variant={activeTab === "inventory" ? "default" : "ghost"}
              onClick={() => setActiveTab("inventory")}
              className={`rounded-xl font-bold px-6 py-3 ${
                activeTab === "inventory"
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                  : ""
              }`}
            >
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </Button>
            <Button variant={activeTab === "sales" ? "default" : "ghost"}
              onClick={() => setActiveTab("sales")}
              className={`rounded-xl font-bold px-6 py-3 ${
                activeTab === "sales"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                  : ""
              }`}
            >
              <IndianRupee className="h-4 w-4 mr-2" />
              Earnings
            </Button>
          </div>
        </div>

        {activeTab === "inventory" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <p className="text-gray-600 font-medium text-sm">
        Closing Stock ({closingStockYear})
      </p>
      <div 
        className="bg-cyan-50 p-2 rounded-lg cursor-pointer hover:bg-cyan-100 transition-colors"
        onClick={() => {
          setEditClosingStockValue(closingStock.toString());
          setIsEditingClosingStock(true);
        }}
        title="Edit closing stock"
      >
        <Package className="h-5 w-5 text-cyan-500" />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-1">
      {closingStock}
    </p>
    <p className="text-gray-500 text-sm font-medium">
      Last updated by: {closingStockUpdatedBy || "N/A"}
    </p>
  </CardContent>
</Card>

              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-gray-600 font-medium text-sm">
                        Total Purchases
                      </p>
                      <div className="bg-green-50 p-2 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {purchases.length}
                    </p>
                    <p className="text-green-600 text-sm font-medium">
                      Purchase invoices recorded
                    </p>
                  </CardContent>
                </Card>

              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 font-medium text-sm">
                      Total Sales
                    </p>
                    <div className="bg-yellow-50 p-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-yellow-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {sales.length}
                  </p>
                  <p className="text-orange-600 text-sm font-medium">
                      Sales invoices recorded
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 font-medium text-sm">
                      Current Stock
                    </p>
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <Package className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {Math.floor(getCurrentStock())}
                  </p>
                  <p className="text-gray-500 text-sm font-medium">
                    Total units in inventory
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search Card */}
            <Card className="bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent flex items-center">
                  <Pill className="h-6 w-6 mr-2 text-orange-600" />
                  Ayurveda Medicine Inventory
                </CardTitle>
                <div className="flex items-center space-x-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400" />
                    <Input
                      type="text"
                      placeholder="Search medicines..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 w-64 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    onClick={() => setIsAddingMedicine(true)}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medicine
                  </Button>
                </div>
              </CardHeader>

              {/* Edit Closing Stock Modal */}
{isEditingClosingStock && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-cyan-800">
          Edit Closing Stock for {closingStockYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="closingStockValue" className="text-cyan-700 font-semibold">
            Closing Stock Value *
          </Label>
          <Input
            id="closingStockValue"
            type="number"
            value={editClosingStockValue}
            onChange={(e) => setEditClosingStockValue(e.target.value)}
            placeholder="Enter closing stock quantity"
            className="border-cyan-200 focus:border-cyan-400 focus:ring-cyan-200"
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="closingStockYear" className="text-cyan-700 font-semibold">
            Year
          </Label>
          <Input
            id="closingStockYear"
            type="number"
            value={closingStockYear}
            onChange={(e) => setClosingStockYear(parseInt(e.target.value))}
            placeholder="Enter year"
            className="border-cyan-200 focus:border-cyan-400 focus:ring-cyan-200"
            min="2000"
            max="2100"
          />
        </div>

        <div>
          <Label htmlFor="updatedBy" className="text-cyan-700 font-semibold">
            Updated By
          </Label>
          <Input
            id="updatedBy"
            value={closingStockUpdatedBy}
            onChange={(e) => setClosingStockUpdatedBy(e.target.value)}
            placeholder="Enter your name"
            className="border-cyan-200 focus:border-cyan-400 focus:ring-cyan-200"
          />
        </div>

        <div>
          <Label htmlFor="closingStockNotes" className="text-cyan-700 font-semibold">
            Notes (Optional)
          </Label>
          <Textarea
            id="closingStockNotes"
            value={closingStockNotes}
            onChange={(e) => setClosingStockNotes(e.target.value)}
            placeholder="Add any notes about this closing stock..."
            className="border-cyan-200 focus:border-cyan-400 focus:ring-cyan-200"
            rows={3}
          />
        </div>

        <div className="bg-cyan-50 p-3 rounded-lg">
          <p className="text-sm text-cyan-700">
            <strong>Current Stock:</strong> {Math.floor(getCurrentStock())} units
          </p>
          <p className="text-xs text-cyan-600 mt-1">
            This is the fixed closing stock for year {closingStockYear}. It can be different from current inventory.
          </p>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleUpdateClosingStock}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 rounded-2xl"
          >
            Update Closing Stock
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsEditingClosingStock(false);
              setEditClosingStockValue("");
            }}
            className="flex-1 border-cyan-300 text-cyan-600 hover:bg-cyan-50 font-bold py-3 rounded-2xl"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}

              {/* Show search prompt when no search term is entered */}
              {searchTerm.trim() === "" && (
                <CardContent className="text-center py-20">
                  <div className="p-8 bg-gradient-to-br from-orange-100 to-amber-300 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-2xl">
                    <Search className="h-16 w-16 text-orange-600" />
                  </div>
                  <h3 className="text-3xl font-black text-orange-900 mb-4">
                    Start Your Medicine Search
                  </h3>
                  <p className="text-xl text-orange-700 font-semibold">
                    Enter a medicine name, code, or supplier to begin searching
                  </p>
                </CardContent>
              )}

              {/* Medicine Inventory Table - only show when search is active */}
              {searchTerm.trim() !== "" && (
                <CardContent>
                  <div className="space-y-4">
                    {/* Search Results Info */}
                    <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                      Found {filteredMedicines.length} medicine(s) matching "
                      {searchTerm}"
                    </div>

                    {/* Pagination Info - only show if there are results */}
                    {filteredMedicines.length > 0 && (
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>
                          Showing {startIndex + 1} to{" "}
                          {Math.min(endIndex, filteredMedicines.length)} of{" "}
                          {filteredMedicines.length} medicines
                          {searchTerm &&
                            ` (filtered from ${medicines.length} total)`}
                        </span>
                        <span>
                          Page {currentPage} of {totalPages}
                        </span>
                      </div>
                    )}

                    {/* Show table only if there are results */}
                    {filteredMedicines.length > 0 ? (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Code</TableHead>
                              <TableHead>Medicine Name</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Supplier</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Price (₹)</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentMedicines.map((medicine) => (
                              <TableRow key={medicine.id}>
                                <TableCell className="font-medium">
                                  {medicine.Code}
                                </TableCell>
                                <TableCell>
                                  {medicine["Product Name"]}
                                </TableCell>
                                <TableCell>{medicine.Unit}</TableCell>
                                <TableCell>{medicine.Company}</TableCell>
                                <TableCell>{medicine.Quantity}</TableCell>
                                <TableCell>₹{medicine.Price}</TableCell>
                                <TableCell>
                                  {medicine.Quantity <= MIN_STOCK ? (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">
                                      In Stock
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditModal(medicine)}
                                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteMedicine(medicine.Code)
                                      }
                                      className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                  }
                                  className={
                                    currentPage === 1
                                      ? "pointer-events-none opacity-50"
                                      : "cursor-pointer hover:bg-orange-50"
                                  }
                                />
                              </PaginationItem>

                              {currentPage > 3 && (
                                <>
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() => setCurrentPage(1)}
                                      className="cursor-pointer hover:bg-orange-50"
                                    >
                                      1
                                    </PaginationLink>
                                  </PaginationItem>
                                  {currentPage > 4 && (
                                    <PaginationItem>
                                      <PaginationEllipsis />
                                    </PaginationItem>
                                  )}
                                </>
                              )}

                              {getPageNumbers().map((pageNumber) => (
                                <PaginationItem key={pageNumber}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(pageNumber)}
                                    isActive={currentPage === pageNumber}
                                    className={`cursor-pointer ${
                                      currentPage === pageNumber
                                        ? "bg-orange-500 text-white"
                                        : "hover:bg-orange-50"
                                    }`}
                                  >
                                    {pageNumber}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}

                              {currentPage < totalPages - 2 && (
                                <>
                                  {currentPage < totalPages - 3 && (
                                    <PaginationItem>
                                      <PaginationEllipsis />
                                    </PaginationItem>
                                  )}
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() => setCurrentPage(totalPages)}
                                      className="cursor-pointer hover:bg-orange-50"
                                    >
                                      {totalPages}
                                    </PaginationLink>
                                  </PaginationItem>
                                </>
                              )}

                              <PaginationItem>
                                <PaginationNext
                                  onClick={() =>
                                    setCurrentPage(
                                      Math.min(totalPages, currentPage + 1)
                                    )
                                  }
                                  className={
                                    currentPage === totalPages
                                      ? "pointer-events-none opacity-50"
                                      : "cursor-pointer hover:bg-orange-50"
                                  }
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </>
                    ) : (
                      /* No medicines found message */
                      <div className="text-center py-20">
                        <div className="p-8 bg-gradient-to-br from-orange-100 to-amber-300 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-2xl">
                          <Pill className="h-16 w-16 text-orange-600" />
                        </div>
                        <h3 className="text-3xl font-black text-orange-900 mb-4">
                          No medicines found
                        </h3>
                        <p className="text-xl text-orange-700 font-semibold">
                          Try adjusting your search criteria or check the
                          spelling
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </>
        )}
        {activeTab==="purchase" && (
          <PurchaseForm/>
        )}
        {activeTab === "sales" && (
          <>
            <div className="flex flex-wrap md:flex-nowrap gap-4 mb-6">
              <Card className="flex-1 bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-300 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-orange-800">
                    Today's Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-extrabold text-orange-600">
                    ₹{salesSummary.todayTotal.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="flex-1 bg-gradient-to-r from-amber-100 to-amber-200 border-2 border-amber-300 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-amber-800">
                    Monthly Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-extrabold text-amber-600">
                    ₹{salesSummary.monthlyTotal.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="flex-1 bg-gradient-to-r from-red-100 to-red-200 border-2 border-red-300 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-red-800">
                    Total Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-extrabold text-red-600">
                    ₹{salesSummary.overallTotal.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 bg-clip-text text-transparent flex items-center">
                  <ShoppingCart className="h-6 w-6 mr-2 text-orange-600" />
                  Sales History
                </CardTitle>
                <Button
                  onClick={() => setIsRecordingSale(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sales Pagination Info */}
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>
                      Showing {salesStartIndex + 1} to{" "}
                      {Math.min(salesEndIndex, sales.length)} of {sales.length}{" "}
                      sales
                    </span>
                    <span>
                      Page {salesCurrentPage} of {salesTotalPages}
                    </span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Medicines Count</TableHead>
                        <TableHead>Subtotal (₹)</TableHead>
                        <TableHead>SGST (₹)</TableHead>
                        <TableHead>CGST (₹)</TableHead>
                        <TableHead>Total Amount (₹)</TableHead>
                        <TableHead>Sale Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSales.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center text-gray-500 py-8"
                          >
                            No sales to display.
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentSales.map((sale) => (
  <TableRow key={sale._id}>
    <TableCell className="font-medium">
      {sale.patientId}
    </TableCell>
    <TableCell>{sale.patientName}</TableCell>
    <TableCell>{sale.medicines?.length || 0}</TableCell>
    <TableCell>₹{sale.subtotal?.toFixed(2) || '0.00'}</TableCell>
    <TableCell>₹{sale.sgst?.toFixed(2) || '0.00'}</TableCell>
    <TableCell>₹{sale.cgst?.toFixed(2) || '0.00'}</TableCell>
    <TableCell className="font-bold text-orange-600">
      ₹{sale.totalAmount?.toFixed(2) || '0.00'}
    </TableCell>
    <TableCell>{sale.saleDate}</TableCell>
    <TableCell>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditSale(sale._id)}
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
          title="Edit Sale"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDeleteSale(sale._id)}
          className="text-red-600 border-red-300 hover:bg-red-50"
          title="Delete Sale"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
))
                      )}
                    </TableBody>
                  </Table>

                  {/* Sales Pagination Controls */}
                  {salesTotalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setSalesCurrentPage(
                                Math.max(1, salesCurrentPage - 1)
                              )
                            }
                            className={
                              salesCurrentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer hover:bg-orange-50"
                            }
                          />
                        </PaginationItem>

                        {salesCurrentPage > 3 && (
                          <>
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => setSalesCurrentPage(1)}
                                className="cursor-pointer hover:bg-orange-50"
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                            {salesCurrentPage > 4 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                          </>
                        )}

                        {getSalesPageNumbers().map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => setSalesCurrentPage(pageNumber)}
                              isActive={salesCurrentPage === pageNumber}
                              className={`cursor-pointer ${
                                salesCurrentPage === pageNumber
                                  ? "bg-orange-500 text-white"
                                  : "hover:bg-orange-50"
                              }`}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        {salesCurrentPage < salesTotalPages - 2 && (
                          <>
                            {salesCurrentPage < salesTotalPages - 3 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={() =>
                                  setSalesCurrentPage(salesTotalPages)
                                }
                                className="cursor-pointer hover:bg-orange-50"
                              >
                                {salesTotalPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setSalesCurrentPage(
                                Math.min(salesTotalPages, salesCurrentPage + 1)
                              )
                            }
                            className={
                              salesCurrentPage === salesTotalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer hover:bg-orange-50"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Add/Edit Medicine Modal */}
        {(isAddingMedicine || isEditingMedicine) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-orange-800">
                  {isEditingMedicine ? "Edit Medicine" : "Add New Medicine"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label
                    htmlFor="code"
                    className="text-orange-700 font-semibold"
                  >
                    Code
                  </Label>
                  <Input
                    id="code"
                    value={newMedicine.code}
                    onChange={(e) =>
                      setNewMedicine({ ...newMedicine, code: e.target.value })
                    }
                    placeholder="Enter medicine code"
                    className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="productName"
                    className="text-orange-700 font-semibold"
                  >
                    Medicine Name
                  </Label>
                  <Input
                    id="productName"
                    value={newMedicine.productName}
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        productName: e.target.value,
                      })
                    }
                    placeholder="Enter medicine name"
                    className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="unit"
                    className="text-orange-700 font-semibold"
                  >
                    Category
                  </Label>
                  <Input
                    id="unit"
                    value={newMedicine.unit}
                    onChange={(e) =>
                      setNewMedicine({ ...newMedicine, unit: e.target.value })
                    }
                    placeholder="Enter category (e.g., TAB, SYP, CHUN)"
                    className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="company"
                    className="text-orange-700 font-semibold"
                  >
                    Supplier
                  </Label>
                  <Input
                    id="company"
                    value={newMedicine.company}
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        company: e.target.value,
                      })
                    }
                    placeholder="Enter supplier name"
                    className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="quantity"
                    className="text-orange-700 font-semibold"
                  >
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newMedicine.quantity}
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="Enter quantity"
                    className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="price"
                    className="text-orange-700 font-semibold"
                  >
                    Price (₹)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newMedicine.price}
                    onChange={(e) =>
                      setNewMedicine({ ...newMedicine, price: e.target.value })
                    }
                    placeholder="Enter price in INR"
                    className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={
                      isEditingMedicine ? handleEditMedicine : handleAddMedicine
                    }
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 rounded-2xl"
                  >
                    {isEditingMedicine ? "Update Medicine" : "Add Medicine"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleModalCancel}
                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 font-bold py-3 rounded-2xl"
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Record Sale Modal */}
        {isRecordingSale && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-orange-800">
                  Record Sale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Patient Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="patientId"
                      className="text-orange-700 font-semibold"
                    >
                      Patient ID *
                    </Label>
                    <Input
                      id="patientId"
                      value={newSale.patientId}
                      onChange={(e) =>
                        setNewSale({ ...newSale, patientId: e.target.value })
                      }
                      placeholder="Enter patient ID"
                      required
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="patientName"
                      className="text-orange-700 font-semibold"
                    >
                      Patient Name *
                    </Label>
                    <Input
                      id="patientName"
                      value={newSale.patientName}
                      onChange={(e) =>
                        setNewSale({ ...newSale, patientName: e.target.value })
                      }
                      placeholder="Enter patient name"
                      required
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="saleDate"
                    className="text-orange-700 font-semibold"
                  >
                    Sale Date
                  </Label>
                  <Input
                    id="saleDate"
                    type="date" 
                    value={newSale.saleDate}
                    onChange={(e) =>
                      setNewSale({ ...newSale, saleDate: e.target.value })
                    }
                    className="border-orange-200 bg-gray-100 text-gray-600"
                  />
                </div>

                {/* Add Medicine Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Medicine Name */}
                  <div className="relative" ref={wrapperRef}>
                    <Label
                      htmlFor="medicineName"
                      className="text-orange-700 font-semibold"
                    >
                      Medicine Name
                    </Label>
                    <Input
                      id="medicineName"
                      value={currentMedicine.medicineName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentMedicine({
                          ...currentMedicine,
                          medicineName: val,
                        });
                        fetchSuggestions(val);
                      }}
                      placeholder="Enter medicine name"
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                      autoComplete="off"
                    />

                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-orange-200 mt-1 max-h-60 overflow-y-auto rounded-md shadow-md">
                        {suggestions.map((med) => (
                          <li
                            key={med.Code}
                            onClick={() => {
                              setCurrentMedicine({
                                ...currentMedicine,
                                medicineName: med["Product Name"],
                                pricePerUnit: med.Price?.toString() || "",
                                hsn: med.HSN || currentMedicine.hsn,
                              });
                              setShowSuggestions(false);
                            }}
                            className="px-4 py-2 hover:bg-orange-100 cursor-pointer"
                          >
                            {med["Product Name"]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Batch */}
                  <div>
                    <Label
                      htmlFor="batch"
                      className="text-orange-700 font-semibold"
                    >
                      Batch
                    </Label>
                    <Input
                      id="batch"
                      value={currentMedicine.batch}
                      onChange={(e) =>
                        setCurrentMedicine({
                          ...currentMedicine,
                          batch: e.target.value,
                        })
                      }
                      placeholder="Enter batch number"
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>

                  {/* HSN Number */}
                  <div>
                    <Label
                      htmlFor="hsn"
                      className="text-orange-700 font-semibold"
                    >
                      HSN Number
                    </Label>
                    <Input
                      id="hsn"
                      value={currentMedicine.hsn}
                      onChange={(e) =>
                        setCurrentMedicine({
                          ...currentMedicine,
                          hsn: e.target.value,
                        })
                      }
                      placeholder="Enter HSN number"
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>

                  {/* Expiry */}
                  <div>
                    <Label
                      htmlFor="expiry"
                      className="text-orange-700 font-semibold"
                    >
                      Expiry Date
                    </Label>
                    <Input
                      id="expiry"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={currentMedicine.expiry}
                      onChange={(e) =>
                        setCurrentMedicine({
                          ...currentMedicine,
                          expiry: e.target.value,
                        })
                      }
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>

                  {/* Price per Unit */}
                  <div>
                    <Label
                      htmlFor="pricePerUnit"
                      className="text-orange-700 font-semibold"
                    >
                      Price per Unit (₹) *
                    </Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      step="0.01"
                      value={currentMedicine.pricePerUnit}
                      onChange={(e) =>
                        setCurrentMedicine({
                          ...currentMedicine,
                          pricePerUnit: e.target.value,
                        })
                      }
                      placeholder="Enter price per unit"
                      min="0.01"
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label
                      htmlFor="quantity"
                      className="text-orange-700 font-semibold"
                    >
                      Quantity *
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={currentMedicine.quantity}
                      onChange={(e) =>
                        setCurrentMedicine({
                          ...currentMedicine,
                          quantity: e.target.value,
                        })
                      }
                      placeholder="Enter quantity"
                      min="0.01"
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>

                  {/* Add Medicine Button */}
                  <div className="flex items-end">
                    <Button
                      onClick={addMedicineToSale}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 rounded-2xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medicine
                    </Button>
                  </div>
                </div>

                {/* Added Medicines List */}
                {newSale.medicines.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-orange-800 mb-4">
                      Added Medicines
                    </h3>
                    <div className="space-y-2">
                      {newSale.medicines.map((medicine) => (
                        <div
                          key={medicine.id}
                          className="flex items-center justify-between bg-white p-3 rounded-lg border border-orange-200"
                        >
                          <div className="flex-1">
                            <span className="font-medium">
                              {medicine.medicineName}
                            </span>
                            {medicine.batch && (
                              <span className="text-sm text-gray-600 ml-2">
                                (Batch: {medicine.batch})
                              </span>
                            )}
                            <div className="text-sm text-gray-600">
                              Qty: {medicine.quantity} × ₹
                              {medicine.pricePerUnit} = ₹
                              {medicine.totalPrice.toFixed(2)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMedicineFromSale(medicine.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Calculation */}
                {newSale.medicines.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-200">
                    <h3 className="text-lg font-bold text-orange-800 mb-3">
                      Bill Summary
                    </h3>
                    <div className="space-y-2 text-sm">
  <div className="flex justify-between">
    <span>Subtotal:</span>
    <span>₹{calculateSaleTotal().subtotal.toFixed(2)}</span>
  </div>
  {newSale.discount && (
    <div className="flex justify-between">
      <span>Discount ({newSale.discount}%):</span>
      <span>- ₹{calculateSaleTotal().discountAmount.toFixed(2)}</span>
    </div>
  )}
  <div className="flex justify-between">
    <span>SGST (2.5%):</span>
    <span>₹{calculateSaleTotal().sgst.toFixed(2)}</span>
  </div>
  <div className="flex justify-between">
    <span>CGST (2.5%):</span>
    <span>₹{calculateSaleTotal().cgst.toFixed(2)}</span>
  </div>
  <div className="flex justify-between">
    <span>Roundoff:</span>
    <span>₹{calculateSaleTotal().roundoff.toFixed(2)}</span>
  </div>
  <div className="flex justify-between font-bold text-lg border-t border-orange-300 pt-2">
    <span>Grand Total:</span>
    <span>₹{calculateSaleTotal().totalAmount.toFixed(2)}</span>
  </div>
</div>
                  </div>
                )}

                {/* Discount Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="discount"
                      className="text-orange-700 font-semibold"
                    >
                      Discount (%)
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      value={newSale.discount || ""}
                      onChange={(e) =>
                        setNewSale({
                          ...newSale,
                          discount: e.target.value,
                        })
                      }
                      placeholder="Enter discount percentage"
                      min="0"
                      max="100"
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="discountApprovedBy"
                      className="text-orange-700 font-semibold"
                    >
                      Approved By
                    </Label>
                    <Input
                      id="discountApprovedBy"
                      value={newSale.discountApprovedBy || ""}
                      onChange={(e) =>
                        setNewSale({
                          ...newSale,
                          discountApprovedBy: e.target.value,
                        })
                      }
                      placeholder="Enter approver's name"
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleRecordSale}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-2xl"
                  >
                    Record Sale
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRecordingSale(false);
                      setNewSale({
                        patientId: "",
                        patientName: "",
                        medicines: [],
                        saleDate: new Date().toISOString().split("T")[0],
                        discount: "",
                        discountApprovedBy: "",
                      });
                      setCurrentMedicine({
                        medicineName: "",
                        batch: "",
                        hsn: "",
                        expiry: "",
                        pricePerUnit: "",
                        quantity: "",
                      });
                    }}
                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 font-bold py-3 rounded-2xl"
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


{/* Edit Sale Modal */}
{isEditingSale && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
    <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl my-8">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-t-3xl">
        <CardTitle className="text-2xl font-black">
          Update Sale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
        {/* Patient Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-patientId" className="text-blue-700 font-semibold">
              Patient ID *
            </Label>
            <Input
              id="edit-patientId"
              value={editSale.patientId}
              onChange={(e) =>
                setEditSale({ ...editSale, patientId: e.target.value })
              }
              placeholder="Enter patient ID"
              className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
            />
          </div>
          <div>
            <Label htmlFor="edit-patientName" className="text-blue-700 font-semibold">
              Patient Name *
            </Label>
            <Input
              id="edit-patientName"
              value={editSale.patientName}
              onChange={(e) =>
                setEditSale({ ...editSale, patientName: e.target.value })
              }
              placeholder="Enter patient name"
              className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Sale Date */}
        <div>
          <Label htmlFor="edit-saleDate" className="text-blue-700 font-semibold">
            Sale Date
          </Label>
          <Input
            id="edit-saleDate"
            type="date"
            value={editSale.saleDate}
            onChange={(e) =>
              setEditSale({ ...editSale, saleDate: e.target.value })
            }
            className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
          />
        </div>

        {/* Existing Medicines - WITH INLINE EDITING */}
        {editSale.medicines.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-300">
            <h3 className="text-lg font-bold text-blue-800 mb-4">
              Current Medicines (Click to Edit)
            </h3>
            <div className="space-y-3">
              {editSale.medicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className="bg-white p-4 rounded-lg border border-blue-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <span className="font-medium text-lg">
                        {medicine.medicineName}
                      </span>
                      {medicine.batch && (
                        <span className="text-sm text-gray-600 ml-2">
                          (Batch: {medicine.batch})
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMedicineFromEditSale(medicine.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Editable Quantity and Price */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600">Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={medicine.quantity}
                        onChange={(e) =>
                          updateMedicineQuantityInEdit(
                            medicine.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Price/Unit (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={medicine.pricePerUnit}
                        onChange={(e) =>
                          updateMedicinePriceInEdit(
                            medicine.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Total (₹)</Label>
                      <Input
                        value={medicine.totalPrice.toFixed(2)}
                        disabled
                        className="bg-gray-100 border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Medicine Section - WITH AUTOCOMPLETE */}
        <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-200">
          <h3 className="text-lg font-bold text-blue-800 mb-4">
            Add New Medicine
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Medicine Name with Autocomplete */}
            <div className="relative" ref={editWrapperRef}>
              <Label className="text-blue-700 font-semibold">
                Medicine Name *
              </Label>
              <Input
                value={editCurrentMedicine.medicineName}
                onChange={(e) => {
                  setEditCurrentMedicine({
                    ...editCurrentMedicine,
                    medicineName: e.target.value,
                  });
                  fetchEditSuggestions(e.target.value);
                }}
                placeholder="Start typing medicine name..."
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
              {showEditSuggestions && editSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-blue-300 rounded-lg mt-1 max-h-60 overflow-auto shadow-lg">
                  {editSuggestions.map((med: any) => (
                    <li
                      key={med.Code}
                      onClick={() => handleEditSuggestionClick(med)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium text-blue-900">
                        {med["Product Name"]}
                      </div>
                      <div className="text-sm text-gray-600">
                        Code: {med.Code} | Stock: {med.Quantity} | Price: ₹
                        {med.Price}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Batch */}
            <div>
              <Label className="text-blue-700 font-semibold">Batch</Label>
              <Input
                value={editCurrentMedicine.batch}
                onChange={(e) =>
                  setEditCurrentMedicine({
                    ...editCurrentMedicine,
                    batch: e.target.value,
                  })
                }
                placeholder="Enter batch number"
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
            </div>

            {/* HSN Number */}
            <div>
              <Label className="text-blue-700 font-semibold">HSN Number</Label>
              <Input
                value={editCurrentMedicine.hsn}
                onChange={(e) =>
                  setEditCurrentMedicine({
                    ...editCurrentMedicine,
                    hsn: e.target.value,
                  })
                }
                placeholder="Enter HSN number"
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <Label className="text-blue-700 font-semibold">Expiry Date</Label>
              <Input
                type="date"
                value={editCurrentMedicine.expiry}
                onChange={(e) =>
                  setEditCurrentMedicine({
                    ...editCurrentMedicine,
                    expiry: e.target.value,
                  })
                }
                placeholder="dd-mm-yyyy"
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
            </div>

            {/* Price per Unit */}
            <div>
              <Label className="text-blue-700 font-semibold">
                Price per Unit (₹) *
              </Label>
              <Input
                type="number"
                step="0.01"
                value={editCurrentMedicine.pricePerUnit}
                onChange={(e) =>
                  setEditCurrentMedicine({
                    ...editCurrentMedicine,
                    pricePerUnit: e.target.value,
                  })
                }
                placeholder="Enter price per unit"
                min="0.01"
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
            </div>

            {/* Quantity */}
            <div>
              <Label className="text-blue-700 font-semibold">Quantity *</Label>
              <Input
                type="number"
                step="0.01"
                value={editCurrentMedicine.quantity}
                onChange={(e) =>
                  setEditCurrentMedicine({
                    ...editCurrentMedicine,
                    quantity: e.target.value,
                  })
                }
                placeholder="Enter quantity"
                min="0.01"
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
            </div>

            {/* Add Medicine Button */}
            <div className="flex items-end">
              <Button
                onClick={addMedicineToEditSale}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-2xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </div>
          </div>
        </div>

        {/* Total Calculation */}
        {editSale.medicines.length > 0 && (
          <div className="bg-blue-100 p-4 rounded-2xl border-2 border-blue-300">
            <h3 className="text-lg font-bold text-blue-800 mb-3">
              Bill Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{calculateEditSaleTotal().subtotal.toFixed(2)}</span>
              </div>
              {editSale.discount && (
                <div className="flex justify-between">
                  <span>Discount ({editSale.discount}%):</span>
                  <span>
                    - ₹{calculateEditSaleTotal().discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>SGST (2.5%):</span>
                <span>₹{calculateEditSaleTotal().sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (2.5%):</span>
                <span>₹{calculateEditSaleTotal().cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Roundoff:</span>
                <span>₹{calculateEditSaleTotal().roundoff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-blue-400 pt-2">
                <span>Grand Total:</span>
                <span>₹{calculateEditSaleTotal().totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Discount Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-blue-700 font-semibold">Discount (%)</Label>
            <Input
              type="number"
              value={editSale.discount || ""}
              onChange={(e) =>
                setEditSale({ ...editSale, discount: e.target.value })
              }
              placeholder="Enter discount percentage"
              min="0"
              max="100"
              className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
            />
          </div>
          <div>
            <Label className="text-blue-700 font-semibold">Approved By</Label>
            <Input
              value={editSale.discountApprovedBy || ""}
              onChange={(e) =>
                setEditSale({
                  ...editSale,
                  discountApprovedBy: e.target.value,
                })
              }
              placeholder="Enter approver's name"
              className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleUpdateSale}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-2xl"
          >
            Update Sale
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsEditingSale(false);
              setEditingSaleId(null);
              setEditSale({
                patientId: "",
                patientName: "",
                medicines: [],
                saleDate: "",
                discount: "",
                discountApprovedBy: "",
              });
              setEditCurrentMedicine({
                medicineName: "",
                batch: "",
                hsn: "",
                expiry: "",
                pricePerUnit: "",
                quantity: "",
              });
            }}
            className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50 font-bold py-3 rounded-2xl"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}


      </div>
    </div>
  );
};

export default MedicineInventory;
