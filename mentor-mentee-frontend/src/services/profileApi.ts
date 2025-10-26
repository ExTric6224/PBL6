import api from './api';
import { MentorProfile, MenteeProfile, CreateMentorProfileData, CreateMenteeProfileData } from '../types/profile';
import { ApiResponse } from '../types/common';

export const profileApi = {
  // Create/Update mentor profile
  createOrUpdateMentorProfile: async (data: CreateMentorProfileData): Promise<MentorProfile> => {
    const response = await api.post<ApiResponse<MentorProfile>>('/profiles/mentor', data);
    return response.data.data;
  },

  // Get mentor profile
  getMentorProfile: async (userId: number): Promise<MentorProfile> => {
    const response = await api.get<ApiResponse<MentorProfile>>(`/profiles/mentor/${userId}`);
    return response.data.data;
  },

  // Create/Update mentee profile
  createOrUpdateMenteeProfile: async (data: CreateMenteeProfileData): Promise<MenteeProfile> => {
    const response = await api.post<ApiResponse<MenteeProfile>>('/profiles/mentee', data);
    return response.data.data;
  },

  // Get mentee profile
  getMenteeProfile: async (userId: number): Promise<MenteeProfile> => {
    const response = await api.get<ApiResponse<MenteeProfile>>(`/profiles/mentee/${userId}`);
    return response.data.data;
  },
};
