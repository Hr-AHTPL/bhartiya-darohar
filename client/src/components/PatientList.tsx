import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  Search,
  User,
  Phone,
  Calendar,
  Activity,
  Clock,
  Heart,
  Star,
  Zap,
  FileText,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import PatientEditDialog from "./PatientEditDialog";
import { Edit } from "lucide-react";
import API_BASE_URL from "@/config/api.config";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  appointment: string;
  sponsor: string;
  status: "active" | "therapies" | "follow-up";
  idno: string;
  aadharnum?: string;
}

interface Therapy {
  name: string;
  price: number;
  sessions: number;
  duration: string;
  category: string;
  description: string;
}


const PatientList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showCashReceiptDialog, setShowCashReceiptDialog] = useState(false);
  const [showReappointmentDialog, setShowReappointmentDialog] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");
  const [sessions, setNumberofSessions] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receiptPurpose, setReceiptPurpose] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [otherPurpose, setOtherPurpose] = useState("");
  // Reappointment form states
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedSpeciality, setSelectedSpeciality] = useState("");
  const [reappointmentSponsor, setReappointmentSponsor] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [approvedBy, setApprovedBy] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid layout
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);

  // Multi-therapy states - ADD AFTER LINE 76 (after showEditDialog state)
const [addedTherapies, setAddedTherapies] = useState<Array<{
  id: number;
  name: string;
  sessions: number;
  pricePerSession: number;
  totalPrice: number;
}>>([]);
const [currentTherapySessions, setCurrentTherapySessions] = useState("1");


  // Therapy data and states
  const therapiesData: Therapy[] = [
    {
      name: "Sarvanga Abhyangam",
      price: 1400,
      sessions: 1,
      duration: "45 Min",
      category: "abhyangam",
      description:
        "Full body oil massage therapy for complete relaxation and rejuvenation",
    },
    {
      name: "Abhyangam One Limb",
      price: 800,
      sessions: 1,
      duration: "30 Min",
      category: "abhyangam",
      description: "Targeted oil massage for single limb therapy",
    },
    {
      name: "Abhyangam Two Limb",
      price: 1200,
      sessions: 1,
      duration: "30 Min",
      category: "abhyangam",
      description: "Comprehensive oil massage for two limbs",
    },
    {
      name: "Sarvanga Udwartan",
      price: 1500,
      sessions: 1,
      duration: "45 Min",
      category: "swedan",
      description: "Full body herbal powder massage for detoxification",
    },
    {
      name: "Avagaha Swedan",
      price: 400,
      sessions: 1,
      duration: "5–10 Min",
      category: "swedan",
      description: "Steam bath therapy for deep cleansing",
    },
    {
      name: "Nadi Swedan",
      price: 400,
      sessions: 1,
      duration: "10–15 Min",
      category: "swedan",
      description: "Localized steam therapy for targeted healing",
    },
    {
      name: "PPS Sweda Whole Body",
      price: 1600,
      sessions: 1,
      duration: "45 Min",
      category: "pps",
      description: "Full body pinda swedana for muscle relaxation",
    },
    {
      name: "PPS One Limb",
      price: 900,
      sessions: 1,
      duration: "20 Min",
      category: "pps",
      description: "Single limb pinda swedana treatment",
    },
    {
      name: "PPS Two Limb",
      price: 1200,
      sessions: 1,
      duration: "30 Min",
      category: "pps",
      description: "Double limb pinda swedana therapy",
    },
    {
      name: "Shashtika Shali Pinda Swedan Whole Body",
      price: 2500,
      sessions: 1,
      duration: "45 Min",
      category: "shashtika",
      description: "Full body rice bolus therapy for nourishment and strength",
    },
    {
      name: "Shashtika Shali Pinda Swedan One Limb",
      price: 1500,
      sessions: 1,
      duration: "20 Min",
      category: "shashtika",
      description: "Single limb rice bolus therapy",
    },
    {
      name: "Shashtika Shali Pinda Swedan Two Limb",
      price: 2000,
      sessions: 1,
      duration: "30 Min",
      category: "shashtika",
      description: "Double limb rice bolus therapy",
    },
    {
      name: "Ruksha Pinda Pottali Swedan Whole Body",
      price: 1500,
      sessions: 1,
      duration: "45 Min",
      category: "pottali",
      description: "Full body dry bolus therapy for inflammation relief",
    },
    {
      name: "Ruksha Pinda Pottali Swedan One Limb",
      price: 800,
      sessions: 1,
      duration: "20 Min",
      category: "pottali",
      description: "Single limb dry bolus therapy",
    },
    {
      name: "Ruksha Pinda Pottali Swedan Two Limb",
      price: 1000,
      sessions: 1,
      duration: "30 Min",
      category: "pottali",
      description: "Double limb dry bolus therapy",
    },
    {
      name: "Snigdha Pinda Pottali Swedan Whole Body",
      price: 1800,
      sessions: 1,
      duration: "45 Min",
      category: "pottali",
      description: "Full body oily bolus therapy for deep nourishment",
    },
    {
      name: "Snigdha Pinda Pottali Swedan One Limb",
      price: 900,
      sessions: 1,
      duration: "20 Min",
      category: "pottali",
      description: "Single limb oily bolus therapy",
    },
    {
      name: "Snigdha Pinda Pottali Swedan Two Limb",
      price: 1200,
      sessions: 1,
      duration: "30 Min",
      category: "pottali",
      description: "Double limb oily bolus therapy",
    },
    {
      name: "Tail Dhara",
      price: 2500,
      sessions: 1,
      duration: "45 Min",
      category: "dhara",
      description: "Continuous oil pouring therapy for nervous system balance",
    },
    {
      name: "Takra Dhara",
      price: 1500,
      sessions: 1,
      duration: "45 Min",
      category: "dhara",
      description: "Buttermilk pouring therapy for mental clarity",
    },
    {
      name: "Ksheer Dhara",
      price: 1500,
      sessions: 1,
      duration: "45 Min",
      category: "dhara",
      description: "Milk pouring therapy for skin nourishment",
    },
    {
      name: "Kashaya Dhara",
      price: 1500,
      sessions: 1,
      duration: "45 Min",
      category: "dhara",
      description: "Herbal decoction pouring therapy for healing",
    },
    {
      name: "Sarvanga Tail Dhara",
      price: 3500,
      sessions: 1,
      duration: "60 Min",
      category: "dhara",
      description: "Full body oil pouring therapy for complete rejuvenation",
    },
    {
      name: "Sarvanga Takra Dhara",
      price: 2500,
      sessions: 1,
      duration: "60 Min",
      category: "dhara",
      description: "Full body buttermilk pouring therapy",
    },
    {
      name: "Sarvanga Ksheer Dhara",
      price: 2500,
      sessions: 1,
      duration: "60 Min",
      category: "dhara",
      description: "Full body milk pouring therapy",
    },
    {
      name: "Sarvanga Kashaya Dhara",
      price: 2000,
      sessions: 1,
      duration: "60 Min",
      category: "dhara",
      description: "Full body herbal decoction pouring therapy",
    },
    {
      name: "Nasya",
      price: 1000,
      sessions: 1,
      duration: "45 Min",
      category: "panchakarma",
      description: "Nasal medication therapy for respiratory health",
    },
    {
      name: "Vaman Karma",
      price: 8000,
      sessions: 12,
      duration: "varying",
      category: "panchakarma",
      description: "Therapeutic vomiting for detoxification",
    },
    {
      name: "Virechan Karma",
      price: 6000,
      sessions: 12,
      duration: "varying",
      category: "panchakarma",
      description: "Therapeutic purgation for cleansing",
    },
    {
      name: "Janu Basti",
      price: 1500,
      sessions: 1,
      duration: "45 Min",
      category: "basti",
      description: "Knee oil pooling therapy for joint health",
    },
    {
      name: "Janu Dhara",
      price: 1500,
      sessions: 1,
      duration: "45 Min",
      category: "basti",
      description: "Knee oil pouring therapy",
    },
    {
      name: "Greeva Basti",
      price: 1500,
      sessions: 1,
      duration: "45 Min",
      category: "basti",
      description: "Neck oil pooling therapy for cervical issues",
    },
    {
      name: "Kati Basti",
      price: 1500,
      sessions: 1,
      duration: "45 Min",
      category: "basti",
      description: "Lower back oil pooling therapy for spine health",
    },
    {
      name: "Urha Basti",
      price: 1200,
      sessions: 1,
      duration: "45 Min",
      category: "basti",
      description: "Chest oil pooling therapy for respiratory issues",
    },
    {
      name: "Matra Basti",
      price: 800,
      sessions: 1,
      duration: "25 Min",
      category: "basti",
      description: "Oil enema therapy for digestive health",
    },
    {
      name: "Matra Basti With Abhyangam",
      price: 1600,
      sessions: 1,
      duration: "45 Min",
      category: "basti",
      description: "Oil enema with full body massage",
    },
    {
      name: "Uttar Basti",
      price: 2000,
      sessions: 1,
      duration: "60 Min",
      category: "basti",
      description: "Urogenital enema therapy",
    },
    {
      name: "Yog Basti",
      price: 2000,
      sessions: 1,
      duration: "60 Min",
      category: "basti",
      description: "Combined enema therapy for holistic healing",
    },
    {
      name: "Kaal Basti",
      price: 2000,
      sessions: 1,
      duration: "60 Min",
      category: "basti",
      description: "Time-specific enema therapy",
    },
    {
      name: "Karma Basti",
      price: 2000,
      sessions: 1,
      duration: "60 Min",
      category: "basti",
      description: "Action-specific enema therapy",
    },
    {
      name: "NEHRU Basti (kada basti)",
      price: 1000,
      sessions: 1,
      duration: "30 Min",
      category: "basti",
      description: "Herbal decoction enema for cleansing",
    },
    {
      name: "Netra Tarpan",
      price: 1400,
      sessions: 1,
      duration: "30 Min",
      category: "netra",
      description: "Eye oil pooling therapy for vision improvement",
    },
    {
      name: "Netra Dhara",
      price: 500,
      sessions: 1,
      duration: "30 Min",
      category: "netra",
      description: "Eye oil pouring therapy for eye health",
    },
    {
      name: "Netra Seka",
      price: 500,
      sessions: 1,
      duration: "30 Min",
      category: "netra",
      description: "Eye washing therapy for cleansing",
    },
    {
      name: "Netra Ashchyotan",
      price: 500,
      sessions: 1,
      duration: "30 Min",
      category: "netra",
      description: "Eye drop therapy for treatment",
    },
    {
      name: "Prachhaan + Lep",
      price: 1500,
      sessions: 1,
      duration: "45 Min",
      category: "specialized",
      description: "Puncturing with herbal paste for healing",
    },
    {
      name: "Leech Therapy Hairpack",
      price: 800,
      sessions: 1,
      duration: "30–60 Min",
      category: "specialized",
      description: "Leech therapy with hair treatment",
    },
    {
      name: "Leech Therapy",
      price: 300,
      sessions: 1,
      duration: "20–30 Min",
      category: "specialized",
      description: "Medicinal leech therapy for blood purification",
    },
    {
      name: "Agni Karma",
      price: 750,
      sessions: 1,
      duration: "30 Min",
      category: "specialized",
      description: "Therapeutic cauterization for specific conditions",
    },
    {
      name: "Yoni Prakshalan",
      price: 1000,
      sessions: 1,
      duration: "30 Min",
      category: "specialized",
      description: "Vaginal douching therapy for women's health",
    },
    {
      name: "Rakta Mokshan",
      price: 1000,
      sessions: 1,
      duration: "30 Min",
      category: "specialized",
      description: "Bloodletting therapy for purification",
    },
    {
      name: "Mukhalepam (Navara)",
      price: 1500,
      sessions: 1,
      duration: "60 Min",
      category: "beauty",
      description: "Rice face pack therapy for glowing skin",
    },
    {
      name: "Mukhalepam (Herbal)",
      price: 1000,
      sessions: 1,
      duration: "45 Min",
      category: "beauty",
      description: "Herbal face pack therapy for natural beauty",
    },
    {
      name: "Keshalepam Long Hair",
      price: 1500,
      sessions: 1,
      duration: "60–75 Min",
      category: "beauty",
      description: "Long hair treatment pack for hair health",
    },
    {
      name: "Keshalepam Short Hair",
      price: 1000,
      sessions: 1,
      duration: "60–75 Min",
      category: "beauty",
      description: "Short hair treatment pack for scalp care",
    },
    {
      name: "Body Scrubbing",
      price: 2200,
      sessions: 1,
      duration: "45 Min",
      category: "beauty",
      description: "Full body exfoliation therapy for smooth skin",
    },
  ];

  const therapyNames = therapiesData.map((therapy) => therapy.name);
  const [therapyName, setTherapyName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setTherapyName(value);
  if (value.length > 0) {
    const filtered = therapyNames.filter((name) =>
      name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 5));
  } else {
    setSuggestions([]);
  }
};

  const handleChangeSessions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumberofSessions(value);
  };

  const updateFeeAmountFromSession = () => {
    const selectedTherapy = therapiesData.find(
      (therapy) => therapy.name.toLowerCase() === therapyName.toLowerCase()
    );

    if (selectedTherapy) {
      const count = Number(sessions) || 1;
      setFeeAmount(String(selectedTherapy.price * count));
    }
  };

  const handleSelect = (name: string) => {
    setTherapyName(name);
    setNumberofSessions(sessions);
    setSuggestions([]);
  };

  // Add therapy to the list
