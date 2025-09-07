import { Response } from 'express';
import 'express-async-errors';
import { FeedbacksService } from '../services/feedbacks.service';
import { success, authError, notFoundError, conflictError } from '../utils/responses';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const feedbacksService = new FeedbacksService();

export class FeedbacksController {
  async createFeedback(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'MENTEE') {
        return authError(res, 'Only mentees can provide feedback');
      }

      const feedback = await feedbacksService.createFeedback(req.user!.sub, req.body);
      return success(res, feedback, 201);
    } catch (error: any) {
      if (error.message === 'Session not found or access denied') {
        return notFoundError(res, 'Session not found or you do not have permission');
      }
      if (error.message === 'Cannot provide feedback for ongoing session') {
        return conflictError(res, error.message);
      }
      if (error.message === 'Feedback already provided for this session') {
        return conflictError(res, error.message);
      }
      throw error;
    }
  }

  async getFeedbacksByMentor(req: AuthenticatedRequest, res: Response) {
    try {
      const mentorId = parseInt(req.params.mentorId, 10);
      const result = await feedbacksService.getFeedbacksByMentor(mentorId, req.query as any);
      return success(res, result);
    } catch (error: any) {
      throw error;
    }
  }

  async getMyFeedbacks(req: AuthenticatedRequest, res: Response) {
    try {
      let feedbacks;
      
      if (req.user!.role === 'MENTEE') {
        feedbacks = await feedbacksService.getFeedbacksByMentee(req.user!.sub);
      } else if (req.user!.role === 'MENTOR') {
        const result = await feedbacksService.getFeedbacksByMentor(req.user!.sub, req.query as any);
        feedbacks = result;
      } else {
        return authError(res, 'Invalid user role');
      }

      return success(res, feedbacks);
    } catch (error: any) {
      throw error;
    }
  }
}
