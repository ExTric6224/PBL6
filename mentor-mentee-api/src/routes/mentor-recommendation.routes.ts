import { Router } from 'express';
import { MentorRecommendationController } from '../controllers/mentor-recommendation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const mentorRecommendationController = new MentorRecommendationController();

// Get recommended mentors (with pagination and sorting)
router.get(
  '/',
  authenticate,
  mentorRecommendationController.getRecommendedMentors.bind(mentorRecommendationController)
);

// Get specific mentor stats
router.get(
  '/:mentorId/stats',
  authenticate,
  mentorRecommendationController.getMentorStats.bind(mentorRecommendationController)
);

export default router;
