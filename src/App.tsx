import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import MemberLayout from "@/components/layouts/MemberLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import AffiliateMarketplace from "./pages/dashboard/AffiliateMarketplace";
import ReferralPage from "./pages/dashboard/ReferralPage";
import HistoryPage from "./pages/dashboard/HistoryPage";
import WithdrawPage from "./pages/dashboard/WithdrawPage";

import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Member dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={["member"]}>
                <MemberLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="affiliate" element={<AffiliateMarketplace />} />
              <Route path="referral" element={<ReferralPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="withdraw" element={<WithdrawPage />} />
            </Route>

            {/* Staff dashboard */}
            <Route path="/staff" element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            } />

            {/* Admin dashboard */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
