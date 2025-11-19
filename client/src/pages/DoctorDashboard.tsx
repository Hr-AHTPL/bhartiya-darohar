/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx-js-style";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Activity,
  Heart,
  Calendar,
  Users,
  UserCheck,
  Plus,
  Trash2,
  LogOut,
  History,
  Clock,
  Archive,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AutoSuggestInput from "@/components/AutoSuggestInput";
import MedicineForm, { Medicine } from "@/components/MedicineForm";
import { PatientDisplaySection } from "@/components/PaitentDisplaySection";
import API_BASE_URL from "@/config/api.config";

// Local therapies data
const therapiesData = [
  { name: "Sarvanga Abhyangam", amount: 1400 },
  { name: "Abhyangam One Limb", amount: 800 },
  { name: "Abhyangam Two Limb", amount: 1200 },
  { name: "Sarvanga Udwartan", amount: 1500 },
  { name: "Avagaha Swedan", amount: 400 },
  { name: "Nadi Swedan", amount: 400 },
  { name: "PPS Sweda Whole Body", amount: 1600 },
  { name: "PPS One Limb", amount: 900 },
  { name: "PPS Two Limb", amount: 1200 },
  { name: "Shashtika Shali Pinda Swedan Whole Body", amount: 2500 },
  { name: "Shashtika Shali Pinda Swedan One Limb", amount: 1500 },
  { name: "Shashtika Shali Pinda Swedan Two Limb", amount: 2000 },
  { name: "Ruksha Pinda Pottali Swedan Whole Body", amount: 1500 },
  { name: "Ruksha Pinda Pottali Swedan One Limb", amount: 800 },
  { name: "Ruksha Pinda Pottali Swedan Two Limb", amount: 1000 },
  { name: "Snigdha Pinda Pottali Swedan Whole Body", amount: 1800 },
  { name: "Snigdha Pinda Pottali Swedan One Limb", amount: 900 },
  { name: "Snigdha Pinda Pottali Swedan Two Limb", amount: 1200 },
  { name: "Tail Dhara", amount: 2500 },
  { name: "Takra Dhara", amount: 1500 },
  { name: "Ksheer Dhara", amount: 1500 },
  { name: "Kashaya Dhara", amount: 1500 },
  { name: "Sarvanga Tail Dhara", amount: 3500 },
  { name: "Sarvanga Takra Dhara", amount: 2500 },
  { name: "Sarvanga Ksheer Dhara", amount: 2500 },
  { name: "Sarvanga Kashaya Dhara", amount: 2000 },
  { name: "Nasya", amount: 1000 },
  { name: "Vaman Karma", amount: 8000 },
  { name: "Virechan Karma", amount: 6000 },
  { name: "Janu Basti", amount: 1500 },
  { name: "Janu Dhara", amount: 1500 },
  { name: "Greeva Basti", amount: 1500 },
  { name: "Kati Basti", amount: 1500 },
  { name: "Urha Basti", amount: 1200 },
  { name: "Matra Basti", amount: 800 },
  { name: "Matra Basti With Abhyangam", amount: 1600 },
  { name: "Uttar Basti", amount: 2000 },
  { name: "Yog Basti", amount: 2000 },
  { name: "Kaal Basti", amount: 2000 },
  { name: "Karma Basti", amount: 2000 },
  { name: "NEHRU Basti (kada basti)", amount: 1000 },
  { name: "Netra Tarpan", amount: 1400 },
  { name: "Netra Dhara", amount: 500 },
  { name: "Netra Seka", amount: 500 },
  { name: "Netra Ashchyotan", amount: 500 },
  { name: "Prachhaan + Lep", amount: 1500 },
  { name: "Leech Therapy Hairpack", amount: 800 },
  { name: "Leech Therapy", amount: 300 },
  { name: "Agni Karma", amount: 750 },
  { name: "Yoni Prakshalan", amount: 1000 },
  { name: "Rakta Mokshan", amount: 1000 },
  { name: "Mukhalepam (Navara)", amount: 1500 },
  { name: "Mukhalepam (Herbal)", amount: 1000 },
  { name: "Keshalepam Long Hair", amount: 1500 },
  { name: "Keshalepam Short Hair", amount: 1000 },
  { name: "Body Scrubbing", amount: 2200 },
];

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
  appointment?: string;
  department?: string;
  sponsor?: string;
  date?: string;
  consultationamount?: number;
  prakritiparikshanamount?: number;
  visitId?: string;
  status?: "pending" | "done";
  observation?: string;
  medicines?: Array<{
    name: string;
    dose: string;
    timing: string;
    duration: string;
  }>;
  therapies?: Array<{
    name: string;
    amount: number;
  }>;
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

