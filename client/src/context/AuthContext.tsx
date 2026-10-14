import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/endpoints';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  googleLogin: (credential: string, mode?: 'signin' | 'signup') => Promise<void>;
  register: (payload: { name: string; email: string; password: string; confirmPassword?: string; monthlyIncome?: number }) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tizori_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tizori_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      authApi
        .getMe()
        .then(res => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('tizori_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('tizori_token', res.token);
      localStorage.setItem('tizori_user', JSON.stringify(res.user));
    }
  };

  const googleLogin = async (credential: string, mode: 'signin' | 'signup' = 'signin') => {
    const res = await authApi.googleLogin(credential, mode);
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('tizori_token', res.token);
      localStorage.setItem('tizori_user', JSON.stringify(res.user));
    }
  };

  const register = async (payload: { name: string; email: string; password: string; confirmPassword?: string; monthlyIncome?: number }) => {
    const res = await authApi.register(payload);
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('tizori_token', res.token);
      localStorage.setItem('tizori_user', JSON.stringify(res.user));
    }
  };

  const demoLogin = async () => {
    const res = await authApi.demoLogin();
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('tizori_token', res.token);
      localStorage.setItem('tizori_user', JSON.stringify(res.user));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('tizori_token');
    localStorage.removeItem('tizori_user');
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('tizori_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const formatCurrency = (amount: number): string => {
    const currency = user?.currency || 'INR';
    try {
      return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString()}`;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        googleLogin,
        register,
        demoLogin,
        logout,
        refreshUser,
        formatCurrency,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