const handleAddTherapyToList = () => {
  if (!therapyName.trim() || !currentTherapySessions) {
    alert('Please enter therapy name and sessions');
    return;
  }

  const selectedTherapy = therapiesData.find(
    (therapy) => therapy.name.toLowerCase() === therapyName.toLowerCase()
  );

  if (!selectedTherapy) {
    alert('Please select a valid therapy from the list');
    return;
  }

  const sessions = parseInt(currentTherapySessions) || 1;
  const totalPrice = selectedTherapy.price * sessions;

  const newTherapy = {
    id: Date.now(),
    name: selectedTherapy.name,
    sessions: sessions,
    pricePerSession: selectedTherapy.price,
    totalPrice: totalPrice,
  };

  setAddedTherapies([...addedTherapies, newTherapy]);
  setTherapyName('');
  setCurrentTherapySessions('1');
  setSuggestions([]);
};

// Remove therapy from the list
const handleRemoveTherapy = (id: number) => {
  setAddedTherapies(addedTherapies.filter((t) => t.id !== id));
};

// Calculate total for all therapies
const calculateTotalTherapyAmount = () => {
  return addedTherapies.reduce((sum, t) => sum + t.totalPrice, 0);
};

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/website/enquiry/view`
        );
        const data = await response.json();
        if (data.enquiryList) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedPatients = data.enquiryList.map((item: any) => {
            const phoneStr = item.phone.toString();
            const customId = `BD${item.firstName?.[0] || ""}${
              item.lastName?.[0] || ""
            }${phoneStr.slice(-3)}`;

            return {
              id: item._id,
              name: `${item.firstName} ${item.lastName || ""}`.trim(),
              age: item.age,
              gender: item.gender,
              phone: phoneStr,
              appointment: item.appointment,
              sponsor: item.sponsor || "N/A",
              status: "active",
              idno: item.idno || customId,
              aadharnum: item.aadharnum || item.aadhar,
            };
          });
          setPatients(formattedPatients);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
        // Set empty array on error to prevent crashes
        setPatients([]);
      }
    };

    fetchPatients();
  }, []);

  // Set today's date when component mounts
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setVisitDate(today);
  }, []);

  // Safe search filter with error handling
  const filteredPatients =
  searchTerm.trim() === ""
    ? []
    : patients.filter((patient) => {
        try {
          const searchLower = searchTerm.toLowerCase();
          
          // Convert aadharnum to string safely
          const aadharStr = patient.aadharnum?.toString() || "";
          
          return (
            patient.name.toLowerCase().includes(searchLower) ||
            patient.idno.toLowerCase().includes(searchLower) ||
            patient.phone.includes(searchTerm) ||
            aadharStr.includes(searchTerm) ||
            patient.sponsor.toLowerCase().includes(searchLower)
          );
        } catch (error) {
          console.error("Error filtering patients:", error);
          return false;
        }
      });

  // Calculate pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Generate page numbers for pagination
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

  const handleGeneratePrescription = async (patient: Patient) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/website/enquiry/prescription/${patient.id}`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription_${patient.name}.xlsx`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating prescription:", error);
      alert("Failed to generate prescription.");
    }
  };

  const handleCashReceiptClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowCashReceiptDialog(true);
  };

  const handleReappointmentClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowReappointmentDialog(true);
  };
  const formatDateToDDMMYYYY = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleReappointmentSubmit = async () => {
  if (!selectedPatient) return;

  if (!selectedDoctor) {
    alert("Please select a doctor");
    return;
  }

  try {
    const visitPayload = {
  idno: selectedPatient.id,
  appointment: selectedDoctor,
  consultationamount: 0,
  prakritiparikshanamount: 0,
  date: formatDateToDDMMYYYY(visitDate),
  ...(selectedSpeciality.trim() && { department: selectedSpeciality }),
  ...(reappointmentSponsor.trim() && { sponsor: reappointmentSponsor }),
};

    // Add optional fields only if present
    if (selectedSpeciality.trim()) visitPayload.department = selectedSpeciality;
    if (reappointmentSponsor.trim()) visitPayload.sponsor = reappointmentSponsor;

    const response = await fetch(
      `${API_BASE_URL}/api/website/enquiry/addvisit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitPayload),
      }
    );

    const data = await response.json();

    if (data.status === 1) {
      alert(`Reappointment scheduled successfully for ${selectedPatient.name}`);

      // Reset form and close dialog
      setSelectedDoctor("");
      setSelectedSpeciality("");
      setReappointmentSponsor("");
      setVisitDate(new Date().toISOString().split("T")[0]);
      setShowReappointmentDialog(false);
    } else {
      alert(`Failed to schedule reappointment: ${data.message}`);
    }
  } catch (error) {
    console.error("Error creating reappointment:", error);
    alert("Failed to create reappointment.");
  }
};

