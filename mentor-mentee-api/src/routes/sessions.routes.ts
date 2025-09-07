import { Router } from 'express';
import { SessionsController } from '../controllers/sessions.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { startSessionSchema, endSessionSchema } from '../schemas/sessions.schema';

const router = Router();
const sessionsController = new SessionsController();

// All routes require authentication
router.post('/start', authenticate, validate(startSessionSchema), sessionsController.startSession.bind(sessionsController));
router.post('/end', authenticate, validate(endSessionSchema), sessionsController.endSession.bind(sessionsController));
router.get('/my', authenticate, sessionsController.getMySessions.bind(sessionsController));

export default router;
