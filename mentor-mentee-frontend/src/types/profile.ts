import { Topic } from './topic';

export interface MentorProfile {
  id: number;
  userId: number;
  fullName: string;
  avatar?: string;
  phoneNumber?: string;
  school?: string;
  expertise: Topic[]; // Changed from string[] to Topic[]
  degree?: string;
  yearsExp?: number;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    email: string;
    role: string;
    createdAt: string;
  };
}

export interface MenteeProfile {
  id: number;
  userId: number;
  fullName: string;
  avatar?: string;
  phoneNumber?: string;
  goals?: string;
  interests: Topic[]; // Changed from string[] to Topic[]
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    email: string;
    role: string;
    createdAt: string;
  };
}

export interface CreateMentorProfileData {
  fullName: string;
  avatar?: string;
  phoneNumber?: string;
  school?: string;
  expertise: number[]; // Changed from string[] to number[] (topic IDs)
  degree?: string;
  yearsExp?: number;
  bio?: string;
}

export interface CreateMenteeProfileData {
  fullName: string;
  avatar?: string;
  phoneNumber?: string;
  goals?: string;
  interests: number[]; // Changed from string[] to number[] (topic IDs)
}
