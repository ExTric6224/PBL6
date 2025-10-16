import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, RegisterData, LoginData } from '../types/auth';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  // OTP Registration methods
  requestOtpCode: (data: RegisterData) => Promise<{ email: string; ttlMinutes: number }>;
  verifyOtpCode: (data: { email: string; code: string }) => Promise<void>;
  resendOtpCode: (email: string) => Promise<{ email: string; ttlMinutes: number }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // Verify token is still valid by getting current user
        const currentUser = await authAPI.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // Token is invalid, clear storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const login = async (data: LoginData) => {
    try {
      setLoading(true);
      console.log('Login data being sent:', data);
      const response: AuthResponse = await authAPI.login(data);
      
      // Store token and user data
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response: AuthResponse = await authAPI.register(data);
      
      // Store token and user data
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const requestOtpCode = async (data: RegisterData) => {
    try {
      setLoading(true);
      console.log('Request OTP code data:', data);
      const response = await authAPI.requestOtpCode(data);
      return response;
    } catch (error) {
      console.error('Request OTP error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpCode = async (data: { email: string; code: string }) => {
    try {
      setLoading(true);
      console.log('Verify OTP code for:', data.email);
      const response = await authAPI.verifyOtpCode(data);
      
      // Store token and user data
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendOtpCode = async (email: string) => {
    try {
      setLoading(true);
      console.log('Resend OTP code for:', email);
      const response = await authAPI.resendOtpCode(email);
      return response;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    requestOtpCode,
    verifyOtpCode,
    resendOtpCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};