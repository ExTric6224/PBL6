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
    topic: string;
    startAt: string;
    endAt: string;
    capacity: number;
    status: string;
    mentorId: number;
    mentor?: {
      id: number;
      email: string;
      mentorProfile?: {
        id: number;
        fullName?: string;
        bio?: string;
        school?: string;
        degree?: string;
        yearsExp?: number;
        expertise?: Array<{
          id: number;
          name: string;
          description?: string;
        }>;
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
