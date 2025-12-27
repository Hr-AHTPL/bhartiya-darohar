import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Users,
  Package,
  Stethoscope,
  Brain,
  MessageSquare,
  Flower2,
  Calendar,
  Filter,
  Download,
  IndianRupee,
  User,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import PatientDialog from "@/components/PatientDialog";
import TherapyDialog from "@/components/TherapyDialog";
import SpecialtyDialog from "@/components/SpecialtyDialog";
import API_BASE_URL from "@/config/api.config";

const specialties = [
  "Orthopaedic",
  "Cardiac Sciences",
  "Neurology",
  "Dermatology",
  "ENT",
  "Gastroenterology",
  "General Surgery",
  "Pulmonology",
  "Urology",
  "Other",
];

const therapiesData = [
  { name: "Sarvanga Abhyangam" },
  { name: "Abhyangam One Limb" },
  { name: "Abhyangam Two Limb" },
  { name: "Sarvanga Udwartan" },
  { name: "Avagaha Swedan" },
  { name: "Nadi Swedan" },
  { name: "PPS Sweda Whole Body" },
  { name: "PPS One Limb" },
  { name: "PPS Two Limb" },
  { name: "Shashtika Shali Pinda Swedan Whole Body" },
  { name: "Shashtika Shali Pinda Swedan One Limb" },
  { name: "Shashtika Shali Pinda Swedan Two Limb" },
  { name: "Ruksha Pinda Pottali Swedan Whole Body" },
  { name: "Ruksha Pinda Pottali Swedan One Limb" },
  { name: "Ruksha Pinda Pottali Swedan Two Limb" },
  { name: "Snigdha Pinda Pottali Swedan Whole Body" },
  { name: "Snigdha Pinda Pottali Swedan One Limb" },
  { name: "Snigdha Pinda Pottali Swedan Two Limb" },
  { name: "Tail Dhara" },
  { name: "Takra Dhara" },
  { name: "Ksheer Dhara" },
  { name: "Kashaya Dhara" },
  { name: "Sarvanga Tail Dhara" },
  { name: "Sarvanga Takra Dhara" },
  { name: "Sarvanga Ksheer Dhara" },
  { name: "Sarvanga Kashaya Dhara" },
  { name: "Nasya" },
  { name: "Vaman Karma" },
  { name: "Virechan Karma" },
  { name: "Janu Basti" },
  { name: "Janu Dhara" },
  { name: "Greeva Basti" },
  { name: "Kati Basti" },
  { name: "Urha Basti" },
  { name: "Matra Basti" },
  { name: "Matra Basti With Abhyangam" },
  { name: "Uttar Basti" },
  { name: "Yog Basti" },
  { name: "Kaal Basti" },
  { name: "Karma Basti" },
  { name: "NEHRU Basti (kada basti)" },
  { name: "Netra Tarpan" },
  { name: "Netra Dhara" },
  { name: "Netra Seka" },
  { name: "Netra Ashchyotan" },
  { name: "Prachhaan + Lep" },
  { name: "Leech Therapy Hairpack" },
  { name: "Leech Therapy" },
  { name: "Agni Karma" },
  { name: "Yoni Prakshalan" },
  { name: "Rakta Mokshan" },
  { name: "Mukhalepam (Navara)" },
  { name: "Mukhalepam (Herbal)" },
  { name: "Keshalepam Long Hair" },
  { name: "Keshalepam Short Hair" },
  { name: "Body Scrubbing" },
];

const patientReports = [
  {
    name: "Patient Master",
    icon: Users,
    description: "Complete patient database",
  },
  {
    name: "Patient Summary",
    icon: FileText,
    description: "Patient overview report",
  },
  {
    name: "Patient Wise Report",
    icon: User,
    description: "Individual patient report",
  },
  {
    name: "Prakriti Parikshan",
    icon: Brain,
    description: "Patients undergo analysis",
  },
  {
    name: "Consultation",
    icon: MessageSquare,
    description: "Consultation records",
  },
];

