import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { getCurrentUser, signOut as clientSignOut } from './client';

interface AuthContextType {
  user: User | null;
  loyaltyBalance: number;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response) {
        setUser(response.user);
        setLoyaltyBalance(response.loyaltyBalance);
      } else {
        setUser(null);
        setLoyaltyBalance(0);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
      setLoyaltyBalance(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await clientSignOut();
    setUser(null);
    setLoyaltyBalance(0);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loyaltyBalance,
        loading,
        signOut: handleSignOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
