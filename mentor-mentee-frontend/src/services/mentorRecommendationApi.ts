import api from './api';

export interface MentorStats {
  totalSessions: number;
  totalFeedbacks: number;
  averageRating: number;
  upcomingSchedules: number;
  totalMentees: number;
}

export interface MentorRecommendation {
  id: number;
  userId: number;
  fullName: string;
  avatar?: string;
  phoneNumber?: string;
  school?: string;
  degree?: string;
  yearsExp?: number;
  bio?: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
  expertise: Array<{
    id: number;
    name: string;
    description?: string;
  }>;
  stats: MentorStats;
}

export interface MentorRecommendationResponse {
  data: MentorRecommendation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const mentorRecommendationApi = {
  getRecommendedMentors: async (
    page: number = 1,
    limit: number = 10,
    sortBy: 'sessions' | 'rating' | 'experience' | 'feedbacks' = 'sessions',
    topicId?: number
  ): Promise<MentorRecommendationResponse> => {
    const params: any = { page, limit, sortBy };
    if (topicId) {
      params.topicId = topicId;
    }
    const response = await api.get('/mentors', { params });
    return response.data.data;
  },

  getMentorStats: async (mentorId: number): Promise<MentorStats> => {
    const response = await api.get(`/mentors/${mentorId}/stats`);
    return response.data.data;
  },
};
