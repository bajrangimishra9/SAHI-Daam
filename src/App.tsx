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

/* ✅ New Admin Pages */
import AdminHome from "./pages/app/admin/AdminHome";
import AdminMap from "./pages/app/admin/AdminMap";
import AdminSuppliers from "./pages/app/admin/AdminSuppliers";
import AdminVerification from "./pages/app/admin/AdminVerification";
import AdminRules from "./pages/app/admin/AdminRules";
import AdminAnalytics from "./pages/app/admin/AdminAnalytics";
import AdminSettings from "./pages/app/admin/AdminSettings";

import DemoRoleRoute from "./components/auth/DemoRoleRoute";
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
                {/* Public Pages */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth/role" element={<RoleSelect />} />

                {/* Client */}
                <Route
                  path="/client"
                  element={
                    <DemoRoleRoute role="client">
                      <VendorDashboard />
                    </DemoRoleRoute>
                  }
                />

                {/* Supplier */}
                <Route
                  path="/supplier"
                  element={
                    <DemoRoleRoute role="supplier">
                      <SupplierDashboard />
                    </DemoRoleRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <DemoRoleRoute role="admin">
                      <AdminHome />
                    </DemoRoleRoute>
                  }
                />
                <Route
                  path="/admin/map"
                  element={
                    <DemoRoleRoute role="admin">
                      <AdminMap />
                    </DemoRoleRoute>
                  }
                />
                <Route
                  path="/admin/suppliers"
                  element={
                    <DemoRoleRoute role="admin">
                      <AdminSuppliers />
                    </DemoRoleRoute>
                  }
                />
                <Route
                  path="/admin/verification"
                  element={
                    <DemoRoleRoute role="admin">
                      <AdminVerification />
                    </DemoRoleRoute>
                  }
                />
                <Route
                  path="/admin/rules"
                  element={
                    <DemoRoleRoute role="admin">
                      <AdminRules />
                    </DemoRoleRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <DemoRoleRoute role="admin">
                      <AdminAnalytics />
                    </DemoRoleRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <DemoRoleRoute role="admin">
                      <AdminSettings />
                    </DemoRoleRoute>
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
