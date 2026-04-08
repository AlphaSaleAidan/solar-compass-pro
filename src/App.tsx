import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { DataSourceProvider } from '@/contexts/DataSourceProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import CinematicBackground from '@/components/shared/CinematicBackground';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

/* ─── Loading spinner ─────────────────────────────────────────────────── */
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(220, 30%, 4%)' }}>
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <motion.div
        className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center"
        animate={{ rotate: [0, 90, 180, 270, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-4 h-4 rounded-md bg-primary" />
      </motion.div>
      <span className="text-primary/60 text-xs font-semibold tracking-wider uppercase">Loading</span>
    </motion.div>
  </div>
);

/* ─── Route guards ────────────────────────────────────────────────────── */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

/* ─── Route-level page transition wrapper ─────────────────────────────── */
const RouteTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

/* ─── Animated routes ─────────────────────────────────────────────────── */
const AppContent = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RouteTransition><LandingPage /></RouteTransition>} />
        <Route path="/login" element={<PublicRoute><RouteTransition><Login /></RouteTransition></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RouteTransition><Register /></RouteTransition></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><RouteTransition><ForgotPassword /></RouteTransition></PublicRoute>} />
        <Route path="/reset-password" element={<RouteTransition><ResetPassword /></RouteTransition>} />
        <Route path="/dashboard" element={<ProtectedRoute><RouteTransition><Dashboard /></RouteTransition></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/solar-compass-pro">
        <AuthProvider>
          <DataSourceProvider>
            <TooltipProvider>
              {/* Global 3D background — persists across ALL pages */}
              <CinematicBackground />
              <Toaster />
              <Sonner />
              <AppContent />
            </TooltipProvider>
          </DataSourceProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
