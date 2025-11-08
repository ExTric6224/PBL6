import { Router } from 'express';
import { TopicsController } from '../controllers/topics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const topicsController = new TopicsController();

/**
 * @route GET /api/topics
 * @desc Get all topics
 * @access Private
 */
router.get('/', authenticate, topicsController.getAllTopics.bind(topicsController));

export default router;
