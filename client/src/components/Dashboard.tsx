import { useEffect, useState } from "react";
import NoticeBoard from "../components/NoticeBoard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Users,
  Calendar,
  FileText,
  Clock,
  Heart,
  LogOut,
  Thermometer,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import PatientForm from "../components/PatientForm";
import PatientList from "../components/PatientList";
import AppointmentScheduler from "../components/AppointmentScheduler";
import ReportGenerator from "../components/ReportGenerator";
import { useNavigate } from "react-router-dom";
import { handleSuccess } from "@/utils";
import { ToastContainer } from "react-toastify";
import MedicineInventory from "../components/MedcineInventory";
import Therapies from "../components/Therapies";
import Reports from "./Reports";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAppointmentScheduler, setShowAppointmentScheduler] =
    useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("");

  // Update time every second for live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoggedInUser(localStorage.getItem("loggedInUser"));
  });

  const navigate = useNavigate();
  const handleLogout = (e) => {
    e.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("tokenForDoctor");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole"); // ✅ Important: Clear role too!

    handleSuccess("Logged out successfully");

    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  const [currentSlide, setCurrentSlide] = useState(0);

  const doctors = [
    {
      name: "Vaidya Vinod Sharma (BSC, BAMS, FISC)",
      displayName: "Vaidya Vinod Sharma",
      qualification: "BSC, BAMS, FISC",
      photo: "/doctorimage.png",
    },
    {
      name: "Vaidya Manisha Sharma (BAMS)",
      displayName: "Vaidya Manisha Sharma",
      qualification: "BAMS",
      photo: "/Manisha Sharma.jpg",
    },
    {
      name: "Vaidya Swati Tyagi (BAMS)",
      displayName: "Vaidya Swati Tyagi",
      qualification: "BAMS",
      photo: "/Swati_Tyagi.jpg",
    },
    {
      name: "Vaidya Kavita Sharma (BAMS, MD)",
      displayName: "Vaidya Kavita Sharma",
      qualification: "BAMS, MD",
      photo: "/kavita_sharma.jpg",
    },
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % doctors.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [doctors.length]);

  const handleGoToVaidyashaala = () => {
    navigate("/vaidyashaala");
  };

  const handleDoctorClick = (doctor) => {
    // Set doctor information in localStorage
    localStorage.setItem("loggedInDoctor", doctor.name);
    localStorage.setItem("userRole", "doctor");
    localStorage.setItem("tokenForDoctor", "doctor-token"); // Set a token for authentication
    
    // Navigate to doctor page
    navigate("/doctor");
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % doctors.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + doctors.length) % doctors.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50/80 to-amber-100/90 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Enhanced Header with glassmorphism */}
      <div className="relative backdrop-blur-xl bg-white/90 shadow-2xl border-b border-white/30">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-red-600/10 to-amber-600/10"></div>
        <div className="relative max-w-7.5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 md:py-0">
            <div className="h-64 w-64 relative flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
              <img
                src="/icon2.png"
                alt="Therapy Icon"
                className="h-full w-full object-contain drop-shadow-lg"
              />
            </div>

            {/* CENTER: Bhartiya Darohar PNG and slogan */}
            {/* <div className="flex flex-col items-center text-center space-y-2 px-4">
              <img
                src="/BD1w.png"
                alt="BHARTIYA DAROHAR - Advanced Healthcare Management"
                className="w-full max-w-xs md:max-w-md object-contain transform hover:scale-105 transition-transform duration-300"
                style={{ maxHeight: "110px" }}
              />
              <p className="pt-5 text-2xl md:text-xl text-orange-800 font-medium leading-snug">
                भारतीय धरोहर का लक्ष्य : भारत के प्राचीन ज्ञान-विज्ञान एवं
                संस्कृति का संरक्षण, शोध एवं संवर्धन
              </p>
            </div> */}
            <div className="flex flex-col items-center text-center space-y-2 px-4">
  <div className="leading-none">
    <h1 className="text-6xl md:text-7xl font-bold text-orange-600">
      Immunity
    </h1>
    <h1 className="text-6xl md:text-6xl font-bold text-orange-600">
      Clinic
    </h1>
  </div>

  <p className="pt-5 text-2xl md:text-xl text-orange-800 font-medium leading-snug">
    भारतीय धरोहर का लक्ष्य : भारत के प्राचीन ज्ञान-विज्ञान एवं
    संस्कृति का संरक्षण, शोध एवं संवर्धन
  </p>
