import { Router, Request } from 'express';
import { SessionsController } from '../controllers/sessions.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';
import { startSessionSchema, endSessionSchema } from '../schemas/sessions.schema';
import prisma from '../db/client';

const router = Router();
const sessionsController = new SessionsController();

// All routes require authentication
router.post('/start', authenticate, authorizePermissions('session:create'), validate(startSessionSchema), sessionsController.startSession.bind(sessionsController));
router.post('/end', authenticate, authorizePermissions('session:update', {
  scope: 'own',
  getResourceOwnerId: async (req: Request) => {
    const session = await prisma.session.findUnique({ where: { id: Number(req.body.sessionId) } });
    return session?.mentorId ?? null;
  }
}), validate(endSessionSchema), sessionsController.endSession.bind(sessionsController));
router.get('/my', authenticate, authorizePermissions('session:view_own'), sessionsController.getMySessions.bind(sessionsController));
router.delete('/:id', authenticate, authorizePermissions('session:delete'), sessionsController.deleteSession.bind(sessionsController));

export default router;
