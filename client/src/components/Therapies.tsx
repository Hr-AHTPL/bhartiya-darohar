import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Heart, Calendar, Users, Trash2, AlertTriangle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import API_BASE_URL from "@/config/api.config";

export interface PatientRecord {
  _id: string;
  idno: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  maritalStatus: string;
  occupation: string;
  phone: number;
  email: string;
  aadharnum: number;
  houseno: string;
  city: string;
  state: string;
  district: string;
  pin: number;
  emergencyContactName: string;
  emergencyContactPhone: number;
  medicalHistory: string;
  // Visit-related fields from the latest therapy visit
  appointment?: string;
  department?: string;
  sponsor?: string;
  date?: string;
  consultationamount?: number;
  prakritiparikshanamount?: number;
  therapyamount?: number;
  therapyname?: string;
  visitId?: string;
}

interface BasicPatient {
  _id: string;
  idno: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  maritalStatus: string;
  occupation: string;
  phone: number;
  email: string;
  aadharnum: number;
  houseno: string;
  city: string;
  state: string;
  district: string;
  pin: number;
  emergencyContactName: string;
  emergencyContactPhone: number;
  medicalHistory: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Therapy {
  name: string;
  amount: number;
  _id: string;
}

interface PatientVisit {
  _id: string;
  patientId: string;
  date: string;
  department: string;
  appointment: string;
  sponsor: string;
  consultationamount: number;
  prakritiparikshanamount: number;
  therapies: Therapy[];  // ✅ updated: therapy array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  medicines?: any[];     // optional, add proper typing if needed
  observation?: string;
  others?: string;
  othersamount?: number;
  status?: string;
  therapyamount?: number;  // Optional: still keep if backend calculates total
  createdAt: string;
  updatedAt: string;
  __v: number;
}


interface BasicApiResponse {
  status: number;
  enquiryList: BasicPatient[];
}

interface VisitsApiResponse {
  status: number;
  message: string;
  data: PatientVisit[];
}

// ✅ NEW: Single API call — replaces the old N+1 loop
const fetchPatientRecords = async (): Promise<PatientRecord[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/website/enquiry/therapy-patients`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.data as PatientRecord[];
};


const Therapies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState("therapies");
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ visitId: string; therapyname: string; patientName: string } | null>(null);

  const queryClient = useQueryClient();

  // Login.tsx saves role as "userRole" in localStorage
  const isAdmin = localStorage.getItem("userRole") === "admin";

  const {
    data: records = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["patientRecords"],
    queryFn: fetchPatientRecords,
    enabled: currentView === "records",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Delete a single therapy from a visit — admin only
  const handleDeleteTherapy = async (visitId: string, therapyname: string) => {
    setDeletingId(`${visitId}-${therapyname}`);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/website/enquiry/delete-therapy/${visitId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || "",
          },
          body: JSON.stringify({ therapyname }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        alert(`Failed to delete: ${err.message || "Unknown error"}`);
        return;
      }
      // Remove card instantly from cache without full refetch
      queryClient.setQueryData(["patientRecords"], (old: PatientRecord[] = []) =>
        old.filter((r) => !(r.visitId === visitId && r.therapyname === therapyname))
      );
    } catch {
      alert("Network error while deleting. Please try again.");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const therapiesData = [
    // Abhyangam therapies
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

    // Udwartan & Swedan
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

    // PPS treatments
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

    // Shashtika Shali Pinda Swedan
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

    // Pottali Swedan
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

    // Dhara therapies
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

    // Panchakarma
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

    // Basti therapies
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

    // Eye treatments
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

    // Specialized treatments
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

    // Beauty treatments
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

  const filteredTherapies = therapiesData.filter((therapy) => {
    const matchesSearch = therapy.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Search by name or patient ID only:
const filteredPatientRecords = records.filter((record) => {
  if (!patientSearchTerm.trim()) return false;

  const searchLower = patientSearchTerm.toLowerCase();
  return (
    (record.firstName ?? "").toLowerCase().includes(searchLower) ||
    (record.lastName ?? "").toLowerCase().includes(searchLower) ||
    (record.idno ?? "").toLowerCase().includes(searchLower) ||
    (record.phone?.toString() ?? "").includes(searchLower) ||
    (record.email ?? "").toLowerCase().includes(searchLower)
  );
});

  if (currentView === "records") {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-red-100">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <Button
              onClick={() => setCurrentView("therapies")}
              variant="outline"
              className="bg-white/60 backdrop-blur-md border-2 border-orange-200 hover:border-orange-300 text-orange-700 hover:bg-orange-50 font-semibold py-3 px-6 rounded-2xl transition-all duration-300"
            >
              ← Back to Therapies
            </Button>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <div className="text-xs font-bold bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full">
                  Admin Mode — Delete Enabled
                </div>
              )}
              <Button
                onClick={() => refetch()}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Refresh Records
              </Button>
            </div>
          </div>

          {/* Patient Search */}
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search patients by name"
              value={patientSearchTerm}
              onChange={(e) => setPatientSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border-0 rounded-2xl bg-white/80 backdrop-blur-md shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all duration-300"
            />
            <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
          </div>

          {/* Loading State */}
          {isLoading && (
            <Card className="bg-white/60 backdrop-blur-md border-0 shadow-xl rounded-3xl">
              <CardContent className="text-center py-16">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">
                  Loading patient records...
                </h3>
                <p className="text-slate-500">
                  Please wait while we fetch the latest data
                </p>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="bg-white/60 backdrop-blur-md border-0 shadow-xl rounded-3xl">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-red-700 mb-2">
                  Error loading records
                </h3>
                <p className="text-red-600 mb-6">
                  Failed to fetch patient records from the server
                </p>
                <Button
                  onClick={() => refetch()}
                  className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Delete Confirmation Modal */}
          {confirmDelete && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="bg-white border-0 shadow-2xl rounded-3xl max-w-md w-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Delete</h3>
                  <p className="text-slate-600 mb-1">
                    Delete <span className="font-bold text-orange-600">{confirmDelete.therapyname}</span>
                  </p>
                  <p className="text-slate-500 text-sm mb-6">
                    for patient <span className="font-semibold">{confirmDelete.patientName}</span>?
                    <br />This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setConfirmDelete(null)}
                      variant="outline"
                      className="flex-1 border-2 border-slate-200 text-slate-600 rounded-2xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleDeleteTherapy(confirmDelete.visitId, confirmDelete.therapyname)}
                      disabled={deletingId === `${confirmDelete.visitId}-${confirmDelete.therapyname}`}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-2xl"
                    >
                      {deletingId ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Records Display - Only show when search term exists */}
          {!isLoading &&
            !error &&
            patientSearchTerm.trim() &&
            filteredPatientRecords.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatientRecords.map((record, index) => (
                  <Card
                    key={`${record.visitId}-${record.therapyname}-${index}`}
                    className="bg-white/70 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-3xl relative"
                  >
                    {/* Admin-only delete button */}
                    {isAdmin && (
                      <button
                        onClick={() =>
                          setConfirmDelete({
                            visitId: record.visitId || "",
                            therapyname: record.therapyname || "",
                            patientName: `${record.firstName ?? ""} ${record.lastName ?? ""}`.trim(),
                          })
                        }
                        className="absolute top-3 right-3 w-8 h-8 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full flex items-center justify-center transition-colors group z-10"
                        title="Delete this therapy record"
                      >
                        <Trash2 className="h-4 w-4 text-red-400 group-hover:text-red-600" />
                      </button>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between pr-8">
                        <CardTitle className="text-xl font-bold text-slate-800">
                          {record.firstName} {record.lastName}
                        </CardTitle>
                        <div className="text-xs font-bold bg-gradient-to-r from-orange-400 to-red-600 text-white px-2 py-1 rounded-full">
                          {record.idno}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Visit Date
                            </div>
                            <div className="font-bold text-slate-800">
                              {record.date || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Contact
                            </div>
                            <div className="font-bold text-slate-800">
                              {record.phone}
                            </div>
                            <div className="text-sm text-slate-600">
                              {record.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center">
                            <Activity className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Therapy
                            </div>
                            <div className="font-bold text-slate-800">
                              {record.therapyname || "No therapy"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-orange-600 rounded-lg flex items-center justify-center">
                            <Heart className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Therapy Cost
                            </div>
                            <div className="text-2xl font-black text-slate-800">
                              ₹{record.therapyamount || 0}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-orange-600 rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Patient Info
                            </div>
                            <div className="text-sm text-slate-800">
                              {record.age} years, {record.gender}
                            </div>
                            <div className="text-sm text-slate-600">
                              {record.city}, {record.state}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          {/* No Search Term State */}
          {!patientSearchTerm.trim() && (
            <Card className="bg-white/60 backdrop-blur-md border-0 shadow-xl rounded-3xl">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">
                  Search for Patient Records
                </h3>
                <p className="text-slate-500">
                  Enter a patient name to search records
                </p>
              </CardContent>
            </Card>
          )}

          {/* No Records Found State */}
          {!isLoading &&
            !error &&
            patientSearchTerm.trim() &&
            filteredPatientRecords.length === 0 && (
              <Card className="bg-white/60 backdrop-blur-md border-0 shadow-xl rounded-3xl">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">
                    No matching records found
                  </h3>
                  <p className="text-slate-500 mb-6">
                    No patient records match your search criteria
                  </p>
                  <Button
                    onClick={() => setPatientSearchTerm("")}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-red-100">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search therapies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border-0 rounded-2xl bg-white/80 backdrop-blur-md shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all duration-300"
            />
            <Activity className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
          </div>

          {/* Patient Records Button */}
          <Button
            onClick={() => {
  setCurrentView("records");  // ✅ React Query auto-fetches when enabled becomes true
}}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center space-x-3"
          >
            <Users className="h-5 w-5" />
            <span>Patient Records</span>
          </Button>
        </div>

        {/* Therapies Grid - Only show when user searches and has results */}
        {searchTerm.trim() && filteredTherapies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTherapies.map((therapy, index) => (
              <Card
                key={index}
                className="group bg-white/70 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden"
              >
                <CardHeader className="pb-4 relative">
                  <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors leading-tight">
                    {therapy.name}
                  </CardTitle>
                  <p className="text-slate-600 text-sm leading-relaxed mt-2">
                    {therapy.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-slate-800">
                        ₹{therapy.price}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">
                        per session
                      </span>
                    </div>
                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                  </div>

                  {/* Session Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                          Sessions
                        </span>
                      </div>
                      <div className="text-lg font-black text-orange-800">
                        {therapy.sessions}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-2xl border border-red-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <Activity className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                          Duration
                        </span>
                      </div>
                      <div className="text-lg font-black text-red-800">
                        {therapy.duration}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchTerm.trim() && filteredTherapies.length === 0 ? (
          <Card className="bg-white/60 backdrop-blur-md border-0 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-10 w-10 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                No therapies found
              </h3>
              <p className="text-slate-500 mb-6">
                Try adjusting your search or category filter
              </p>
              <Button
                onClick={() => setSearchTerm("")}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : !searchTerm.trim() ? (
          <Card className="bg-white/60 backdrop-blur-md border-0 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                Search for Therapies
              </h3>
              <p className="text-slate-500">
                Enter a therapy name in the search box above to explore our
                treatments
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default Therapies;