</div>


            {/* RIGHT: Date & Logout */}
            <div className="flex flex-col items-end space-y-3 text-right">
              {/* Welcome back */}
              <div className="text-right">
                <p className="text-base md:text-lg font-semibold tracking-wide">
                  {" "}
                  <span className="text-orange-700 font-bold">
                    {loggedInUser}
                  </span>
                </p>
              </div>

              {/* Clock */}
              <div className="flex items-center space-x-2 bg-orange-100 px-3 py-2 rounded-xl border border-orange-200">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-bold text-orange-700 text-lg">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>

              {/* Date */}
              <p className="text-sm text-orange-700 font-medium">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <div className="flex items-center space-x-4">
                {/* Back Button */}
                <Button
                  onClick={handleGoToVaidyashaala}
                  variant="outline"
                  size="default"
                  className="flex items-center space-x-1 md:space-x-2 bg-white/80 backdrop-blur-xl border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-600 hover:text-orange-700 font-semibold px-3 py-1 md:px-4 md:py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span>Back</span>
                </Button>

                {/* Logout Button */}
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

              <ToastContainer />
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-10"
        >
          {/* Enhanced Tab Navigation with 5 tabs */}
          <div className="flex justify-center">
            <TabsList className="overflow-visible grid w-full max-w-7xl grid-cols-5 p-3 h-[100%] bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-3xl">
              {/* <TabsTrigger
                value="overview"
                className="rounded-2xl font-bold transition-all duration-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:via-red-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-105 text-lg py-3"
              >
                Overview
              </TabsTrigger> */}
              <TabsTrigger
                value="register"
                className="rounded-2xl font-bold transition-all duration-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:via-red-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-105 text-lg py-3"
              >
                New Patient Registration
              </TabsTrigger>
              <TabsTrigger
                value="patients"
                className="rounded-2xl font-bold transition-all duration-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:via-red-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-105 text-lg py-3"
              >
                Patient Management
              </TabsTrigger>
              <TabsTrigger
                value="medicine"
                className="rounded-2xl font-bold transition-all duration-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:via-red-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-105 text-lg py-3"
              >
                Medicines
              </TabsTrigger>
              <TabsTrigger
                value="therapies"
                className="rounded-2xl font-bold transition-all duration-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:via-red-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-105 text-lg py-3"
              >
                Therapies
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="rounded-2xl font-bold transition-all duration-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:via-red-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-105 text-lg py-3"
              >
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-10 animate-fade-in">
            {/* Enhanced Doctors Section */}
            <div className="pt-4 pb-6 px-4 bg-orange-50">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-orange-800 mb-4">
                हमारे वैद्यों से मिलिए...
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
                {doctors.map((doctor, index) => (
                  <div
                    key={index}
                    onClick={() => handleDoctorClick(doctor)}
                    className="bg-white border border-orange-200 rounded-2xl p-4 shadow-lg flex flex-col items-center text-center hover:shadow-2xl transition duration-300 cursor-pointer hover:scale-105 hover:border-orange-400 transform"
                  >
                    <img
                      src={doctor.photo}
                      alt={doctor.displayName}
                      className="w-28 h-28 object-cover rounded-full border-4 border-orange-300 mb-3"
                    />
                    <h3 className="text-md font-semibold text-orange-800">
                      {doctor.displayName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {doctor.qualification}
                    </p>
                    <div className="mt-2 text-xs text-orange-600 font-medium">
                      Click to access dashboard
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* </div> */}
          </TabsContent>

          <TabsContent value="register" className="animate-fade-in">
            <PatientForm />
          </TabsContent>

          <TabsContent value="patients" className="animate-fade-in">
            <PatientList />
          </TabsContent>

          <TabsContent value="medicine" className="animate-fade-in">
            <MedicineInventory />
          </TabsContent>

          <TabsContent value="therapies" className="animate-fade-in">
            <Therapies />
          </TabsContent>
          <TabsContent value="reports" className="animate-fade-in">
            <Reports />
          </TabsContent>
        </Tabs>
      </div>

      {/* Copyright Footer */}
      <footer className="relative backdrop-blur-xl bg-white/90 border-t border-white/30 mt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 via-red-600/5 to-amber-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="space-y-3">
              <p className="text-xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                Developed by Advance Hydrau-Tech Pvt. Ltd. , Delhi
              </p>
              <p className="text-base text-gray-700 font-semibold">
                Turning waste into resources through innovation and
                sustainability
              </p>
              <div className="flex items-center justify-center space-x-2 pt-3">
                <p className="text-sm text-gray-500 font-medium">
                  © {new Date().getFullYear()} Advance Hydrau-Tech. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AppointmentScheduler
        isOpen={showAppointmentScheduler}
        onClose={() => setShowAppointmentScheduler(false)}
      />
      <ReportGenerator
        isOpen={showReportGenerator}
        onClose={() => setShowReportGenerator(false)}
      />
    </div>
  );
};

export default Dashboard;