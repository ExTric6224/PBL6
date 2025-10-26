import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';

const router = Router();
const notificationsController = new NotificationsController();

// All routes require authentication
router.get('/', authenticate, authorizePermissions('notification:view_own'), notificationsController.getNotifications.bind(notificationsController));
router.patch('/:id/read', authenticate, authorizePermissions('notification:update_own'), notificationsController.markAsRead.bind(notificationsController));
router.patch('/read-all', authenticate, authorizePermissions('notification:update_own'), notificationsController.markAllAsRead.bind(notificationsController));

export default router;
