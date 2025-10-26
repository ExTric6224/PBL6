import { Router } from 'express';
import { FeedbacksController } from '../controllers/feedbacks.controller';
import { validate, validateQuery } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';
import { createFeedbackSchema, feedbackQuerySchema } from '../schemas/feedbacks.schema';

const router = Router();
const feedbacksController = new FeedbacksController();

// All routes require authentication
router.post('/', authenticate, authorizePermissions('feedback:create'), validate(createFeedbackSchema), feedbacksController.createFeedback.bind(feedbacksController));
router.get('/mentor/:mentorId', authenticate, authorizePermissions('feedback:view_any'), validateQuery(feedbackQuerySchema), feedbacksController.getFeedbacksByMentor.bind(feedbacksController));
router.get('/my', authenticate, authorizePermissions('feedback:view_own'), validateQuery(feedbackQuerySchema), feedbacksController.getMyFeedbacks.bind(feedbacksController));

export default router;
