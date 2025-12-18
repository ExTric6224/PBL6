import { ScheduleStatus } from './common';
import { Topic } from './topic';

export interface Schedule {
  id: number;
  mentorId: number;
  topic: string;
  description?: string;
  startAt: string;
  endAt: string;
  capacity: number;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt?: string;
  booking?: {
    id: number;
    userId: number;
    status: string;
    notes?: string;
    user?: {
      id: number;
      email: string;
    };
  }[];
  mentor?: {
    id: number;
    email: string;
    mentorProfile?: {
      bio: string;
      expertise: Topic[]; // Changed from string[] to Topic[]
      experience: number;
      fullName?: string;
    };
  };
}

export interface CreateScheduleData {
  topic: string;
  description?: string;
  startAt: string;
  endAt: string;
  capacity?: number; // Optional, default is 1
}

export interface UpdateScheduleData {
  topic?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  capacity?: number;
  status?: ScheduleStatus;
}

export interface ScheduleQueryParams {
  mentorId?: number;
  status?: ScheduleStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
