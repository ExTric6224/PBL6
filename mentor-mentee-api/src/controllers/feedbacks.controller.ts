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
      // MENTEE: Xem feedback đã tạo (feedback:view_own)
      // MENTOR: Xem feedback nhận được (feedback:view_own)
      
      if (req.user!.role === 'MENTEE') {
        // Mentee chỉ xem feedback mà họ đã tạo
        const feedbacks = await feedbacksService.getFeedbacksByMentee(req.user!.sub);
        return success(res, {
          data: feedbacks,
          total: feedbacks.length,
          page: 1,
          limit: feedbacks.length,
          totalPages: 1
        });
      } else if (req.user!.role === 'MENTOR') {
        // Mentor chỉ xem feedback mà họ nhận được
        const result = await feedbacksService.getFeedbacksByMentor(req.user!.sub, req.query as any);
        return success(res, {
          data: result.feedbacks,
          total: result.feedbacks.length,
          page: 1,
          limit: result.feedbacks.length,
          totalPages: 1,
          stats: result.stats
        });
      } else {
        return authError(res, 'Invalid user role');
      }
    } catch (error: any) {
      throw error;
    }
  }
}
