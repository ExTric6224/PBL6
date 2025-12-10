import { Response } from 'express';
import 'express-async-errors';
import { SessionsService } from '../services/sessions.service';
import { success, authError, notFoundError, conflictError } from '../utils/responses';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const sessionsService = new SessionsService();

export class SessionsController {
  async startSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'MENTOR') {
        return authError(res, 'Only mentors can start sessions');
      }

      const session = await sessionsService.startSession(req.user!.sub, req.body);
      return success(res, session, 201);
    } catch (error: any) {
      if (error.message === 'Booking not found, not confirmed, or access denied') {
        return notFoundError(res, 'Booking not found, not confirmed, or you do not have permission');
      }
      if (error.message === 'Session already started') {
        return conflictError(res, 'Session has already been started');
      }
      if (error.message === 'Mentor profile not found') {
        return notFoundError(res, 'Mentor profile not found');
      }
      throw error;
    }
  }

  async endSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'MENTOR') {
        return authError(res, 'Only mentors can end sessions');
      }

      const session = await sessionsService.endSession(req.user!.sub, req.body);
      return success(res, session);
    } catch (error: any) {
      if (error.message === 'Session not found or access denied') {
        return notFoundError(res, 'Session not found or you do not have permission');
      }
      if (error.message === 'Session has already ended') {
        return conflictError(res, error.message);
      }
      throw error;
    }
  }

  async getMySessions(req: AuthenticatedRequest, res: Response) {
    try {
      let sessions;
      
      if (req.user!.role === 'ADMIN') {
        // Admin can see all sessions
        sessions = await sessionsService.getAllSessions();
      } else if (req.user!.role === 'MENTOR') {
        sessions = await sessionsService.getSessionsByMentor(req.user!.sub);
      } else if (req.user!.role === 'MENTEE') {
        sessions = await sessionsService.getSessionsByMentee(req.user!.sub);
      } else {
        return authError(res, 'Invalid user role');
      }

      return success(res, sessions);
    } catch (error: any) {
      throw error;
    }
  }
}