interface PatientVisit {
  _id: string;
  patientId: string;
  date: string;
  department: string;
  appointment: string;
  sponsor: string;
  consultationamount: number;
  prakritiparikshanamount: number;
  therapies: Array<{
    name: string;
    sessions: number;
    amount: number;
  }>;
  medicines: Array<{
    subMedicines: Array<{
      name: string;
      quantity: string;
    }>;
    dose: string;
    intake: string;
    timings: string[];
    duration: string;
    otherTiming: string;
  }>;
  others: string;
  othersamount: number;
  observation: string;
  status: "pending" | "done";
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
  data: Array<
    PatientVisit & {
      rogParikshan?: {
        stool: string;
        urine: string;
        appetite: string;
        sleep: string;
        tongue: string;
      };
      nadiParikshaFindings?: string;
      knownCaseOf?: string;
      otherObservations?: string;
    }
  >;
}

// Past History Component
const PastHistoryDialog = ({ patient }: { patient: PatientRecord }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch past history from visits API
  const { data: pastVisits = [], isLoading } = useQuery({
    queryKey: ["pastHistory", patient._id],
    queryFn: async () => {
      console.log(patient._id);
      const response = await fetch(
        `${API_BASE_URL}/api/website/enquiry/patient-visits/${patient._id}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: VisitsApiResponse = await response.json();
      // Filter completed visits and sort by date (most recent first)
      return data.data
        .filter((visit) => visit.status === "done")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700 font-semibold py-2 px-4 rounded-xl transition-all duration-300"
        >
          <History className="h-4 w-4 mr-2" />
          Past History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-800 flex items-center">
            <History className="h-6 w-6 mr-2" />
            Past History - {patient.firstName} {patient.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-600">Loading past history...</p>
            </div>
          ) : pastVisits.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Past History Available
              </h3>
              <p className="text-gray-500">
                This patient doesn't have any recorded past consultations.
              </p>
            </div>
          ) : (
            pastVisits.map((visit, index) => (
              <Card
                key={visit._id}
                className="border-2 border-blue-100 bg-blue-50/50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-blue-800 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Consultation #{index + 1}
                    </CardTitle>
                    <div className="text-sm font-semibold bg-blue-600 text-white px-3 py-1 rounded-full">
                      {visit.date}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Observation Section */}
                  {visit.observation && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-700 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Clinical Observation
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <p className="text-gray-700">{visit.observation}</p>
                      </div>
                    </div>
                  )}

                  {/* Rog Parikshan Section */}
                  {visit.rogParikshan && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-700 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Rog Parikshan
                      </h4>
                      <div className="bg-white rounded-lg border border-blue-200">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3">
                          {visit.rogParikshan.stool && (
                            <div>
                              <span className="font-medium text-blue-700">
                                Stool:
                              </span>
                              <p className="text-gray-700">
                                {visit.rogParikshan.stool}
                              </p>
                            </div>
                          )}
                          {visit.rogParikshan.urine && (
                            <div>
                              <span className="font-medium text-blue-700">
                                Urine:
                              </span>
                              <p className="text-gray-700">
                                {visit.rogParikshan.urine}
                              </p>
                            </div>
                          )}
                          {visit.rogParikshan.appetite && (
                            <div>
                              <span className="font-medium text-blue-700">
                                Appetite:
                              </span>
                              <p className="text-gray-700">
                                {visit.rogParikshan.appetite}
                              </p>
                            </div>
                          )}
                          {visit.rogParikshan.sleep && (
                            <div>
                              <span className="font-medium text-blue-700">
                                Sleep:
                              </span>
                              <p className="text-gray-700">
                                {visit.rogParikshan.sleep}
                              </p>
                            </div>
                          )}
                          {visit.rogParikshan.tongue && (
                            <div>
                              <span className="font-medium text-blue-700">
                                Tongue:
                              </span>
                              <p className="text-gray-700">
                                {visit.rogParikshan.tongue}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nadi Pariksha Findings */}
                  {visit.nadiParikshaFindings && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-700 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Nadi Pariksha Findings
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <p className="text-gray-700">
                          {visit.nadiParikshaFindings}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Known Case Of */}
                  {visit.knownCaseOf && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-700 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Known Case Of
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <p className="text-gray-700">{visit.knownCaseOf}</p>
                      </div>
                    </div>
                  )}

                  {/* Other Observations */}
                  {visit.otherObservations && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-700 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Other Observations
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <p className="text-gray-700">
                          {visit.otherObservations}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Medications Section */}
                  {visit.medicines && visit.medicines.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-700 flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Medications Prescribed
                      </h4>
                      <div className="bg-white rounded-lg border border-blue-200">
                        {visit.medicines.map((med, medIndex) => (
                          <div
                            key={medIndex}
                            className="p-3 border-b border-blue-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-800 mb-2">
                              Medicine {medIndex + 1}
                            </div>
                            {med.subMedicines &&
                              med.subMedicines.map((subMed, subIndex) => (
                                <div
                                  key={subIndex}
                                  className="ml-4 text-sm text-gray-600"
                                >
                                  • {subMed.name} - {subMed.quantity}
                                </div>
                              ))}
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Dose:</span>{" "}
                                {med.dose}
                              </div>
                              <div>
                                <span className="font-medium">Intake:</span>{" "}
                                {med.intake}
                              </div>
                              <div>
                                <span className="font-medium">Timing:</span>{" "}
                                {med.timings?.join(", ")}{" "}
                                {med.otherTiming && `, ${med.otherTiming}`}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span>{" "}
                                {med.duration}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Therapy Section */}
                  {visit.therapies && visit.therapies.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-700 flex items-center">
                        <Heart className="h-4 w-4 mr-2" />
                        Therapy Advised
                      </h4>
                      <div className="bg-white rounded-lg border border-blue-200">
                        <div className="grid grid-cols-3 gap-2 p-3 bg-blue-100 font-semibold text-blue-800 text-sm">
                          <div>Therapy Name</div>
                          <div>Sessions</div>
                          <div>Amount</div>
                        </div>
                        {visit.therapies.map((therapy, therapyIndex) => (
                          <div
                            key={therapyIndex}
                            className="grid grid-cols-3 gap-2 p-3 border-t border-blue-100 text-sm"
                          >
                            <div className="font-medium text-gray-800">
                              {therapy.name}
                            </div>
                            <div className="text-gray-600">
                              {therapy.sessions}
                            </div>
                            <div className="text-gray-600">
                              ₹{therapy.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// PrescriptionForm Component
const PrescriptionForm = ({
  patient,
  doctorName,
  onPrescriptionGenerated,
}: {
  patient: PatientRecord;
  doctorName: string;
  onPrescriptionGenerated: () => void;
}) => {
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [observation, setObservation] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      subMedicines: [{ name: "", quantity: "" }],
      dose: "",
      intake: "",
      timings: [],
      otherTiming: "",
      duration: "",
    },
  ]);
  const [therapies, setTherapies] = useState([{ name: "", sessions: 0 }]);

  // Rog Parikshan fields
  const [rogParikshan, setRogParikshan] = useState({
    stool: "",
    urine: "",
    appetite: "",
    sleep: "",
    tongue: "",
  });

  // Nadi Pariksha Findings
  const [nadiParikshaFindings, setNadiParikshaFindings] = useState("");

  // Known case of
  const [knownCaseOf, setKnownCaseOf] = useState("");

  // Other observations
  const [otherObservations, setOtherObservations] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Fetch medicines for auto-suggestion
  const { data: medicinesData = [] } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/medicine/view`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.medicineList;
      } catch (error) {
        console.error("Error fetching medicines:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const medicineNames = medicinesData.map((med: any) => med["Product Name"]);

  const therapyNames = therapiesData.map((therapy) => therapy.name);

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        subMedicines: [{ name: "", quantity: "" }],
        dose: "",
        intake: "",
        timings: [],
        otherTiming: "",
        duration: "",
      },
    ]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const updateMedicine = (index: number, medicine: Medicine) => {
    const updated = medicines.map((med, i) => (i === index ? medicine : med));
    setMedicines(updated);
  };

  const addTherapy = () => {
    setTherapies([...therapies, { name: "", sessions: 0 }]);
  };

  const removeTherapy = (index: number) => {
    if (therapies.length > 1) {
      setTherapies(therapies.filter((_, i) => i !== index));
    }
  };

  const updateTherapy = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = therapies.map((therapy, i) => {
      if (i === index) {
        if (field === "name" && typeof value === "string") {
          return {
            name: value,
            sessions: therapy.sessions,
          };
        }
        if (field === "sessions") {
          return {
            ...therapy,
            sessions:
              typeof value === "number"
                ? value
                : parseInt(value as string) || 0,
          };
        }
        return { ...therapy, [field]: value };
      }
      return therapy;
    });
    setTherapies(updated);
  };

  const generatePrescription = async () => {
    // Validate required fields
    if (!observation.trim()) {
      toast.error("Please enter patient observation");
      return;
    }

    const validMedicines = medicines.filter((med) =>
      med.subMedicines.some((sub) => sub.name.trim())
    );
    if (validMedicines.length === 0) {
      toast.error("Please add at least one medicine");
      return;
    }

    if (!patient.visitId) {
      toast.error("Visit ID not found");
      return;
    }

    setIsLoading(true);

    try {
      const validTherapies = therapies.filter((therapy) => therapy.name.trim());

      // Prepare therapy data with calculated amounts
      const therapiesWithAmounts = validTherapies.map((therapy) => {
        const therapyData = therapiesData.find((t) => t.name === therapy.name);
        return {
          name: therapy.name,
          sessions: therapy.sessions,
          amount: therapyData ? therapyData.amount * therapy.sessions : 0,
        };
      });

      // Save prescription to backend
      const response = await fetch(
        `${API_BASE_URL}/api/website/enquiry/savePrescription`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitId: patient.visitId,
            observation,
            medicines: validMedicines,
            therapies: therapiesWithAmounts,
            rogParikshan,
            nadiParikshaFindings,
            knownCaseOf,
            otherObservations,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save prescription");
      }

      // Generate Excel file
      generatePrescriptionExcel(validMedicines, therapiesWithAmounts);

      toast.success("Prescription saved and generated successfully!");

      // Reset form and close dialog
      setObservation("");
      setMedicines([
        {
          subMedicines: [{ name: "", quantity: "" }],
          dose: "",
          intake: "",
          timings: [],
          otherTiming: "",
          duration: "",
        },
      ]);
      setTherapies([{ name: "", sessions: 0 }]);
      setRogParikshan({
        stool: "",
        urine: "",
        appetite: "",
        sleep: "",
        tongue: "",
      });
      setNadiParikshaFindings("");
      setKnownCaseOf("");
      setOtherObservations("");
      setIsOpen(false);

      onPrescriptionGenerated();
    } catch (error) {
      console.error("Error saving prescription:", error);
      toast.error("Failed to save prescription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const generatePrescriptionExcel = (validMedicines, validTherapies) => {
  const workbook = XLSX.utils.book_new();

  const patientData = [
    ["भारतीय धरोहर वैद्यशाला", "", "", ""],
    ["", "", "", ""],
    ["Patient Prescription Form", "", "", ""],

    [
      "Patient Name",
      `${patient.firstName} ${patient.lastName || ""}`,
      "DATE",
      patient.date || new Date().toLocaleDateString(),
    ],
    [
      "Age / Gender",
      `${patient.age} years / ${patient.gender}`,
      "Patient ID",
      patient.idno,
    ],
    ["Appointment To", patient.appointment || "", "BP/PULSE", ""],
    ["Sponsored by (if any)", patient.sponsor || "", "", ""],
    ["", "", "", ""],
    ["Prakriti", "", "", ""],
    ["Vata ☑", "Pitta ☑", "Kapha ☑", ""],
    ["", "", "", ""],
    ["Clinical Notes", "", "", ""],
    ["Chief Complaint", observation],
    ["Nadi Pariksha Findings", nadiParikshaFindings],
    ["Known Case of", knownCaseOf],
    ["Other Observations", otherObservations],
    ["", "", "", ""],
  ];

  if (Object.values(rogParikshan).some((value) => value.trim())) {
    patientData.push(["Rog Parikshan", "", "", ""]);
    patientData.push([
      "Stool",
      rogParikshan.stool,
      "Urine",
      rogParikshan.urine,
    ]);
    patientData.push([
      "Appetite",
      rogParikshan.appetite,
      "Sleep",
      rogParikshan.sleep,
    ]);
    patientData.push(["Tongue", rogParikshan.tongue, "", ""]);
    patientData.push(["", "", "", ""]);
  }

  patientData.push(["Medicine Name", "Dose", "Timing", "Duration"]);

  validMedicines.forEach((medicine) => {
    const medicineNames = medicine.subMedicines
      .map((sub) => `${sub.name} (${sub.quantity})`)
      .join(", ");

    const timingText = medicine.timings.length > 0 ? medicine.timings.join(", ") : "";
    const fullTiming = medicine.otherTiming
      ? timingText
        ? `${timingText}, ${medicine.otherTiming}`
        : medicine.otherTiming
      : timingText;

    patientData.push([
      medicineNames,
      `${medicine.dose} (${medicine.intake})`,
      fullTiming,
      medicine.duration,
    ]);
  });

  patientData.push(["", "", "", ""]);

  patientData.push([
    "Panchakarma / Therapies Advised",
    "Frequency",
    "Duration",
    "Start Date",
  ]);

  if (validTherapies.length > 0) {
    validTherapies.forEach((therapy) => {
      patientData.push([
        therapy.name,
        `${therapy.sessions} sessions`,
        "",
        "",
      ]);
    });
  } else {
    for (let i = 0; i < 3; i++) {
      patientData.push(["", "", "", ""]);
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(patientData);
  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      const cell = worksheet[cell_ref];
      if (!cell) continue;

      if ([0, 2, 8, 11, 17].includes(R)) {
        cell.s = {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "FFF9C4" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      } else if ([18].includes(R)) {
        cell.s = {
          font: { bold: true },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "FFECB3" } },
        };
      } else {
        cell.s = {
          font: { sz: 10 },
          alignment: {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } },
          },
        };
      }
    }
  }

  worksheet["!cols"] = [
    { width: 30 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 3 } },
    { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } },
    { s: { r: 17, c: 0 }, e: { r: 17, c: 3 } },
    { s: { r: 13, c: 1 }, e: { r: 13, c: 3 } },
    { s: { r: 14, c: 1 }, e: { r: 14, c: 3 } },
    { s: { r: 15, c: 1 }, e: { r: 15, c: 3 } },
    { s: { r: 16, c: 1 }, e: { r: 16, c: 3 } },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Prescription");

  const fileName = `Prescription_${patient.firstName}${patient.lastName || ""}_${new Date()
    .toISOString()
    .split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300">
          Generate Prescription
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-orange-800">
            Generate Prescription - {patient.firstName} {patient.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Observation */}
          <div className="space-y-2">
            <Label
              htmlFor="observation"
              className="text-sm font-semibold text-orange-700"
            >
              Patient Observation *
            </Label>
            <Textarea
              id="observation"
              placeholder="Enter your clinical observations..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="min-h-[100px] border-orange-200 focus:border-orange-400"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold text-orange-700">
              Rog Parikshan
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-orange-200 rounded-lg">
              <div>
                <Label className="text-sm text-orange-600">Stool</Label>
                <Input
                  placeholder="Enter stool examination..."
                  value={rogParikshan.stool}
                  onChange={(e) =>
                    setRogParikshan({ ...rogParikshan, stool: e.target.value })
                  }
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
              <div>
                <Label className="text-sm text-orange-600">Urine</Label>
                <Input
                  placeholder="Enter urine examination..."
                  value={rogParikshan.urine}
                  onChange={(e) =>
                    setRogParikshan({ ...rogParikshan, urine: e.target.value })
                  }
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
              <div>
                <Label className="text-sm text-orange-600">Appetite</Label>
                <Input
                  placeholder="Enter appetite status..."
                  value={rogParikshan.appetite}
                  onChange={(e) =>
                    setRogParikshan({
                      ...rogParikshan,
                      appetite: e.target.value,
                    })
                  }
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
              <div>
                <Label className="text-sm text-orange-600">Sleep</Label>
                <Input
                  placeholder="Enter sleep pattern..."
                  value={rogParikshan.sleep}
                  onChange={(e) =>
                    setRogParikshan({ ...rogParikshan, sleep: e.target.value })
                  }
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
              <div>
                <Label className="text-sm text-orange-600">Tongue</Label>
                <Input
                  placeholder="Enter tongue examination..."
                  value={rogParikshan.tongue}
                  onChange={(e) =>
                    setRogParikshan({ ...rogParikshan, tongue: e.target.value })
                  }
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </div>
          </div>

          {/* Nadi Pariksha Findings */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-orange-700">
              Nadi Pariksha Findings
            </Label>
            <Textarea
              placeholder="Enter Nadi Pariksha findings..."
              value={nadiParikshaFindings}
              onChange={(e) => setNadiParikshaFindings(e.target.value)}
              className="min-h-[80px] border-orange-200 focus:border-orange-400"
            />
          </div>

          {/* Known Case Of */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-orange-700">
              Known Case Of
            </Label>
            <Input
              placeholder="Enter known case information..."
              value={knownCaseOf}
              onChange={(e) => setKnownCaseOf(e.target.value)}
              className="border-orange-200 focus:border-orange-400"
            />
          </div>

          {/* Other Observations */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-orange-700">
              Other Observations
            </Label>
            <Textarea
              placeholder="Enter other observations..."
              value={otherObservations}
              onChange={(e) => setOtherObservations(e.target.value)}
              className="min-h-[80px] border-orange-200 focus:border-orange-400"
            />
          </div>
          {/* Medicines Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold text-orange-700">
                Medicines
              </Label>
              <Button
                type="button"
                onClick={addMedicine}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Medicine
              </Button>
            </div>

            {medicines.map((medicine, index) => (
              <MedicineForm
                key={index}
                medicine={medicine}
                index={index}
                medicineNames={medicineNames}
                activeInputId={activeInputId}
                setActiveInputId={setActiveInputId}
                onUpdate={updateMedicine}
                onRemove={removeMedicine}
                canRemove={medicines.length > 1}
              />
            ))}
          </div>

          {/* Therapies Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold text-orange-700">
                Therapy Advised
              </Label>
              <Button
                type="button"
                onClick={addTherapy}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Therapy
              </Button>
            </div>

            {therapies.map((therapy, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border border-orange-200 rounded-lg"
              >
                <div className="md:col-span-2">
                  <AutoSuggestInput
                    key={index}
                    id={`therapy-${index}`}
                    label={`Therapy Name ${index + 1}`}
                    placeholder="Type therapy name..."
                    value={therapy.name}
                    onChange={(value) => updateTherapy(index, "name", value)}
                    suggestions={therapyNames}
                    activeInputId={activeInputId}
                    setActiveInputId={setActiveInputId}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-sm text-orange-600">Sessions</Label>
                    <Input
                      type="number"
                      placeholder="Number of sessions"
                      value={therapy.sessions || ""}
                      onChange={(e) =>
                        updateTherapy(
                          index,
                          "sessions",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  {therapies.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeTherapy(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Rog Parikshan Section */}

          {/* Generate Button */}
          <Button
            onClick={generatePrescription}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Generate Prescription"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const fetchDoctorPatients = async (
  doctorName: string
): Promise<PatientRecord[]> => {
  try {
    console.log(`Fetching patients for doctor: ${doctorName}`);

    const patientsResponse = await fetch(
      `${API_BASE_URL}/api/website/enquiry/view`
    );
    if (!patientsResponse.ok) {
      throw new Error(
        `HTTP error fetching patients! status: ${patientsResponse.status}`
      );
    }

    const patientsData: BasicApiResponse = await patientsResponse.json();
    console.log("Basic patients fetched:", patientsData.enquiryList.length);

    const doctorPatients: PatientRecord[] = [];

    for (const patient of patientsData.enquiryList) {
      try {
        console.log(`Fetching visits for patient ${patient.idno}...`);

        const visitsResponse = await fetch(
          `${API_BASE_URL}/api/website/enquiry/patient-visits/${patient._id}`
        );
        if (!visitsResponse.ok) {
          console.warn(`Failed to fetch visits for patient ${patient.idno}`);
          continue;
        }

        const visitsData: any = await visitsResponse.json();

        // Filter visits for this specific doctor
        const doctorVisits = visitsData.data.filter(
          (visit) => visit.appointment && visit.appointment.includes(doctorName)
        );

        if (doctorVisits.length > 0) {
          // Sort visits by creation date (most recent first)
          const sortedVisits = doctorVisits.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          // Check if patient has any pending visits
          const hasPendingVisit = sortedVisits.some(
            (visit) => visit.status === "pending"
          );

          // Check if patient has any done visits
          const hasDoneVisit = sortedVisits.some(
            (visit) => visit.status === "done"
          );

          // Create patient records for both recent and past if applicable
          if (hasPendingVisit) {
            // Find the most recent pending visit for recent section
            const pendingVisit = sortedVisits.find(
              (visit) => visit.status === "pending"
            );
            if (pendingVisit) {
              const patientRecord: PatientRecord = {
                ...patient,
                appointment: pendingVisit.appointment,
                department: pendingVisit.department,
                sponsor: pendingVisit.sponsor,
                date: pendingVisit.date,
                consultationamount: pendingVisit.consultationamount,
                prakritiparikshanamount: pendingVisit.prakritiparikshanamount,
                visitId: pendingVisit._id,
                status: "pending",
                observation: pendingVisit.observation,
                medicines: pendingVisit.medicines,
                therapies: pendingVisit.therapies,
              };
              doctorPatients.push(patientRecord);
              console.log(
                `Added pending patient ${patient.idno} for doctor ${doctorName}`
              );
            }
          }

          if (hasDoneVisit && !hasPendingVisit) {
            // Only add to past if no pending visits (to avoid duplicates)
            const doneVisit = sortedVisits.find(
              (visit) => visit.status === "done"
            );
            if (doneVisit) {
              const patientRecord: PatientRecord = {
                ...patient,
                appointment: doneVisit.appointment,
                department: doneVisit.department,
                sponsor: doneVisit.sponsor,
                date: doneVisit.date,
                consultationamount: doneVisit.consultationamount,
                prakritiparikshanamount: doneVisit.prakritiparikshanamount,
                visitId: doneVisit._id,
                status: "done",
                observation: doneVisit.observation,
                medicines: doneVisit.medicines,
                therapies: doneVisit.therapies,
              };
              doctorPatients.push(patientRecord);
              console.log(
                `Added completed patient ${patient.idno} for doctor ${doctorName}`
              );
            }
          }
        }
      } catch (visitError) {
        console.error(
          `Error fetching visits for patient ${patient.idno}:`,
          visitError
        );
        continue;
      }
    }

    console.log(`Total patients for ${doctorName}:`, doctorPatients.length);
    console.log(
      `Pending patients: ${
        doctorPatients.filter((p) => p.status === "pending").length
      }`
    );
    console.log(
      `Done patients: ${
        doctorPatients.filter((p) => p.status === "done").length
      }`
    );

    return doctorPatients;
  } catch (error) {
    console.error("Error in fetchDoctorPatients:", error);
    throw error;
  }
};

const DoctorDashboard = () => {
  const loggedInDoctor = localStorage.getItem("loggedInDoctor");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"recent" | "past">("recent");

  const {
    data: patients = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["doctorPatients", loggedInDoctor],
    queryFn: () => fetchDoctorPatients(loggedInDoctor || ""),
    refetchOnWindowFocus: false,
  });

  const navigate = useNavigate();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    toast.success("Logged out successfully");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  const handleGoToVaidyashaala = () => {
    localStorage.removeItem("tokenForDoctor");
    localStorage.removeItem("loggedInDoctor");
    localStorage.setItem("userRole", "receptionist");
    navigate("/home");
  };

  const handlePrescriptionGenerated = () => {
    refetch();
  };

  // Filter patients based on active filter
  const getFilteredPatients = () => {
    const statusFiltered = patients.filter((patient) => {
      if (activeFilter === "recent") {
        return patient.status === "pending";
      } else {
        return patient.status === "done";
      }
    });

    // Apply search filter
    if (!searchTerm.trim()) return statusFiltered;

    const searchLower = searchTerm.toLowerCase();
    return statusFiltered.filter(
      (patient) =>
        patient.firstName.toLowerCase().includes(searchLower) ||
        patient.lastName.toLowerCase().includes(searchLower) ||
        patient.idno.toLowerCase().includes(searchLower) ||
        patient.phone.toString().includes(searchLower)
    );
  };

  const filteredPatients = getFilteredPatients();
  const recentCount = patients.filter((p) => p.status === "pending").length;
  const pastCount = patients.filter((p) => p.status === "done").length;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-red-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-orange-600">
            Welcome {loggedInDoctor}
          </h2>
        </div>

        {/* Doctor Info and Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center space-x-4">
            <UserCheck className="h-6 w-6 text-orange-600" />
            <div className="px-4 py-2 border-2 border-orange-200 rounded-xl bg-white/80 backdrop-blur-md text-orange-800 font-semibold">
              {loggedInDoctor}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleGoToVaidyashaala}
              variant="outline"
              size="default"
              className="flex items-center space-x-1 md:space-x-2 bg-white/80 backdrop-blur-xl border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-600 hover:text-orange-700 font-semibold px-3 py-1 md:px-4 md:py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span>Back</span>
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              size="default"
              className="flex items-center space-x-1 md:space-x-2 bg-white/80 backdrop-blur-xl border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold px-3 py-1 md:px-4 md:py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => setActiveFilter("recent")}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeFilter === "recent"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                : "bg-white/80 border-2 border-orange-200 text-orange-600 hover:bg-orange-50"
            }`}
          >
            <Clock className="h-5 w-5" />
            <span>Recent ({recentCount})</span>
          </Button>
          <Button
            onClick={() => setActiveFilter("past")}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeFilter === "past"
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                : "bg-white/80 border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
            }`}
          >
            <Archive className="h-5 w-5" />
            <span>Past ({pastCount})</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder={`Search ${activeFilter} patients...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg border-0 rounded-2xl bg-white/80 backdrop-blur-md shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all duration-300"
          />
          <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-white/60 backdrop-blur-md border-0 shadow-xl rounded-3xl">
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-orange-700 mb-2">
                Loading your patients...
              </h3>
              <p className="text-orange-500">
                Please wait while we fetch your assigned patients
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
                Error loading patients
              </h3>
              <p className="text-red-600 mb-6">
                Failed to fetch your patient records
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

        {/* Patient Display Section with Pagination */}
        <PatientDisplaySection
          isLoading={isLoading}
          error={error}
          filteredPatients={filteredPatients}
          activeFilter={activeFilter}
          loggedInDoctor={loggedInDoctor}
          handlePrescriptionGenerated={handlePrescriptionGenerated}
          PastHistoryDialog={PastHistoryDialog}
          PrescriptionForm={PrescriptionForm}
        />

        {/* No Patients State */}
        {!isLoading && !error && filteredPatients.length === 0 && (
          <Card className="bg-white/60 backdrop-blur-md border-0 shadow-xl rounded-3xl">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeFilter === "recent" ? (
                  <Clock className="h-10 w-10 text-orange-400" />
                ) : (
                  <Archive className="h-10 w-10 text-blue-400" />
                )}
              </div>
              <h3 className="text-xl font-bold text-orange-700 mb-2">
                {searchTerm
                  ? `No matching ${activeFilter} patients found`
                  : `No ${activeFilter} patients`}
              </h3>
              <p className="text-orange-500 mb-6">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : activeFilter === "recent"
                  ? "All prescriptions are up to date"
                  : "No completed prescriptions yet"}
              </p>
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm("")}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
