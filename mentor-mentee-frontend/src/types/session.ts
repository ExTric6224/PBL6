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
  startedAt?: string;
  endedAt?: string;
  autoStarted?: boolean;
  autoEnded?: boolean;
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
    schedule?: any;
    user?: any;
  };
  feedback?: {
    id: number;
    rating: number;
    comment?: string;
    createdAt: string;
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
