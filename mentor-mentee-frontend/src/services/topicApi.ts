import api from './api';
import { Topic } from '../types/topic';
import { ApiResponse } from '../types/common';

export const topicApi = {
  // Get all topics
  getAllTopics: async (): Promise<Topic[]> => {
    const response = await api.get<ApiResponse<Topic[]>>('/topics');
    return response.data.data;
  },
};
