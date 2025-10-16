export interface User {
  id: number;
  email: string;
  role: 'MENTOR' | 'MENTEE' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  mentorProfile?: any;
  menteeProfile?: any;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'MENTOR' | 'MENTEE';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}