const handleEditClick = (patient: Patient) => {
  setSelectedPatientForEdit(patient);
  setShowEditDialog(true);
};

// Add this function to handle saving edited patient data
// COMPLETE FIX for PatientList.tsx handleSavePatient function (around line 830-890)

const handleSavePatient = async (updatedData: Partial<Patient>) => {
  if (!selectedPatientForEdit) return;

  try {
    // Convert string inputs to numbers for backend
    const payload = {
      firstName: updatedData.firstName,
      lastName: updatedData.lastName,
      age: Number(updatedData.age),
      gender: updatedData.gender,
      phone: Number(updatedData.phone),
      email: updatedData.email || "",
      aadharnum: updatedData.aadharnum ? Number(updatedData.aadharnum) : 0,
      houseno: updatedData.houseno,
      city: updatedData.city,
      state: updatedData.state,
      district: updatedData.district,
      pin: updatedData.pin ? Number(updatedData.pin) : 0,
      maritalStatus: updatedData.maritalStatus || "",
      occupation: updatedData.occupation || "",
      emergencyContactName: updatedData.emergencyContactName || "",
      emergencyContactPhone: updatedData.emergencyContactPhone 
        ? Number(updatedData.emergencyContactPhone) 
        : 0,
    };

    console.log("Sending payload:", payload); // Debug log

    // Make API call to update patient
    const response = await axios.patch(
      `${API_BASE_URL}/api/website/enquiry/update/${selectedPatientForEdit.id}`,
      payload
    );

    if (response.data.status === 1) {
      alert("Patient details updated successfully!");
      
      // Refresh the patient list
      const refreshResponse = await fetch(
        `${API_BASE_URL}/api/website/enquiry/view`
      );
      const data = await refreshResponse.json();
      if (data.enquiryList) {
        const formattedPatients = data.enquiryList.map((item: any) => {
          const phoneStr = item.phone.toString();
          const customId = `BD${item.firstName?.[0] || ""}${
            item.lastName?.[0] || ""
          }${phoneStr.slice(-3)}`;

          return {
            id: item._id,
            name: `${item.firstName} ${item.lastName || ""}`.trim(),
            age: item.age,
            gender: item.gender,
            phone: phoneStr,
            appointment: item.appointment,
            sponsor: item.sponsor || "N/A",
            status: "active",
            idno: item.idno || customId,
            aadharnum: item.aadharnum || item.aadhar,
          };
        });
        setPatients(formattedPatients);
      }
      
      setShowEditDialog(false);
      setSelectedPatientForEdit(null);
    } else {
      alert("Failed to update patient details: " + response.data.message);
    }
  } catch (error: any) {
    console.error("Error updating patient:", error);
    const errorMessage = error.response?.data?.message || error.message || "Unknown error";
    alert("Failed to update patient details: " + errorMessage);
  }
};

 useEffect(() => {
  if (receiptPurpose === "Consultation") {
    setFeeAmount("500");
    setDiscountPercentage(""); // Reset discount
    setApprovedBy(""); // Reset approver
  } else if (receiptPurpose === "Prakriti Parikshan") {
    setFeeAmount("3000");
    setDiscountPercentage(""); // Reset discount
    setApprovedBy(""); // Reset approver
  } else if (receiptPurpose === "Therapy" && addedTherapies.length > 0) {
    const total = calculateTotalTherapyAmount();
    setFeeAmount(total.toString());
    setDiscountPercentage(""); // Reset discount
    setApprovedBy(""); // Reset approver
  }
}, [receiptPurpose, addedTherapies]);

  const handleReappointmentDialogClose = () => {
    setSelectedDoctor("");
    setSelectedSpeciality("");
    setReappointmentSponsor("");
    const today = new Date().toISOString().split("T")[0];
    setVisitDate(today);
    setShowReappointmentDialog(false);
  };

  const handleCashReceiptSubmit = async () => {
  if (!selectedPatient) return;

  const numericFee = parseFloat(feeAmount);
  const discount = parseFloat(discountPercentage);
  const approvalby = approvedBy.trim();
  const numericReceived = parseFloat(receivedAmount);
  const finalPurpose =
    receiptPurpose === "Others" ? otherPurpose : receiptPurpose;

  if (!numericFee || numericFee <= 0) {
    alert("Please enter a valid fee amount");
    return;
  }

  if (numericReceived < 0) {
    alert("Please enter a valid received amount");
    return;
  }

  if (!finalPurpose) {
    alert("Please select a receipt purpose");
    return;
  }

  // Validate therapy selection
  if (finalPurpose === "Therapy" && addedTherapies.length === 0) {
    alert("Please add at least one therapy");
    return;
  }

  try {
    // Prepare therapy names for display
    const therapyNames = addedTherapies.map(t => 
      `${t.name} (${t.sessions} session${t.sessions > 1 ? 's' : ''})`
    ).join(', ');

    const response = await axios.get(
      `${API_BASE_URL}/api/website/enquiry/prakriti-registration/${selectedPatient.id}`,
      {
        responseType: "blob",
        params: {
          feeAmount: numericFee,
          receivedAmount: numericReceived,
          purpose: finalPurpose,
          ...(finalPurpose === "Therapy" && { 
            therapyName: therapyNames,
            therapies: JSON.stringify(addedTherapies) // Send full therapy array
          }),
          discount: discount,
          approvalby: approvalby,
        },
      }
    );

    const blob = new Blob([response.data], {
      type: "application/pdf",
    });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `cash_receipt_${selectedPatient.name}_${finalPurpose.replace(
      /\s+/g,
      "_"
    )}.xlsx`;
    a.click();

    window.URL.revokeObjectURL(url);
    console.log(
      `Cash receipt generated for ${selectedPatient.name} - Purpose: ${finalPurpose}, Fee: ₹${numericFee}, Received: ₹${numericReceived}`
    );
    
    setOtherPurpose("");
    setFeeAmount("");
    setReceivedAmount("");
    setReceiptPurpose("");
    setTherapyName("");
    setAddedTherapies([]); // ADD THIS
    setCurrentTherapySessions("1"); // ADD THIS
    setShowCashReceiptDialog(false);
  } catch (error) {
    console.error("Error generating cash receipt:", error);
    alert("Failed to generate cash receipt.");
  }
};

  const handleDialogClose = () => {
  setFeeAmount("");
  setReceivedAmount("");
  setReceiptPurpose("");
  setOtherPurpose("");
  setTherapyName("");
  setAddedTherapies([]);
  setCurrentTherapySessions("1");
  setDiscountPercentage(""); // ADD THIS LINE
  setApprovedBy(""); // ADD THIS LINE
  setShowCashReceiptDialog(false);
};

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          className:
            "bg-gradient-to-r from-orange-500 via-amber-600 to-red-500 text-white shadow-2xl border-2 border-orange-300",
          icon: Activity,
        };
      case "discharged":
        return {
          className:
            "bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 text-white shadow-2xl border-2 border-gray-300",
          icon: FileText,
        };
      case "follow-up":
        return {
          className:
            "bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white shadow-2xl border-2 border-red-300",
          icon: Clock,
        };
      default:
        return {
          className: "bg-orange-100 text-orange-800",
          icon: User,
        };
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-red-100">
      <div className="space-y-10 relative">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Enhanced Search and Filter */}
        <Card className="bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-amber-50/30 to-red-50/30"></div>
          <CardHeader className="relative z-10 py-8">
            <CardTitle className="flex items-center space-x-4 text-3xl font-black bg-gradient-to-r from-orange-800 via-red-800 to-amber-800 bg-clip-text text-transparent">
              <div className="p-4 bg-gradient-to-br from-orange-600 via-red-600 to-amber-600 rounded-3xl shadow-2xl relative">
                <User className="h-8 w-8 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full">
                  <Star className="h-3 w-3 text-white p-0.5" />
                </div>
              </div>
              <span>Patient Management</span>
              <Heart className="h-8 w-8 text-red-500 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-xl text-gray-600 font-semibold">
              Search and manage patient records with enhanced filtering
              capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pb-8">
            <div className="flex items-center space-x-8">
              <div className="relative flex-1">
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="h-6 w-6" />
                </div>
                <Input
                  placeholder="Search by name, phone, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-16 h-16 text-xl bg-white/90 backdrop-blur-sm border-3 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-3xl shadow-xl transition-all duration-500 font-semibold"
                />
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination Info - only show if there are filtered patients */}
            {filteredPatients.length > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-600 mt-4 px-2">
                <span className="font-semibold">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredPatients.length)} of{" "}
                  {filteredPatients.length} patients
                </span>
                <span className="font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Show search prompt when no search term is entered */}
        {searchTerm.trim() === "" && (
          <Card className="bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-50/50"></div>
            <CardContent className="text-center py-20 relative z-10">
              <div className="p-8 bg-gradient-to-br from-orange-100 to-amber-300 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-2xl">
                <Search className="h-16 w-16 text-orange-600" />
              </div>
              <h3 className="text-3xl font-black text-orange-900 mb-4">
                Start Your Patient Search
              </h3>
              <p className="text-xl text-orange-700 font-semibold">
                Enter a patient name to begin searching
              </p>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Patient Cards - only show when search is active */}
        {searchTerm.trim() !== "" && currentPatients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 relative z-10">
            {currentPatients.map((patient) => {
              const statusConfig = getStatusConfig(patient.status);
              return (
                <Card
                  key={patient.id}
                  className="bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:scale-110 group overflow-hidden relative rounded-3xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-amber-50/30 to-red-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/20 to-transparent rounded-bl-full"></div>

                  <CardHeader className="pb-4 pt-4 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-orange-700 transition-colors duration-300">
                          {patient.name}
                        </CardTitle>
                      </div>
                      <Badge
                        className={`${statusConfig.className} px-3 py-2 text-xs rounded-xl font-semibold group-hover:scale-110 transition-all`}
                      >
                        <statusConfig.icon className="h-4 w-4" />
                        <span>{patient.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-4 relative z-10">
                    {/* Display Patient ID, Phone, and Aadhar */}
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-2 bg-gradient-to-br from-orange-50/80 to-amber-50/80 rounded-lg border shadow-sm">
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                          Patient ID
                        </span>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {patient.idno}
                        </p>
                      </div>
                      <div className="p-2 bg-gradient-to-br from-red-50/80 to-pink-50/80 rounded-lg border shadow-sm">
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                          Phone
                        </span>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {patient.phone}
                        </p>
                      </div>
                      {patient.aadharnum && (
                        <div className="p-2 bg-gradient-to-br from-green-50/80 to-teal-50/80 rounded-lg border shadow-sm">
                          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                            Aadhar
                          </span>
                          <p className="text-sm font-bold text-gray-900 mt-1">
                            {patient.aadharnum}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 pt-2">
                      <Button
                        size="sm"
                        className="h-11 text-sm font-bold bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:from-orange-700 hover:via-red-700 hover:to-amber-700 border border-white/30 rounded-xl shadow transition-all duration-300 group relative overflow-hidden"
                        onClick={() => handleGeneratePrescription(patient)}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        Generate Prescription
                      </Button>
                      <Button
                        size="sm"
                        className="h-11 text-sm font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 border border-white/30 rounded-xl shadow transition-all duration-300 group relative overflow-hidden"
                        onClick={() => handleReappointmentClick(patient)}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Calendar className="h-4 w-4 mr-2" />
                        Reappointment
                      </Button>
                      <Button
                        size="sm"
                        className="h-11 text-sm font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 border border-white/30 rounded-xl shadow transition-all duration-300 group relative overflow-hidden"
                        onClick={() => handleCashReceiptClick(patient)}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        Cash Receipt
                      </Button>
                      <Button
  size="sm"
  className="h-11 text-sm font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 border border-white/30 rounded-xl shadow transition-all duration-300 group relative overflow-hidden"
  onClick={() => handleEditClick(patient)}
>
  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  <Edit className="h-4 w-4 mr-2" />
  Edit Details
</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination Controls - only show when there are results */}
        {searchTerm.trim() !== "" && totalPages > 1 && (
          <Card className="bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-3xl">
            <CardContent className="py-6">
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
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
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
            </CardContent>
          </Card>
        )}

        {/* No patients found message - only show when searching but no results */}
        {searchTerm.trim() !== "" && filteredPatients.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-50/50"></div>
            <CardContent className="text-center py-20 relative z-10">
              <div className="p-8 bg-gradient-to-br from-orange-100 to-amber-300 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-2xl">
                <User className="h-16 w-16 text-orange-600" />
              </div>
              <h3 className="text-3xl font-black text-orange-900 mb-4">
                No patients found
              </h3>
              <p className="text-xl text-orange-700 font-semibold">
                Try adjusting your search criteria or check the spelling
              </p>
            </CardContent>
          </Card>
        )}

        {/* Reappointment Dialog */}
        <Dialog
          open={showReappointmentDialog}
          onOpenChange={handleReappointmentDialogClose}
        >
          <DialogContent className="bg-white/95 backdrop-blur-xl border-2 border-orange-200 shadow-2xl rounded-3xl max-w-md">
            <DialogHeader className="text-center space-y-4">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-700 via-red-700 to-amber-700 bg-clip-text text-transparent">
                Schedule Reappointment
              </DialogTitle>
              <DialogDescription className="text-lg text-gray-600 font-semibold">
                Book a new appointment for{" "}
                <span className="text-orange-700 font-bold">
                  {selectedPatient?.name}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div>
                <label
                  htmlFor="doctor"
                  className="block text-sm font-medium text-orange-700 mb-2"
                >
                  Select Vaidya
                </label>
                <Select
                  value={selectedDoctor}
                  onValueChange={setSelectedDoctor}
                >
                  <SelectTrigger className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 rounded-xl shadow-lg">
                    <SelectValue placeholder="Choose Vaidya Ji..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-orange-200 rounded-xl shadow-2xl">
                    <SelectItem
                      value="Vaidya Kavita Sharma (BAMS, MD)"
                      className="text-lg py-3"
                    >
                      Vaidya Kavita Sharma (BAMS, MD)
                    </SelectItem>
                    <SelectItem
                      value="Vaidya Swati Tyagi (BAMS)"
                      className="text-lg py-3"
                    >
                      Vaidya Swati Tyagi (BAMS)
                    </SelectItem>
                    <SelectItem
                      value="Vaidya Manisha Sharma (BAMS)"
                      className="text-lg py-3"
                    >
                      Vaidya Manisha Sharma (BAMS)
                    </SelectItem>
                    <SelectItem
                      value="Vaidya Vinod Sharma (BSC, BAMS, FISC)"
                      className="text-lg py-3"
                    >
                      Vaidya Vinod Sharma (BSC, BAMS, FISC)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="speciality"
                  className="block text-sm font-medium text-orange-700 mb-2"
                >
                  Choose Speciality
                </label>
                <Select
                  value={selectedSpeciality}
                  onValueChange={setSelectedSpeciality}
                >
                  <SelectTrigger className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 rounded-xl shadow-lg">
                    <SelectValue placeholder="Select speciality..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-orange-200 rounded-xl shadow-2xl">
                    <SelectItem value="Orthopaedic">Orthopaedic</SelectItem>
                    <SelectItem value="Cardiac Sciences">
                      Cardiac Sciences
                    </SelectItem>
                    <SelectItem value="Neurology">Neurology</SelectItem>
                    <SelectItem value="Dermatology">Dermatology</SelectItem>
                    <SelectItem value="ENT">ENT</SelectItem>
                    <SelectItem value="Gastroenterology">
                      Gastroenterology
                    </SelectItem>
                    <SelectItem value="General Surgery">
                      General Surgery
                    </SelectItem>
                    <SelectItem value="Pulmonology">Pulmonology</SelectItem>
                    <SelectItem value="Urology">Urology</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="sponsor"
                  className="block text-sm font-medium text-orange-700 mb-2"
                >
                  Sponsor
                </label>
                <Input
                  id="sponsor"
                  type="text"
                  placeholder="Enter sponsor information..."
                  value={reappointmentSponsor}
                  onChange={(e) => setReappointmentSponsor(e.target.value)}
                  className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl shadow-lg transition-all duration-300"
                />
              </div>

              <div>
                <label
                  htmlFor="visitDate"
                  className="block text-sm font-medium text-orange-700 mb-2"
                >
                  Visit Date
                </label>
                <Input
                  id="visitDate"
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl shadow-lg transition-all duration-300"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReappointmentDialogClose}
                  className="flex-1 h-12 text-lg font-semibold bg-white/80 border-2 border-orange-300 hover:border-orange-400 hover:bg-orange-50 rounded-xl transition-all duration-300"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleReappointmentSubmit}
                  className="flex-1 h-12 text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Schedule Appointment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cash Receipt Dialog */}
        <Dialog open={showCashReceiptDialog} onOpenChange={handleDialogClose}>
          <DialogContent className=" bg-white/95 backdrop-blur-xl border-2 border-orange-200 shadow-2xl rounded-3xl max-w-md w-full p-0 overflow-hidden">
            {/* Header stays fixed */}
            <div className="p-6 border-b border-orange-100">
              <DialogHeader className="text-center space-y-2">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-700 via-red-700 to-amber-700 bg-clip-text text-transparent">
                  Generate Cash Receipt for {selectedPatient?.name}
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* Scrollable content */}
            <div className="max-h-[80vh] overflow-y-auto px-6 py-4 space-y-6 custom-scroll">
  {/* Receipt Purpose */}
  <div>
    <label
      htmlFor="purpose"
      className="block text-sm font-medium text-orange-700 mb-2"
    >
      Receipt Purpose
    </label>
    <Select
      value={receiptPurpose}
      onValueChange={setReceiptPurpose}
    >
      <SelectTrigger className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 rounded-xl shadow-lg">
        <SelectValue placeholder="Select purpose..." />
      </SelectTrigger>
      <SelectContent className="bg-white border-2 border-orange-200 rounded-xl shadow-2xl">
        <SelectItem value="Consultation" className="text-lg py-3">
          Cash Receipt for Consultation
        </SelectItem>
        <SelectItem
          value="Prakriti Parikshan"
          className="text-lg py-3"
        >
          Cash Receipt for Prakriti Parikshan
        </SelectItem>
        <SelectItem value="Therapy" className="text-lg py-3">
          Cash Receipt for Therapy
        </SelectItem>
        <SelectItem value="Others" className="text-lg py-3">
          Cash Receipt for Other
        </SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Multi-Therapy Section */}
  {receiptPurpose === "Therapy" && (
    <div className="space-y-4 p-5 bg-gradient-to-br from-orange-50/80 to-amber-50/80 rounded-2xl border-2 border-orange-200 shadow-lg">
      <h3 className="font-black text-orange-800 text-lg flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <span>Add Therapies</span>
      </h3>
      
      {/* Current Therapy Input */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <label className="block text-sm font-semibold text-orange-700 mb-2">
            Therapy Name
          </label>
          <input
            id="therapyName"
            type="text"
            placeholder="Search therapy..."
            value={therapyName}
            onChange={handleChange}
            className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl shadow-lg transition-all duration-300 w-full px-4"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border-2 border-orange-200 w-full rounded-xl shadow-2xl mt-1 max-h-48 overflow-y-auto">
              {suggestions.map((name, index) => (
                <li
                  key={index}
                  onClick={() => handleSelect(name)}
                  className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-orange-100 last:border-b-0 transition-colors duration-200"
                >
                  <div className="font-bold text-sm text-orange-800">{name}</div>
                  <div className="text-xs text-gray-600 font-semibold">
                    ₹{therapiesData.find(t => t.name === name)?.price} per session
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-orange-700 mb-2">
            Sessions
          </label>
          <input
            type="number"
            min="1"
            placeholder="Sessions"
            value={currentTherapySessions}
            onChange={(e) => setCurrentTherapySessions(e.target.value)}
            className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl shadow-lg transition-all duration-300 w-full px-4"
          />
        </div>
      </div>

      <Button
        type="button"
        onClick={handleAddTherapyToList}
        className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <Activity className="h-5 w-5 mr-2" />
        Add Therapy to List
      </Button>

      {/* Added Therapies List */}
      {addedTherapies.length > 0 && (
        <div className="space-y-3 mt-4">
          <h4 className="font-bold text-orange-800 flex items-center space-x-2">
            <Badge className="bg-orange-500 text-white">{addedTherapies.length}</Badge>
            <span>Selected Therapies:</span>
          </h4>
          <div className="space-y-2">
            {addedTherapies.map((therapy) => (
              <div
                key={therapy.id}
                className="flex items-center justify-between bg-white/90 backdrop-blur-sm p-4 rounded-xl border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex-1">
                  <div className="font-bold text-sm text-orange-800 group-hover:text-orange-600 transition-colors">
                    {therapy.name}
                  </div>
                  <div className="text-xs text-gray-600 font-semibold mt-1">
                    {therapy.sessions} session(s) × ₹{therapy.pricePerSession} = <span className="text-orange-700 font-black">₹{therapy.totalPrice}</span>
                  </div>
                </div>
                <Button
  type="button"
  size="sm"
  variant="destructive"
  onClick={() => handleRemoveTherapy(therapy.id)}
  className="ml-3 bg-red-500 hover:bg-red-600 rounded-lg shadow-md"
>
  <X className="h-4 w-4" />
</Button>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-black shadow-xl">
            <span className="text-white text-lg">Total Amount:</span>
            <span className="text-2xl text-white">₹{calculateTotalTherapyAmount()}</span>
          </div>
        </div>
      )}
    </div>
  )}

  {receiptPurpose === "Others" && (
    <div>
      <label
        htmlFor="otherPurpose"
        className="block text-sm font-medium text-orange-700 mb-2"
      >
        Enter Purpose
      </label>
      <Input
        id="otherPurpose"
        type="text"
        placeholder="Enter purpose..."
        value={otherPurpose}
        onChange={(e) => setOtherPurpose(e.target.value)}
        className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl shadow-lg transition-all duration-300"
      />
    </div>
  )}

  {/* Fee Amount - Show for non-therapy purposes */}
  {receiptPurpose && receiptPurpose !== "Therapy" && (
    <div>
      <label
        htmlFor="feeAmount"
        className="block text-sm font-medium text-orange-700 mb-2"
      >
        Fee Amount (₹)
      </label>
      <Input
        id="feeAmount"
        type="number"
        placeholder="Enter fee amount..."
        value={feeAmount}
        onChange={(e) => setFeeAmount(e.target.value)}
        className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl shadow-lg transition-all duration-300"
      />
    </div>
  )}

  {/* Auto-calculated fee for therapy */}
  {receiptPurpose === "Therapy" && addedTherapies.length > 0 && (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-300 shadow-lg">
      <label className="block text-sm font-semibold text-orange-700 mb-2">
        Total Fee Amount (Auto-calculated)
      </label>
      <div className="text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
        ₹{calculateTotalTherapyAmount()}
      </div>
    </div>
  )}

  {/* Discount Section */}
  {(feeAmount || (receiptPurpose === "Therapy" && addedTherapies.length > 0)) && (
    <>
      <div>
        <label
          htmlFor="discountPercentage"
          className="block text-sm font-medium text-orange-700 mb-2"
        >
          Discount (%)
        </label>
        <Input
          id="discountPercentage"
          type="number"
          placeholder="Enter discount percentage..."
          value={discountPercentage}
          onChange={(e) => setDiscountPercentage(e.target.value)}
          className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl shadow-lg transition-all duration-300"
        />
      </div>

      <div>
        <label
          htmlFor="approvedBy"
          className="block text-sm font-medium text-orange-700 mb-2"
        >
          Discount Approved By
        </label>
        <Input
          id="approvedBy"
          type="text"
          placeholder="Enter approver name..."
          value={approvedBy}
          onChange={(e) => setApprovedBy(e.target.value)}
          className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl shadow-lg transition-all duration-300"
        />
      </div>

      {feeAmount && discountPercentage !== "" && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-300 shadow-lg">
          <div className="flex justify-between text-sm mb-3 font-semibold">
            <span className="text-gray-700">Amount:</span>
            <span className="text-gray-900 font-bold">₹{feeAmount}</span>
          </div>
          <div className="flex justify-between text-sm mb-3 text-red-600 font-semibold">
            <span>Discount ({discountPercentage}%):</span>
            <span className="font-bold">
              - ₹{((Number(feeAmount) * Number(discountPercentage)) / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xl font-black text-green-800 pt-3 border-t-2 border-green-300">
            <span>Net Payable:</span>
            <span>
              ₹{(Number(feeAmount) - (Number(feeAmount) * Number(discountPercentage)) / 100).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </>
  )}

  {/* Received Amount */}
  <div>
    <label
      htmlFor="receivedAmount"
      className="block text-sm font-medium text-orange-700 mb-2"
    >
      Received Amount (₹)
    </label>
    <Input
      id="receivedAmount"
      type="number"
      placeholder="Enter received amount..."
      value={receivedAmount}
      onChange={(e) => setReceivedAmount(e.target.value)}
      className="h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl shadow-lg transition-all duration-300"
      autoFocus
    />
  </div>

  {/* Action Buttons */}
  <div className="flex space-x-3 pt-2">
    <Button
      type="button"
      variant="outline"
      onClick={handleDialogClose}
      className="flex-1 h-12 text-lg font-semibold bg-white/80 border-2 border-orange-300 hover:border-orange-400 hover:bg-orange-50 rounded-xl transition-all duration-300"
    >
      Back
    </Button>
    <Button
      type="button"
      onClick={handleCashReceiptSubmit}
      className="flex-1 h-12 text-lg font-bold bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:from-orange-700 hover:via-red-700 hover:to-amber-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      Generate Receipt
    </Button>
  </div>

            </div>
          </DialogContent>
        </Dialog>
        {/* Patient Edit Dialog */}
<PatientEditDialog
  isOpen={showEditDialog}
  onClose={() => {
    setShowEditDialog(false);
    setSelectedPatientForEdit(null);
  }}
  patient={selectedPatientForEdit}
  onSave={handleSavePatient}
/>
      </div>
    </div>
  );
};

export default PatientList;