const financialReports = [
  {
    name: "Revenue Report",
    icon: IndianRupee,
    description: "Financial analytics",
  },
  {
    name: "Medicine Stock Report",
    icon: Package,
    description: "Medicine inventory status",
    hasDropdown: true,
    dropdownOptions: ["Running Stock", "Low Stock", "Expiry Stock"],
  },
  {
    name: "Purchase Records",
    icon: ShoppingCart,
    description: "Purchase history & supplier analysis",
    hasInput: true,
    inputPlaceholder: "Enter supplier name (optional)",
  },
  // ✅ ADD THIS NEW SECTION
  {
    name: "Sales Records",
    icon: FileText,
    description: "Sales history & patient analysis",
    hasPatientFilters: true,
  },
  {
    name: "Discount Wise Report",
    icon: IndianRupee,
    description: "Discount analysis report",
    hasInput: true,
    inputPlaceholder: "Enter discount criteria",
  },
  {
    name: "Balance Report",
    icon: FileText,
    description: "Outstanding balance report",
  },
  {
    name: "Sponsor Report",
    icon: Users,
    description: "Sponsor wise analysis",
    hasInput: true,
    inputPlaceholder: "Enter sponsor criteria",
  },
];

export default function Reports() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedTherapies, setSelectedTherapies] = useState<string[]>([]);
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);
  const [isTherapyDialogOpen, setIsTherapyDialogOpen] = useState(false);
  const [isSpecialtyDialogOpen, setIsSpecialtyDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [stockType, setStockType] = useState("");
  const [discountCriteria, setDiscountCriteria] = useState("");
  const [sponsorCriteria, setSponsorCriteria] = useState("");
  const [supplierName, setSupplierName] = useState(""); // ✅ NEW STATE

  const [patientIdFilter, setPatientIdFilter] = useState("");
const [patientNameFilter, setPatientNameFilter] = useState("");

  const handlePatientWiseReportGenerate = async () => {
    try {
      const queryParams = new URLSearchParams({
        patientId: patientId,
        dateFrom: fromDate,
        dateTo: toDate,
      });

      const response = await fetch(
        `${API_BASE_URL}/api/website/enquiry/patient-wise-report?${queryParams}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch patient wise report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PatientWiseReport_${patientId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Patient report generated successfully!");
      setIsPatientDialogOpen(false);
      setPatientId("");
      setPatientName("");
    } catch (error) {
      console.error("Error downloading patient wise report:", error);
      toast.error("Failed to generate patient report");
    }
  };

  const handleTherapyReportGenerate = async () => {
  try {
    // Validate date selection
    if (!fromDate || !toDate) {
      toast.error("Please select both from and to dates");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Generating therapy report...");

    const queryParams = new URLSearchParams({
      dateFrom: fromDate,
      dateTo: toDate,
      selectedTherapy: selectedTherapies.join(","),
    });

    console.log("Requesting therapy report with params:", {
      dateFrom: fromDate,
      dateTo: toDate,
      therapies: selectedTherapies
    });

    const response = await fetch(
      `${API_BASE_URL}/api/website/enquiry/therapy-analysis?${queryParams}`,
      { method: "GET" }
    );

    // Dismiss loading toast
    toast.dismiss(loadingToast);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = "Failed to generate therapy report";
      
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      
      toast.error(errorMessage);
      return;
    }

    const blob = await response.blob();
    console.log("Received blob size:", blob.size);
    
    if (blob.size === 0) {
      toast.error("No data found for selected therapies in the given date range");
      return;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Therapy_Report_${selectedTherapies.join("_").substring(0, 50)}_${fromDate}_to_${toDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    toast.success("Therapy report generated successfully!");
    setIsTherapyDialogOpen(false);
    setSelectedTherapies([]); // Clear selection after successful download
  } catch (error) {
    console.error("Error downloading therapy report:", error);
    toast.error(`Failed to generate therapy report: ${error.message}`);
  }
};

const handleSpecialtyReportGenerate = async () => {
  try {
    // Validate date selection
    if (!fromDate || !toDate) {
      toast.error("Please select both from and to dates");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Generating disease master report...");

    const queryParams = new URLSearchParams({
      dateFrom: fromDate,
      dateTo: toDate,
      selectedSpecialty: selectedSpecialties.join(","),
    });

    console.log("Requesting disease master report with params:", {
      dateFrom: fromDate,
      dateTo: toDate,
      specialties: selectedSpecialties
    });

    const response = await fetch(
      `${API_BASE_URL}/api/website/enquiry/disease-analysis?${queryParams}`,
      { method: "GET" }
    );

    // Dismiss loading toast
    toast.dismiss(loadingToast);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = "Failed to generate disease master report";
      
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      
      toast.error(errorMessage);
      return;
    }

    const blob = await response.blob();
    console.log("Received blob size:", blob.size);

    if (blob.size === 0) {
      toast.error("No data found for selected specialties in the given date range");
      return;
    }

    const formattedSpecialty =
      selectedSpecialties
        .map((s) => s.replace(/\s+/g, "_").replace(/[^\w_]/g, ""))
        .join("_") || "Specialty";

    const fileName = `Disease_Master_${formattedSpecialty}_${fromDate}_to_${toDate}.xlsx`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    toast.success("Disease Master report generated successfully!");
    setIsSpecialtyDialogOpen(false);
    setSelectedSpecialties([]); // Clear selection after successful download
  } catch (error) {
    console.error("Error downloading disease analysis report:", error);
    toast.error(`An unexpected error occurred: ${error.message}`);
  }
}; 

  const handleGenerate = async (type: string) => {
    console.log("Generating:", type, fromDate, toDate);

    if (type === "Patient Wise Report") {
      setSelectedReport(type);
      setIsPatientDialogOpen(true);
      return;
    } else if (type === "Therapy") {
      setIsTherapyDialogOpen(true);
      return;
    } else if (type === "Disease Master") {
      setIsSpecialtyDialogOpen(true);
      return;
    }

    const queryParams = new URLSearchParams({
      dateFrom: fromDate,
      dateTo: toDate,
      sponsor: sponsorCriteria || "",
    });

    if (type === "Patient Master") {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/website/enquiry/patient-master?${queryParams}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "PatientMaster.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Patient Master report generated successfully!");
      } catch (error) {
        console.error("Error downloading report:", error);
        toast.error("Failed to generate Patient Master report");
      }
    } else if (type === "Patient Summary") {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/website/enquiry/patient-billing-master?${queryParams}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "PatientSummary.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Patient Summary report generated successfully!");
      } catch (error) {
        console.error("Error downloading report:", error);
        toast.error("Failed to generate Patient Summary report");
      }
    } else if (type === "Revenue Report") {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/website/enquiry/revenue-report?${queryParams}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch revenue report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "RevenueReport.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Revenue report generated successfully!");
      } catch (error) {
        console.error("Error downloading revenue report:", error);
        toast.error("Failed to generate Revenue report");
      }
    } else if (type === "Running Stock") {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/website/enquiry/current-stock`,
          {
            method: "GET",
          }
        );

        if (!response.ok)
          throw new Error("Failed to fetch current stock report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "RunningStock.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Running Stock report generated successfully!");
      } catch (error) {
        console.error("Error downloading current stock report:", error);
        toast.error("Failed to generate Running Stock report");
      }
    } else if (type === "Low Stock") {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/website/enquiry/low-stock`,
          {
            method: "GET",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch low stock report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "LowStock.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Low Stock report generated successfully!");
      } catch (error) {
        console.error("Error downloading low stock report:", error);
        toast.error("Failed to generate Low Stock report");
      }
    } else if (type === "Prakriti Parikshan") {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/website/enquiry/prakriti-analysis?${queryParams}`,
          {
            method: "GET",
          }
        );

        if (!response.ok)
          throw new Error("Failed to fetch Prakriti Prakishan report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "PrakritiParikshanReport.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Prakriti Parikshan report generated successfully!");
      } catch (error) {
        console.error("Error downloading Prakriti Parikshan report:", error);
        toast.error("Failed to generate Prakriti Parikshan report");
      }
    } else if (type === "Consultation") {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/website/enquiry/consultation-analysis?${queryParams}`,
          {
            method: "GET",
          }
        );

        if (!response.ok)
          throw new Error("Failed to fetch Consultation analysis report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ConsultationAnalysisReport.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Consultation report generated successfully!");
      } catch (error) {
        console.error("Error downloading Consultation analysis report:", error);
        toast.error("Failed to generate Consultation report");
      }
    } // Replace the Medicine Stock Report section in handleGenerate function

else if (type === "Medicine Stock Report") {
  // Validate dates first
  if (!fromDate || !toDate) {
    toast.error("Please select both from and to dates for stock report");
    return;
  }

  if (!stockType) {
    toast.error("Please select a stock type (Running Stock or Low Stock)");
    return;
  }

  toast.info(`Generating ${stockType} report...`);
  
  // Create query params with dates
  const stockQueryParams = new URLSearchParams({
    dateFrom: fromDate,
    dateTo: toDate,
  });

  // ✅ FIX: Use the correct endpoints that accept dates
  if (stockType === "Running Stock") {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/website/enquiry/medicine-stock?${stockQueryParams}`,  // ✅ CORRECT ENDPOINT
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch medicine stock report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RunningStock_${fromDate}_to_${toDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Running Stock report generated successfully!");
    } catch (error) {
      console.error("Error downloading medicine stock report:", error);
      toast.error("Failed to generate Running Stock report");
    }
  } else if (stockType === "Low Stock") {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/website/enquiry/low-stock-report?${stockQueryParams}`,  // ✅ CORRECT ENDPOINT
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch low stock report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LowStock_${fromDate}_to_${toDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Low Stock report generated successfully!");
    } catch (error) {
      console.error("Error downloading low stock report:", error);
      toast.error("Failed to generate Low Stock report");
    }
  }
} // Replace the "Purchase Records" section in your handleGenerate function with this:

else if (type === "Purchase Records") {
  try {
    // Validate dates
    if (!fromDate || !toDate) {
      toast.error("Please select both from and to dates");
      return;
    }

    console.log("Generating purchase report with:", {
      dateFrom: fromDate,
      dateTo: toDate,
      supplier: supplierName
    });

    const purchaseParams = new URLSearchParams({
      dateFrom: fromDate,
      dateTo: toDate,
    });

    // Only add supplier if it has a value
    if (supplierName && supplierName.trim() !== "") {
      purchaseParams.append("supplier", supplierName.trim());
    }

    toast.info("Generating purchase report...");

    const response = await fetch(
      `${API_BASE_URL}/api/purchase/report?${purchaseParams}`,
      {
        method: "GET",
      }
    );

    console.log("Response status:", response.status);

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = "No purchases found for the given criteria";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      
      toast.error(errorMessage);
      return;
    }

    const blob = await response.blob();
    console.log("Blob size:", blob.size);

    if (blob.size === 0) {
      toast.error("Received empty file from server");
      return;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Create filename with date range and supplier info
    const supplierPart = supplierName ? `_${supplierName.replace(/\s+/g, '_')}` : "_All";
    a.download = `Purchase_Records${supplierPart}_${fromDate}_to_${toDate}.xlsx`;
    
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success("Purchase Records report generated successfully!");
    
    // Clear the supplier name after successful download
    setSupplierName("");
    
  } catch (error) {
    console.error("Error downloading purchase report:", error);
    toast.error(`Failed to generate Purchase Records report: ${error.message}`);
  }
} 
else if (type === "Sales Records") {
  try {
    // Validate dates
    if (!fromDate || !toDate) {
      toast.error("Please select both from and to dates");
      return;
    }

    console.log("Generating sales report with:", {
      dateFrom: fromDate,
      dateTo: toDate,
      patientId: patientIdFilter,
      patientName: patientNameFilter
    });

    const salesParams = new URLSearchParams({
      dateFrom: fromDate,
      dateTo: toDate,
    });

    // Add filters if they have values
    if (patientIdFilter && patientIdFilter.trim() !== "") {
      salesParams.append("patientId", patientIdFilter.trim());
    }
    
    if (patientNameFilter && patientNameFilter.trim() !== "") {
      salesParams.append("patientName", patientNameFilter.trim());
    }

    toast.info("Generating sales report...");

    const response = await fetch(
      `${API_BASE_URL}/api/sale/report?${salesParams}`,
      {
        method: "GET",
      }
    );

    console.log("Response status:", response.status);

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = "No sales found for the given criteria";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      
      toast.error(errorMessage);
      return;
    }

    const blob = await response.blob();
    console.log("Blob size:", blob.size);

    if (blob.size === 0) {
      toast.error("Received empty file from server");
      return;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Create filename with filters
    let filterPart = "";
    if (patientIdFilter) filterPart += `_PatientID_${patientIdFilter.replace(/\s+/g, '_')}`;
    if (patientNameFilter) filterPart += `_${patientNameFilter.replace(/\s+/g, '_')}`;
    if (!filterPart) filterPart = "_All";
    
    a.download = `Sales_Records${filterPart}_${fromDate}_to_${toDate}.xlsx`;
    
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success("Sales Records report generated successfully!");
    
    // Clear filters after successful download
    setPatientIdFilter("");
    setPatientNameFilter("");
    
  } catch (error) {
    console.error("Error downloading sales report:", error);
    toast.error(`Failed to generate Sales Records report: ${error.message}`);
  }
} else if (type === "Discount Wise Report") {
      toast.info(
        `Generating discount report for: ${discountCriteria || "All"}...`
      );

      fetch(
        `${API_BASE_URL}/api/website/enquiry/discount-report?${queryParams}`,
        {
          method: "GET",
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.blob();
        })
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Discount_Report_${discountCriteria || "All"}.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          toast.success("Report downloaded successfully.");
        })
        .catch(async (err) => {
          const text = await err?.response?.text?.();
          console.error("Download error:", err, text);
          toast.error("Failed to download Discount Wise Report.");
        });
    } else if (type === "Balance Report") {
      toast.info("Generating balance report...");
      fetch(
        `${API_BASE_URL}/api/website/enquiry/balance-report?${queryParams}`
      )
        .then((res) => res.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "Balance_Report.xlsx";
          a.click();
        });
    } else if (type === "Sponsor Report") {
      toast.info(
        `Generating sponsor report for: ${sponsorCriteria || "All"}...`
      );

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/website/enquiry/sponsor-report?${queryParams}`
        );

        if (!response.ok) throw new Error("Failed to fetch Sponsor Report");

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `Sponsor_Report_${sponsorCriteria || "All"}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        toast.success("Sponsor report downloaded successfully!");
      } catch (error) {
        console.error("Error downloading sponsor report:", error);
        toast.error("Failed to generate sponsor report");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-2xl">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-orange-800">
            Reports Dashboard
          </h1>
        </div>

        {/* Date Filter Section */}
        <Card className="border-orange-200 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              Date Range Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  From Date
                </label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  To Date
                </label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Patient Related Reports */}
          <div className="space-y-8">
            {/* Patient Related Reports */}
            <Card className="border-orange-200 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  Patient Related Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {patientReports.map((report) => {
                  const IconComponent = report.icon;
                  return (
                    <div
                      key={report.name}
                      onClick={() => handleGenerate(report.name)}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 cursor-pointer hover:from-orange-100 hover:to-orange-200 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-orange-800 text-lg">
                          {report.name}
                        </h3>
                        <p className="text-sm text-orange-600">
                          {report.description}
                        </p>
                      </div>
                      <Download className="w-5 h-5 text-orange-600" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Therapy Wise Report */}
            <Card className="border-orange-200 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <Flower2 className="w-6 h-6" />
                  Therapy Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  onClick={() => handleGenerate("Therapy")}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 cursor-pointer hover:from-orange-100 hover:to-orange-200 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
                    <Flower2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-800 text-lg">
                      Therapy Report
                    </h3>
                    <p className="text-sm text-orange-600">
                      Generate therapy-wise analysis report
                    </p>
                  </div>
                  <Download className="w-5 h-5 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            {/* Disease Master */}
            <Card className="border-orange-200 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <Stethoscope className="w-6 h-6" />
                  Disease Master
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  onClick={() => handleGenerate("Disease Master")}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 cursor-pointer hover:from-orange-100 hover:to-orange-200 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-800 text-lg">
                      Disease Master Report
                    </h3>
                    <p className="text-sm text-orange-600">
                      Generate specialty-wise disease analysis
                    </p>
                  </div>
                  <Download className="w-5 h-5 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Financial & Inventory Reports */}
          <div className="space-y-8">
            <Card className="border-orange-200 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <IndianRupee className="w-6 h-6" />
                  Financial & Inventory Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {financialReports.map((report) => {
  const IconComponent = report.icon;
  const isPurchaseReport = report.name === "Purchase Records";
  const isSalesReport = report.name === "Sales Records"; // ✅ NEW
  const isSponsorReport = report.name === "Sponsor Report";
  const isDiscountReport = report.name === "Discount Wise Report";
  
  return (
    <div key={report.name} className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
        <div className="p-2 rounded-full bg-orange-100">
          <IconComponent className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-orange-800">
            {report.name}
          </h3>
          <p className="text-sm text-orange-600">
            {report.description}
          </p>
        </div>
      </div>

      {report.hasDropdown && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-orange-700">
            Stock Type
          </label>
          <Select onValueChange={(val) => setStockType(val)}>
            <SelectTrigger className="border-orange-300 focus:border-orange-500">
              <SelectValue placeholder="Select stock type" />
            </SelectTrigger>
            <SelectContent>
              {report.dropdownOptions?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {stockType && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700"
            >
              Selected: {stockType}
            </Badge>
          )}
        </div>
      )}

      {report.hasInput && isPurchaseReport && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-orange-700">
            Supplier Name (Optional)
          </label>
          <Input
            placeholder={report.inputPlaceholder}
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
          />
          <p className="text-xs text-orange-500">
            Leave blank to include all suppliers
          </p>
        </div>
      )}

      {/* ✅ NEW: Sales Report Filters */}
      {report.hasPatientFilters && isSalesReport && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-orange-700">
              Patient ID (Optional)
            </label>
            <Input
              placeholder="Enter patient ID"
              value={patientIdFilter}
              onChange={(e) => setPatientIdFilter(e.target.value)}
              className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-orange-700">
              Patient Name (Optional)
            </label>
            <Input
              placeholder="Enter patient name"
              value={patientNameFilter}
              onChange={(e) => setPatientNameFilter(e.target.value)}
              className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
            />
          </div>
          <p className="text-xs text-orange-500">
            Leave both blank to include all patients
          </p>
        </div>
      )}

      {report.hasInput && isSponsorReport && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-orange-700">
            Sponsor Criteria
          </label>
          <Input
            placeholder={report.inputPlaceholder}
            value={sponsorCriteria}
            onChange={(e) => setSponsorCriteria(e.target.value)}
            className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
          />
        </div>
      )}

      {report.hasInput && isDiscountReport && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-orange-700">
            Discount Criteria
          </label>
          <Input
            placeholder={report.inputPlaceholder}
            value={discountCriteria}
            onChange={(e) => setDiscountCriteria(e.target.value)}
            className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
          />
        </div>
      )}

      <Button
        onClick={() => handleGenerate(report.name)}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <IconComponent className="w-5 h-5 mr-2" />
        Generate {report.name}
      </Button>

      {report !==
        financialReports[financialReports.length - 1] && (
        <Separator className="bg-orange-200" />
      )}
    </div>
  );
})}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog Components */}
        <PatientDialog
          isOpen={isPatientDialogOpen}
          onClose={() => {
            setIsPatientDialogOpen(false);
            setPatientId("");
            setPatientName("");
          }}
          patientId={patientId}
          patientName={patientName}
          onPatientIdChange={setPatientId}
          onPatientNameChange={setPatientName}
          onGenerate={handlePatientWiseReportGenerate}
        />

        <TherapyDialog
          isOpen={isTherapyDialogOpen}
          onClose={() => setIsTherapyDialogOpen(false)}
          therapiesData={therapiesData}
          selectedTherapies={selectedTherapies}
          onTherapiesChange={setSelectedTherapies}
          onGenerate={handleTherapyReportGenerate}
        />

        <SpecialtyDialog
          isOpen={isSpecialtyDialogOpen}
          onClose={() => setIsSpecialtyDialogOpen(false)}
          specialties={specialties}
          selectedSpecialties={selectedSpecialties}
          onSpecialtiesChange={setSelectedSpecialties}
          onGenerate={handleSpecialtyReportGenerate}
        />
      </div>
    </div>
  );
}
