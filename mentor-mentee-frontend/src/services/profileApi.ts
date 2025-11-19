import api from './api';
import { MentorProfile, MenteeProfile, CreateMentorProfileData, CreateMenteeProfileData } from '../types/profile';
import { ApiResponse } from '../types/common';

export const profileApi = {
  // Create/Update mentor profile
  createOrUpdateMentorProfile: async (data: CreateMentorProfileData, avatarFile?: File): Promise<MentorProfile> => {
    const formData = new FormData();
    
    // Add all fields except avatar (if it's a string path)
    formData.append('fullName', data.fullName);
    if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);
    if (data.school) formData.append('school', data.school);
    if (data.degree) formData.append('degree', data.degree);
    if (data.bio) formData.append('bio', data.bio);
    if (data.yearsExp !== undefined) formData.append('yearsExp', data.yearsExp.toString());
    
    // Add expertise array
    if (data.expertise && data.expertise.length > 0) {
      formData.append('expertise', JSON.stringify(data.expertise));
    }
    
    // Add avatar file if provided
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    
    const response = await api.post<ApiResponse<MentorProfile>>('/profiles/mentor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Get mentor profile
  getMentorProfile: async (userId: number): Promise<MentorProfile> => {
    const response = await api.get<ApiResponse<MentorProfile>>(`/profiles/mentor/${userId}`);
    return response.data.data;
  },

  // Create/Update mentee profile
  createOrUpdateMenteeProfile: async (data: CreateMenteeProfileData, avatarFile?: File): Promise<MenteeProfile> => {
    const formData = new FormData();
    
    // Add all fields
    formData.append('fullName', data.fullName);
    if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);
    if (data.goals) formData.append('goals', data.goals);
    
    // Add interests array
    if (data.interests && data.interests.length > 0) {
      formData.append('interests', JSON.stringify(data.interests));
    }
    
    // Add avatar file if provided
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    
    const response = await api.post<ApiResponse<MenteeProfile>>('/profiles/mentee', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Get mentee profile
  getMenteeProfile: async (userId: number): Promise<MenteeProfile> => {
    const response = await api.get<ApiResponse<MenteeProfile>>(`/profiles/mentee/${userId}`);
    return response.data.data;
  },

  // Get profile by userId (auto-detect mentor or mentee)
  getProfile: async (userId: number): Promise<MentorProfile | MenteeProfile> => {
    const response = await api.get<ApiResponse<MentorProfile | MenteeProfile>>(`/profiles/${userId}`);
    return response.data.data;
  },
};
