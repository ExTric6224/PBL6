import { BookingStatus } from './common';

export interface Booking {
  id: number;
  menteeId: number;
  scheduleId: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  mentee?: {
    id: number;
    email: string;
    menteeProfile?: {
      interests: string[];
      goals: string;
    };
  };
  schedule?: {
    id: number;
    startTime: string;
    endTime: string;
    mentor?: {
      id: number;
      email: string;
      mentorProfile?: {
        bio: string;
        expertise: string[];
      };
    };
  };
}

export interface CreateBookingData {
  scheduleId: number;
  notes?: string;
}

export interface UpdateBookingData {
  status?: BookingStatus;
  notes?: string;
}
