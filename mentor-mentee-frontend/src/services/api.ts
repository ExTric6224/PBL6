import axios from 'axios';
import { AuthResponse, RegisterData, LoginData, User } from '../types/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    console.log('Register API call with data:', data);
    const response = await api.post('/auth/register', data);
    console.log('Register response:', response.data);
    return response.data.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    console.log('Login API call with data:', data);
    try {
      const response = await api.post('/auth/login', data);
      console.log('Login response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Login API error:', error.response?.data);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  healthCheck: async (): Promise<{ ok: boolean; timestamp: string }> => {
    const response = await api.get('/health');
    return response.data;
  },

  // OTP Registration APIs
  requestOtpCode: async (data: RegisterData): Promise<{ email: string; ttlMinutes: number }> => {
    console.log('Request OTP code with data:', data);
    try {
      const response = await api.post('/auth/register/request-code', data);
      console.log('OTP request response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('OTP request error:', error.response?.data);
      throw error;
    }
  },

  verifyOtpCode: async (data: { email: string; code: string }): Promise<AuthResponse> => {
    console.log('Verify OTP code for email:', data.email);
    try {
      const response = await api.post('/auth/register/verify', data);
      console.log('OTP verify response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('OTP verify error:', error.response?.data);
      throw error;
    }
  },

  resendOtpCode: async (email: string): Promise<{ email: string; ttlMinutes: number }> => {
    console.log('Resend OTP code for email:', email);
    try {
      const response = await api.post('/auth/register/resend', { email });
      console.log('OTP resend response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('OTP resend error:', error.response?.data);
      throw error;
    }
  },
};

export default api;