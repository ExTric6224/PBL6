import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { DebugController } from '../controllers/debug.controller';

const router = Router();
const debugController = new DebugController();

// Debug routes - only available in development
if (process.env.NODE_ENV !== 'production') {
  // Get current user's effective permissions
  router.get('/me/permissions', authenticate, debugController.getMyPermissions.bind(debugController));
}

export default router;
