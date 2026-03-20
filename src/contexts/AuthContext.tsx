import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'sales_rep' | 'backend_ops' | 'installer' | 'financier';
export type PortalMode = 'asp' | 'asp_plus';

interface User {
  username: string;
  role: UserRole;
  name: string;
  portalMode: PortalMode;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role: UserRole, mode: PortalMode) => boolean;
  logout: () => void;
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [portalMode, setPortalMode] = useState<PortalMode>('asp');

  const login = (username: string, password: string, role: UserRole, mode: PortalMode) => {
    if (username === 'Test001' && password === 'ASP26!') {
      const nameMap: Record<UserRole, string> = {
        sales_rep: 'Jordan Mills',
        backend_ops: 'Admin Ops',
        installer: 'SunTech Installations',
        financier: 'Apex Capital Group',
      };
      setUser({ username, role, name: nameMap[role], portalMode: mode });
      setPortalMode(mode);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setPortalMode('asp');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, portalMode, setPortalMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
