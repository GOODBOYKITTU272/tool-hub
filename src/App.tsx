import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ReloadProtection } from "@/components/ReloadProtection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy, useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import PasswordReset from "./pages/PasswordReset";
import Dashboard from "./pages/Dashboard";
import Tools from "./pages/Tools";
import ToolDetail from "./pages/ToolDetail";
import Requests from "./pages/Requests";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import PendingTools from "./pages/PendingTools";
import DailyJournal from "./pages/DailyJournal";
import TeamLogs from "./pages/TeamLogs";
const ChatGPTUsage = lazy(() => import('@/pages/ChatGPTUsage'));
const Profile = lazy(() => import('@/pages/Profile'));
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

// Component to handle hash fragment redirects
function HashRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if URL has hash with recovery token
    if (location.hash && location.hash.includes('type=recovery')) {
      // Redirect to password-reset page with the hash
      navigate('/password-reset' + location.hash, { replace: true });
    }
  }, [location.hash, navigate]);

  return null;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <HashRedirectHandler />
              <ReloadProtection />
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/password-reset" element={<PasswordReset />} />
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/tools/:id" element={<ToolDetail />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/daily-journal" element={<DailyJournal />} />
                    <Route path="/team-logs" element={<TeamLogs />} />
                    <Route path="/pending-tools" element={<PendingTools />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/audit-logs" element={<AuditLogs />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/chatgpt-usage" element={<ChatGPTUsage />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
