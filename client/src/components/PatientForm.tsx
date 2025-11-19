import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Activity,
  Heart,
  Star,
} from "lucide-react";
import axios from "axios";
import API_BASE_URL from "@/config/api.config";

interface PatientData {
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
  appointment: string;
  department: string;
  medicalHistory: string;
  sponsor: string;
  date: string;
}

const PatientForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PatientData>({
    firstName: "",
    lastName: "",
    age: 0,
    gender: "",
    maritalStatus: "",
    occupation: "",
    phone: 0,
    email: "",
    aadharnum: 0,
    houseno: "",
    city: "",
    state: "",
    district: "",
    pin: 0,
    emergencyContactName: "",
    emergencyContactPhone: 0,
    appointment: "",
    department: "",
    medicalHistory: "",
    sponsor: "",
    date: "",
  });

  const handleInputChange = (field: keyof PatientData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateFormData = () => {
    const errors: string[] = [];

    // Validate phone number (must be exactly 10 digits) - only if provided
    if (formData.phone && formData.phone.toString() !== "0") {
      const phoneStr = formData.phone.toString();
      if (phoneStr.length !== 10 || !/^\d{10}$/.test(phoneStr)) {
        errors.push("Phone number must be exactly 10 digits");
      }
    }

    // Validate Aadhar number (must be exactly 12 digits) - only if provided
    if (formData.aadharnum && formData.aadharnum.toString() !== "0") {
      const aadharStr = formData.aadharnum.toString();
      if (aadharStr.length !== 12 || !/^\d{12}$/.test(aadharStr)) {
        errors.push("Aadhar number must be exactly 12 digits");
      }
    }

    // Validate PIN code (must be exactly 6 digits) - only if provided
    if (formData.pin && formData.pin.toString() !== "0") {
      const pinStr = formData.pin.toString();
      if (pinStr.length !== 6 || !/^\d{6}$/.test(pinStr)) {
        errors.push("PIN code must be exactly 6 digits");
      }
    }

    // Validate emergency contact phone (must be exactly 10 digits) - only if provided
    if (
      formData.emergencyContactPhone &&
      formData.emergencyContactPhone.toString() !== "0"
    ) {
      const emergencyPhoneStr = formData.emergencyContactPhone.toString();
      if (
        emergencyPhoneStr.length !== 10 ||
        !/^\d{10}$/.test(emergencyPhoneStr)
      ) {
        errors.push("Emergency contact phone must be exactly 10 digits");
      }
    }

    return errors;
  };

  // Function to format date to dd/mm/yyyy
  const formatDateToDDMMYYYY = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data before submission
    const validationErrors = validateFormData();

    if (validationErrors.length > 0) {
      // Show validation errors as toast messages
      validationErrors.forEach((error, index) => {
        setTimeout(() => {
          toast({
            title: "Validation Error",
            description: error,
            variant: "destructive",
          });
        }, index * 500); // Stagger the toasts
      });
      return; // Prevent form submission
    }

    setIsSubmitting(true);

    try {
      // Prepare the data to match backend expectations
      const rawData = {
        ...formData,
        date: formatDateToDDMMYYYY(formData.date),
      };

      // Explicitly remove optional fields if they are empty or invalid
      if (!rawData.lastName) delete rawData.lastName;
      if (!rawData.maritalStatus) delete rawData.maritalStatus;
      if (!rawData.occupation) delete rawData.occupation;
      if (!rawData.email) delete rawData.email;
      if (!rawData.pin) delete rawData.pin;
      if (!rawData.medicalHistory) delete rawData.medicalHistory;
      if (!rawData.emergencyContactName) delete rawData.emergencyContactName;
      if (!rawData.emergencyContactPhone || rawData.emergencyContactPhone === 0)
        delete rawData.emergencyContactPhone;
      if (!rawData.department) delete rawData.department;
      if (!rawData.sponsor) delete rawData.sponsor;
      if (!rawData.aadharnum || rawData.aadharnum === 0)
        delete rawData.aadharnum;

      const submitData = rawData;

      await axios.post(
        `h${API_BASE_URL}/api/website/enquiry/insert`,
        submitData 
      );
      toast({
        title: "Patient Registered Successfully!",
        description: `${formData.firstName} ${formData.lastName} has been added to the system.`,
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        age: 0,
        gender: "",
        maritalStatus: "",
        occupation: "",
        phone: 0,
        email: "",
        aadharnum: 0,
        houseno: "",
        city: "",
        state: "",
        district: "",
        pin: 0,
        emergencyContactName: "",
        emergencyContactPhone: 0,
        appointment: "",
        department: "",
        medicalHistory: "",
        sponsor: "",
        date: "",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error:", err);

      const errorMessage =
        err.response?.data?.message || "Failed to register patient";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-red-100">
      <div className="space-y-8 relative">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Card className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-amber-50/30 to-red-50/30"></div>
          <CardHeader className="flex items-center content-center relative z-10 py-10">
            <CardTitle className="flex items-center space-x-4 text-4xl font-black bg-gradient-to-r from-orange-700 via-red-700 to-amber-700 bg-clip-text text-transparent">
              <div className="flex-row items-center content-center p-4 bg-gradient-to-br from-orange-600 via-red-600 to-amber-600 rounded-3xl shadow-2xl relative">
                <User className="h-10 w-10 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full">
                  <Star className="h-3 w-3 text-white p-0.5" />
                </div>
              </div>
              <span>Patient Registration</span>
            </CardTitle>
            <CardDescription className="text-xl text-gray-600 font-semibold mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                * marked fields are mandatory
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pb-10">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Date Field */}
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-4 border-b-2 border-gradient-to-r from-blue-200 to-indigo-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
                      Visit Information
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="date"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                    >
                      Date of Visit *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      required
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-4 border-b-2 border-gradient-to-r from-orange-200 to-red-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
                      Personal Information
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="firstName"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter first name"
                      required
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="lastName"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      Last Name * (If not applicable, put X)
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter last name"
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="age"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      Age *
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      placeholder="Enter age"
                      min="0"
                      max="150"
                      required
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="gender"
                      className="text-lg font-bold text-gray-700"
                    >
                      Gender *
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
                    >
                      <SelectTrigger className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="maritalStatus"
                      className="text-lg font-bold text-gray-700"
                    >
                      Marital Status
                    </Label>
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value) =>
                        handleInputChange("maritalStatus", value)
                      }
                    >
                      <SelectTrigger className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold">
                        <SelectValue placeholder="Select Marital Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 group">
                    <Label
                      htmlFor="occupation"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      Occupation
                    </Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) =>
                        handleInputChange("occupation", e.target.value)
                      }
                      placeholder="Enter Patient's occupation"
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-gradient-to-r from-amber-200 to-orange-200">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                    Contact Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="phone"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      Phone Number * (10 digits)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Enter 10-digit phone number"
                      required
                      maxLength={10}
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="email"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter email address"
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="aadhar"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      Aadhar Number (12 digits)
                    </Label>
                    <Input
                      id="aadhar"
                      type="text"
                      value={formData.aadharnum}
                      onChange={(e) =>
                        handleInputChange("aadharnum", e.target.value)
                      }
                      placeholder="Enter 12-digit Aadhar number"
                      maxLength={12}
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="houseno"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      House Number *
                    </Label>
                    <Input
                      id="houseNo"
                      type="text"
                      value={formData.houseno}
                      onChange={(e) =>
                        handleInputChange("houseno", e.target.value)
                      }
                      placeholder="Enter House number"
                      required
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2">
                    {/* City */}
                    <div className="space-y-3 group">
                      <Label
                        htmlFor="city"
                        className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                      >
                        City *
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        placeholder="Enter city"
                        required
                        className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                      />
                    </div>

                    {/* State */}
                    <div className="space-y-3 group">
                      <Label
                        htmlFor="state"
                        className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                      >
                        State *
                      </Label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.state}
                        onChange={(e) =>
                          handleInputChange("state", e.target.value)
                        }
                        placeholder="Enter state"
                        required
                        className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                      />
                    </div>

                    {/* District */}
                    <div className="space-y-3 group">
                      <Label
                        htmlFor="district"
                        className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                      >
                        District *
                      </Label>
                      <Input
                        id="district"
                        type="text"
                        value={formData.district}
                        onChange={(e) =>
                          handleInputChange("district", e.target.value)
                        }
                        placeholder="Enter district"
                        required
                        className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2 group">
                    <Label
                      htmlFor="pin"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      PIN Code (6 digits)
                    </Label>
                    <Input
                      id="pin"
                      value={formData.pin}
                      onChange={(e) => handleInputChange("pin", e.target.value)}
                      placeholder="Enter 6-digit PIN Code"
                      maxLength={6}
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                  {/* Emergency Contact Name */}
                  <div className="space-y-3 md:col-span-2 group">
                    <Label
                      htmlFor="emergencyContactName"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      Emergency Contact Name
                    </Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContactName",
                          e.target.value
                        )
                      }
                      placeholder="Name of emergency contact"
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>

                  {/* Emergency Contact Phone */}
                  <div className="space-y-3 md:col-span-2 group">
                    <Label
                      htmlFor="emergencyContactPhone"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      Emergency Contact Phone (10 digits)
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContactPhone",
                          e.target.value
                        )
                      }
                      type="tel"
                      placeholder="10-digit phone number of emergency contact"
                      maxLength={10}
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-8">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-gradient-to-r from-red-200 to-orange-200">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-xl">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-red-700 to-orange-700 bg-clip-text text-transparent">
                    Medical Information
                  </h3>
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="appointment"
                    className="text-lg font-bold text-gray-700"
                  >
                    Appointment *
                  </Label>
                  <Select
                    value={formData.appointment}
                    onValueChange={(value) =>
                      handleInputChange("appointment", value)
                    }
                  >
                    <SelectTrigger className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold">
                      <SelectValue placeholder="Select Vaidya Ji" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vaidya Kavita Sharma (BAMS, MD)">
                        Vaidya Kavita Sharma (BAMS, MD)
                      </SelectItem>
                      <SelectItem value="Vaidya Swati Tyagi (BAMS)">
                        Vaidya Swati Tyagi (BAMS)
                      </SelectItem>
                      <SelectItem value="Vaidya Manisha Sharma (BAMS)">
                        Vaidya Manisha Sharma (BAMS)
                      </SelectItem>
                      <SelectItem value="Vaidya Vinod Sharma (BSC, BAMS, FISC)">
                        Vaidya Vinod Sharma (BSC, BAMS, FISC)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label
                      htmlFor="speciality"
                      className="text-lg font-bold text-gray-700"
                    >
                      Choose Speciality
                    </Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) =>
                        handleInputChange("department", value)
                      }
                    >
                      <SelectTrigger className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold">
                        <SelectValue placeholder="Select Speciality" />
                      </SelectTrigger>
                      <SelectContent>
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

                  <div className="space-y-3 group">
                    <Label
                      htmlFor="medicalHistory"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      Medical History
                    </Label>
                    <Textarea
                      id="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={(e) =>
                        handleInputChange("medicalHistory", e.target.value)
                      }
                      placeholder="Previous medical conditions, surgeries, chronic illnesses"
                      rows={4}
                      className="text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold resize-none"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="sponsor"
                      className="text-lg font-bold text-gray-700 group-focus-within:text-orange-600 transition-colors"
                    >
                      Sponsor
                    </Label>
                    <Input
                      id="sponsor"
                      type="text"
                      value={formData.sponsor}
                      onChange={(e) =>
                        handleInputChange("sponsor", e.target.value)
                      }
                      placeholder="Enter sponsor name (e.g., Self, CGHS, ESIC, etc.)"
                      className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-6 pt-8 border-t-2 border-gradient-to-r from-gray-200 to-orange-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      firstName: "",
                      lastName: "",
                      age: 0,
                      gender: "",
                      maritalStatus: "",
                      occupation: "",
                      phone: 0,
                      email: "",
                      aadharnum: 0,
                      houseno: "",
                      city: "",
                      state: "",
                      district: "",
                      pin: 0,
                      emergencyContactName: "",
                      emergencyContactPhone: 0,
                      appointment: "",
                      department: "",
                      medicalHistory: "",
                      sponsor: "",
                      date: "",
                    });
                  }}
                  className="h-16 px-10 text-lg font-black border-3 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                >
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-16 px-12 bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:from-orange-700 hover:via-red-700 hover:to-amber-700 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-2xl font-black text-xl border-2 border-white/30 relative overflow-hidden group min-w-[200px]"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {isSubmitting ? (
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Registering...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <User className="h-6 w-6" />
                      <span>Register Patient</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientForm;
