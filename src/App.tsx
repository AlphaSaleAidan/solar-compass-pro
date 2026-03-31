import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { ProjectStoreProvider } from '@/contexts/ProjectStore';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return user ? <Dashboard /> : <Login />;
};

const App = () => (
  <AuthProvider>
    <ProjectStoreProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </ProjectStoreProvider>
  </AuthProvider>
);

export default App;
