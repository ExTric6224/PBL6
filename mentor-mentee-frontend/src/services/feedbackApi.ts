import api from './api';
import { Feedback, CreateFeedbackData, FeedbackQueryParams } from '../types/feedback';
import { ApiResponse, PaginatedResponse } from '../types/common';

export const feedbackApi = {
  // Create feedback (MENTEE after session)
  createFeedback: async (data: CreateFeedbackData): Promise<Feedback> => {
    const response = await api.post<ApiResponse<Feedback>>('/feedbacks', data);
    return response.data.data;
  },

  // Get feedbacks by mentor
  getFeedbacksByMentor: async (mentorId: number, params?: FeedbackQueryParams): Promise<PaginatedResponse<Feedback>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<ApiResponse<PaginatedResponse<Feedback>>>(`/feedbacks/mentor/${mentorId}?${queryParams.toString()}`);
    return response.data.data;
  },

  // Get my feedbacks
  getMyFeedbacks: async (params?: FeedbackQueryParams): Promise<PaginatedResponse<Feedback>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<ApiResponse<PaginatedResponse<Feedback>>>(`/feedbacks/my?${queryParams.toString()}`);
    return response.data.data;
  },

  // Delete feedback (ADMIN)
  deleteFeedback: async (id: number): Promise<void> => {
    await api.delete(`/feedbacks/${id}`);
  },
};
