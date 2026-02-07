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

// ✅ ProtectedRoute with debugging
const ProtectedRoute = ({ allowedRoles, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    console.log('🔒 ProtectedRoute check:', { 
      path: location.pathname,
      hasToken: !!token, 
      userRole: role, 
      allowedRoles 
    });

    if (!token) {
      console.log('❌ No token, redirecting to login');
      navigate("/login", { replace: true });
    } else if (!allowedRoles.includes(role)) {
      console.log('❌ Role not allowed. User:', role, 'Allowed:', allowedRoles);
      navigate("/unauthorized", { replace: true });
    } else {
      console.log('✅ Access granted for role:', role);
    }
  }, [navigate, allowedRoles, location.pathname]);

  return children;
};

// ✅ FIXED: Role-based redirect now includes admin → /home
const RoleBasedRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    
    console.log('🔄 RoleBasedRedirect - User role:', role);

    if (role === "admin") {
      console.log('✅ Admin detected, redirecting to /home');
      navigate("/home", { replace: true });
    } else if (role === "doctor") {
      console.log('✅ Doctor detected, redirecting to /doctor');
      navigate("/doctor", { replace: true });
    } else if (role === "receptionist") {
      console.log('✅ Receptionist detected, redirecting to /home');
      navigate("/home", { replace: true });
    } else {
      console.log('❌ No valid role, redirecting to login');
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null;
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

            {/* ✅✅✅ CRITICAL FIX: Added "admin" to allowedRoles ✅✅✅ */}
            <Route
              path="/home"
              element={
                <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
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
