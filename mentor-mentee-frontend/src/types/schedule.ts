import { ScheduleStatus } from './common';

export interface Schedule {
  id: number;
  mentorId: number;
  topic: string;
  startAt: string;
  endAt: string;
  capacity: number;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt?: string;
  mentor?: {
    id: number;
    email: string;
    mentorProfile?: {
      bio: string;
      expertise: string[];
      experience: number;
    };
  };
}

export interface CreateScheduleData {
  topic: string;
  startAt: string;
  endAt: string;
  capacity?: number; // Optional, default is 1
}

export interface UpdateScheduleData {
  topic?: string;
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
