import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginPayload, RegisterPayload, SocialAuthPayload } from '../types/auth';
import * as authService from '../services/auth';
import { getStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  socialLogin: (payload: SocialAuthPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const handleAuthChange = () => {
      fetchUser();
    };

    window.addEventListener('noteforge_auth_change', handleAuthChange);
    return () => window.removeEventListener('noteforge_auth_change', handleAuthChange);
  }, []);

  const login = async (credentials: LoginPayload) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterPayload) => {
    setLoading(true);
    try {
      const res = await authService.register(data);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (payload: SocialAuthPayload) => {
    setLoading(true);
    try {
      const res = await authService.socialLogin(payload);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        socialLogin,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
