import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Phone, MapPin, Edit, X, Save } from "lucide-react";
import API_BASE_URL from "@/config/api.config";

interface Patient {
  id: string;
  idno: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  aadharnum?: string;
  houseno?: string;
  city?: string;
  state?: string;
  district?: string;
  pin?: string;
  maritalStatus?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  firstName?: string;
  lastName?: string;
}

interface PatientEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSave: (updatedPatient: any) => void;
}

export default function PatientEditDialog({
  isOpen,
  onClose,
  patient,
  onSave,
}: PatientEditDialogProps) {
  const [formData, setFormData] = useState<any>({
    firstName: "",
    lastName: "",
    age: 0,
    gender: "",
    maritalStatus: "",
    occupation: "",
    phone: "",
    email: "",
    aadharnum: "",
    houseno: "",
    city: "",
    state: "",
    district: "",
    pin: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (patient && isOpen) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/website/enquiry/view`
          );
          const data = await response.json();
          
          if (data.enquiryList) {
            const fullPatient = data.enquiryList.find((p: any) => p._id === patient.id);
            
            if (fullPatient) {
              setFormData({
                firstName: fullPatient.firstName || "",
                lastName: fullPatient.lastName || "",
                age: fullPatient.age || 0,
                gender: fullPatient.gender || "",
                maritalStatus: fullPatient.maritalStatus || "",
                occupation: fullPatient.occupation || "",
                phone: fullPatient.phone?.toString() || "",
                email: fullPatient.email || "",
                aadharnum: fullPatient.aadharnum?.toString() || "",
                houseno: fullPatient.houseno || "",
                city: fullPatient.city || "",
                state: fullPatient.state || "",
                district: fullPatient.district || "",
                pin: fullPatient.pin?.toString() || "",
                emergencyContactName: fullPatient.emergencyContactName || "",
                emergencyContactPhone: fullPatient.emergencyContactPhone?.toString() || "",
              });
            }
          }
        } catch (error) {
          console.error("Error fetching patient details:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPatientDetails();
  }, [patient, isOpen]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Replace the validateForm function in PatientEditDialog.tsx (around line 112)

const validateForm = () => {
  const errors: string[] = [];

  // Convert to numbers for validation
  const phoneNum = Number(formData.phone);
  const aadharNum = formData.aadharnum ? Number(formData.aadharnum) : null;
  const pinNum = formData.pin ? Number(formData.pin) : null;
  const emergencyPhoneNum = formData.emergencyContactPhone 
    ? Number(formData.emergencyContactPhone) 
    : null;

  // Validate phone number (must be exactly 10 digits)
  if (formData.phone) {
    const phoneStr = phoneNum.toString();
    if (phoneStr.length !== 10 || !/^\d{10}$/.test(phoneStr) || isNaN(phoneNum)) {
      errors.push("Phone number must be exactly 10 digits");
    }
  }

  // Validate Aadhar number (must be exactly 12 digits) - only if provided and not empty/zero
  if (formData.aadharnum && 
      formData.aadharnum.toString() !== "0" && 
      formData.aadharnum.toString() !== "") {
    const aadharStr = aadharNum?.toString() || "";
    if (aadharStr.length !== 12 || !/^\d{12}$/.test(aadharStr) || isNaN(aadharNum || 0)) {
      errors.push("Aadhar number must be exactly 12 digits");
    }
  }

  // Validate PIN code (must be exactly 6 digits) - only if provided and not empty/zero
  if (formData.pin && 
      formData.pin.toString() !== "0" && 
      formData.pin.toString() !== "") {
    const pinStr = pinNum?.toString() || "";
    if (pinStr.length !== 6 || !/^\d{6}$/.test(pinStr) || isNaN(pinNum || 0)) {
      errors.push("PIN code must be exactly 6 digits");
    }
  }

  // Validate emergency contact phone (must be exactly 10 digits) - only if provided
  if (formData.emergencyContactPhone && 
      formData.emergencyContactPhone.toString() !== "0" && 
      formData.emergencyContactPhone.toString() !== "") {
    const emergencyPhoneStr = emergencyPhoneNum?.toString() || "";
    if (emergencyPhoneStr.length !== 10 || 
        !/^\d{10}$/.test(emergencyPhoneStr) || 
        isNaN(emergencyPhoneNum || 0)) {
      errors.push("Emergency contact phone must be exactly 10 digits");
    }
  }

  return errors;
};

  const handleSubmit = async () => {
    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Failed to update patient details");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border-2 border-orange-200 shadow-2xl rounded-3xl max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {/* Fixed Header */}
        <DialogHeader className="sticky top-0 bg-white/95 backdrop-blur-xl z-10 px-6 pt-6 pb-4 border-b border-orange-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-orange-700 via-red-700 to-amber-700 bg-clip-text text-transparent">
              <div className="p-3 bg-gradient-to-br from-orange-600 via-red-600 to-amber-600 rounded-2xl shadow-xl">
                <Edit className="h-6 w-6 text-white" />
              </div>
              Edit Patient Details
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 rounded-full hover:bg-orange-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          /* Scrollable Content Area - Increased height to show all fields */
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-6 py-4">
            <div className="space-y-6 pb-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b-2 border-orange-200">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
                    Personal Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      First Name *
                    </Label>
                    <Input
                      value={formData.firstName || ""}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      Last Name
                    </Label>
                    <Input
                      value={formData.lastName || ""}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      Age *
                    </Label>
                    <Input
                      type="number"
                      value={formData.age || ""}
                      onChange={(e) => handleInputChange("age", parseInt(e.target.value) || 0)}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                      min="0"
                      max="150"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      Gender *
                    </Label>
                    <Select
                      value={formData.gender || ""}
                      onValueChange={(value) => handleInputChange("gender", value)}
                    >
                      <SelectTrigger className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      Marital Status
                    </Label>
                    <Select
                      value={formData.maritalStatus || ""}
                      onValueChange={(value) => handleInputChange("maritalStatus", value)}
                    >
                      <SelectTrigger className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      Occupation
                    </Label>
                    <Input
                      value={formData.occupation || ""}
                      onChange={(e) => handleInputChange("occupation", e.target.value)}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b-2 border-orange-200">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                    Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      Phone Number * (10 digits)
                    </Label>
                    <Input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      maxLength={10}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      Aadhar Number (12 digits)
                    </Label>
                    <Input
                      type="text"
                      value={formData.aadharnum || ""}
                      onChange={(e) => handleInputChange("aadharnum", e.target.value)}
                      maxLength={12}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      Emergency Contact Name
                    </Label>
                    <Input
                      value={formData.emergencyContactName || ""}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      Emergency Contact Phone (10 digits)
                    </Label>
                    <Input
                      type="tel"
                      value={formData.emergencyContactPhone || ""}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      maxLength={10}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b-2 border-orange-200">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-red-700 to-orange-700 bg-clip-text text-transparent">
                    Address Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      House Number *
                    </Label>
                    <Input
                      value={formData.houseno || ""}
                      onChange={(e) => handleInputChange("houseno", e.target.value)}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      City *
                    </Label>
                    <Input
                      value={formData.city || ""}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      District *
                    </Label>
                    <Input
                      value={formData.district || ""}
                      onChange={(e) => handleInputChange("district", e.target.value)}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      State *
                    </Label>
                    <Input
                      value={formData.state || ""}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold text-orange-700">
                      PIN Code (6 digits)
                    </Label>
                    <Input
                      type="text"
                      value={formData.pin || ""}
                      onChange={(e) => handleInputChange("pin", e.target.value)}
                      maxLength={6}
                      className="h-12 bg-white/80 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl z-10 px-6 py-4 border-t border-orange-100 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-12 text-lg font-semibold bg-white/80 border-2 border-orange-300 hover:border-orange-400 hover:bg-orange-50 rounded-xl transition-all duration-300"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="flex-1 h-12 text-lg font-bold bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:from-orange-700 hover:via-red-700 hover:to-amber-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Updating...</span>
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

}
