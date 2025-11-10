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
    mentorprofile?: {
      fullName?: string;
      bio?: string;
      expertise?: any;
    };
  };
  mentee?: {
    id: number;
    email: string;
    menteeprofile?: {
      fullName?: string;
    };
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
