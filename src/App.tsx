import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { ProjectStoreProvider } from '@/contexts/ProjectStore';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const AppContent = () => {
  const { user } = useAuth();
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
