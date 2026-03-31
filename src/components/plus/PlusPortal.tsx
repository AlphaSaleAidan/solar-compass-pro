import { useAuth } from '@/contexts/AuthContext';
import InstallerPortal from './InstallerPortal';
import FinancierPortal from './FinancierPortal';

const PlusPortal = () => {
  const { user } = useAuth();
  const isFinancier = user?.activeRole === 'financier';

  return isFinancier ? <FinancierPortal /> : <InstallerPortal />;
};

export default PlusPortal;
