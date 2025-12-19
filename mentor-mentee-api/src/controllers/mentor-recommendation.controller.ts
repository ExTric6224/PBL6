import { Response } from 'express';
import 'express-async-errors';
import { MentorRecommendationService } from '../services/mentor-recommendation.service';
import { success } from '../utils/responses';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const mentorRecommendationService = new MentorRecommendationService();

export class MentorRecommendationController {
  async getRecommendedMentors(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || 'sessions'; // sessions, rating, experience
      const topicId = req.query.topicId ? parseInt(req.query.topicId as string) : undefined;

      const result = await mentorRecommendationService.getRecommendedMentors({
        page,
        limit,
        sortBy,
        topicId,
      });

      return success(res, result);
    } catch (error: any) {
      throw error;
    }
  }

  async getMentorStats(req: AuthenticatedRequest, res: Response) {
    try {
      const mentorId = parseInt(req.params.mentorId, 10);
      const stats = await mentorRecommendationService.getMentorStats(mentorId);
      return success(res, stats);
    } catch (error: any) {
      throw error;
    }
  }
}
