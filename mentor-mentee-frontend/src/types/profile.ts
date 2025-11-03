export interface MentorProfile {
  id: number;
  userId: number;
  fullName: string;
  avatar?: string;
  school?: string;
  expertise: string[];
  degree?: string;
  yearsExp?: number;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    email: string;
  };
}

export interface MenteeProfile {
  id: number;
  userId: number;
  fullName: string;
  avatar?: string;
  goals?: string;
  interests: string[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    email: string;
  };
}

export interface CreateMentorProfileData {
  fullName: string;
  avatar?: string;
  school?: string;
  expertise: string[];
  degree?: string;
  yearsExp?: number;
  bio?: string;
}

export interface CreateMenteeProfileData {
  fullName: string;
  avatar?: string;
  goals?: string;
  interests: string[];
}
