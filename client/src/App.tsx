import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RefrshHandler from "./RefreshHandler";
import Vaidyashaala from "./pages/Vaidyashaala";
import DoctorDashboard from "./pages/DoctorDashboard";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";

// ✅ New: ProtectedRoute with imperative redirect
const ProtectedRoute = ({ allowedRoles, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token) {
      navigate("/login", { replace: true });
    } else if (!allowedRoles.includes(role)) {
      navigate("/unauthorized", { replace: true });
    }
  }, [navigate, allowedRoles]);

  return children;
};

// ✅ Role-based redirect using useEffect
const RoleBasedRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("userRole");

    if (role === "doctor") {
      navigate("/doctor", { replace: true });
    } else if (role === "receptionist") {
      navigate("/home", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null; // Just a redirect handler
};

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true }}>
          <RefrshHandler setIsAuthenticated={setIsAuthenticated} />
          <Routes>
            {/* Default landing */}
            <Route path="/" element={<RoleBasedRedirect />} />

            {/* Doctor-only */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Receptionist-only */}
            <Route
              path="/home"
              element={
                <ProtectedRoute allowedRoles={["receptionist"]}>
                  <Index />
                </ProtectedRoute>
              }
            />

            {/* Public pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/vaidyashaala" element={<Vaidyashaala />} />

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* 404 */} 
            <Route path="*" element={<NotFound />} /> 
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
