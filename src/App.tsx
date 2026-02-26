import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import RoleSelect from "./pages/auth/RoleSelect";
import VendorDashboard from "./pages/app/VendorDashboard";
import SupplierDashboard from "./pages/app/SupplierDashboard";
import AdminDashboard from "./pages/app/AdminDashboard";
import Login from "./pages/Login";

import ProtectedRoleRoute from "@/components/auth/ProtectedRoleRoute";
import IntroAnimation from "./components/motion/IntroAnimation";

const queryClient = new QueryClient();
const INTRO_SEEN_KEY = "sahi_dam_intro_seen";

const App = () => {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem(INTRO_SEEN_KEY);
  });

  const [introComplete, setIntroComplete] = useState(() => {
    return !!sessionStorage.getItem(INTRO_SEEN_KEY);
  });

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem(INTRO_SEEN_KEY, "true");
    setShowIntro(false);
    setIntroComplete(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

        {introComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth/role" element={<RoleSelect />} />
                <Route path="/login" element={<Login />} />

                {/* CLIENT */}
                <Route
                  path="/client"
                  element={
                    <ProtectedRoleRoute allowedRole="client">
                      <VendorDashboard />
                    </ProtectedRoleRoute>
                  }
                />

                {/* SUPPLIER */}
                <Route
                  path="/supplier"
                  element={
                    <ProtectedRoleRoute allowedRole="supplier">
                      <SupplierDashboard />
                    </ProtectedRoleRoute>
                  }
                />

                {/* ADMIN */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoleRoute allowedRole="admin">
                      <AdminDashboard />
                    </ProtectedRoleRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </motion.div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
