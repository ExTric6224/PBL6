import { SessionStatus } from './common';

export interface Session {
  id: number;
  bookingId: number;
  mentorId: number;
  menteeId: number;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  mentor?: {
    id: number;
    email: string;
  };
  mentee?: {
    id: number;
    email: string;
  };
  booking?: {
    id: number;
    notes?: string;
  };
}

export interface StartSessionData {
  bookingId: number;
  notes?: string;
}

export interface EndSessionData {
  sessionId: number;
  notes?: string;
}
