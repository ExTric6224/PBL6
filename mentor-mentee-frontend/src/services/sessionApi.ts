import api from './api';
import { Session, StartSessionData, EndSessionData } from '../types/session';
import { ApiResponse } from '../types/common';

export const sessionApi = {
  // Start session (MENTOR)
  startSession: async (data: StartSessionData): Promise<Session> => {
    const response = await api.post<ApiResponse<Session>>('/sessions/start', data);
    return response.data.data;
  },

  // End session (MENTOR)
  endSession: async (data: EndSessionData): Promise<Session> => {
    const response = await api.post<ApiResponse<Session>>('/sessions/end', data);
    return response.data.data;
  },

  // Get my sessions
  getMySessions: async (): Promise<Session[]> => {
    const response = await api.get<ApiResponse<Session[]>>('/sessions/my');
    return response.data.data;
  },
};
