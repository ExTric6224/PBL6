import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const notificationsController = new NotificationsController();

// All routes require authentication
router.get('/', authenticate, notificationsController.getNotifications.bind(notificationsController));
router.patch('/:id/read', authenticate, notificationsController.markAsRead.bind(notificationsController));
router.patch('/read-all', authenticate, notificationsController.markAllAsRead.bind(notificationsController));

export default router;
