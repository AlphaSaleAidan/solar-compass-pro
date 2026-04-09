import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { DataSourceProvider } from '@/contexts/DataSourceProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy-load pages for code splitting
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const CouncilDashboard = lazy(() => import('@/pages/CouncilDashboard'));
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Lazy-load Three.js background — clean fade-in, no skeleton
const CinematicBackground = React.lazy(() => import('@/components/shared/CinematicBackground'));

const FadeInCanvas = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);
  return (
    <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}>
      <Suspense fallback={null}>
        <CinematicBackground />
      </Suspense>
    </div>
  );
};

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
    initial={{ opacity: 0, y: 12, scale: 0.99, filter: 'blur(4px)' }}
    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -8, scale: 1.005, filter: 'blur(2px)' }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

/* ─── Animated routes ─────────────────────────────────────────────────── */
const AppContent = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<RouteTransition><LandingPage /></RouteTransition>} />
          <Route path="/login" element={<PublicRoute><RouteTransition><Login /></RouteTransition></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RouteTransition><Register /></RouteTransition></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><RouteTransition><ForgotPassword /></RouteTransition></PublicRoute>} />
          <Route path="/reset-password" element={<RouteTransition><ResetPassword /></RouteTransition>} />
          <Route path="/dashboard" element={<ProtectedRoute><RouteTransition><Dashboard /></RouteTransition></ProtectedRoute>} />
          <Route path="/council" element={<ProtectedRoute><RouteTransition><CouncilDashboard /></RouteTransition></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/solar-compass-pro">
        <AuthProvider>
          <DataSourceProvider>
            <TooltipProvider>
              {/* Global 3D background — lazy-loaded with fade-in */}
              <FadeInCanvas />
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
