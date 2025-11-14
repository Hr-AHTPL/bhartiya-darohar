
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface PatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onPatientIdChange: (id: string) => void;
  onPatientNameChange: (name: string) => void;
  onGenerate: () => void;
}

export default function PatientDialog({
  isOpen,
  onClose,
  patientId,
  patientName,
  onPatientIdChange,
  onPatientNameChange,
  onGenerate,
}: PatientDialogProps) {
  // Fetch patient name when patient ID changes
  useEffect(() => {
    const fetchPatientName = async () => {
  if (patientId && patientId.trim() !== "") {
    try {
      const response = await fetch("https://bhartiyadharohar.in/api/website/enquiry/view");

      if (response.ok) {
        const data = await response.json();
        const patients = data.enquiryList;

        const matchedPatient = patients.find(
          (patient) => patient.idno === patientId
        );

        if (matchedPatient) {
          const fullName = `${matchedPatient.firstName} ${matchedPatient.lastName}`;
          onPatientNameChange(fullName);
        } else {
          onPatientNameChange("Patient not found");
        }
      } else {
        onPatientNameChange("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching patient name:", error);
      onPatientNameChange("Error fetching name");
    }
  } else {
    onPatientNameChange("");
  }
};


    const timeoutId = setTimeout(fetchPatientName, 500); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [patientId, onPatientNameChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Patient Wise Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Patient ID
            </label>
            <Input
              placeholder="Enter Patient ID"
              value={patientId}
              onChange={(e) => onPatientIdChange(e.target.value)}
              className="border-orange-300 focus:border-orange-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Patient Name
            </label>
            <Input
              placeholder="Patient name will appear here"
              value={patientName}
              readOnly
              className="bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button
            onClick={onGenerate}
            disabled={!patientId || !patientName || patientName === "Patient not found" || patientName === "Error fetching name"}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
