export interface Feedback {
  id: number;
  sessionId: number;
  mentorId: number;
  menteeId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  mentor?: {
    id: number;
    email: string;
    mentorProfile?: {
      bio: string;
      expertise: string[];
    };
  };
  mentee?: {
    id: number;
    email: string;
  };
  session?: {
    id: number;
    startTime: string;
    endTime?: string;
  };
}

export interface CreateFeedbackData {
  sessionId: number;
  rating: number;
  comment?: string;
}

export interface FeedbackQueryParams {
  mentorId?: number;
  page?: number;
  limit?: number;
}
