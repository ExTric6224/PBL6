import { Response } from 'express';
import 'express-async-errors';
import { TopicsService } from '../services/topics.service';
import { success } from '../utils/responses';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const topicsService = new TopicsService();

export class TopicsController {
  async getAllTopics(req: AuthenticatedRequest, res: Response) {
    try {
      const topics = await topicsService.getAllTopics();
      return success(res, topics);
    } catch (error: any) {
      throw error;
    }
  }
}
