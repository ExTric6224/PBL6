import { Response } from 'express';
import 'express-async-errors';
import { NotificationsService } from '../services/notifications.service';
import { success, notFoundError } from '../utils/responses';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const notificationsService = new NotificationsService();

export class NotificationsController {
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const isRead = req.query?.isRead === 'true' ? true : req.query?.isRead === 'false' ? false : undefined;
      const notifications = await notificationsService.getNotifications(req.user!.sub, isRead);
      return success(res, notifications);
    } catch (error: any) {
      throw error;
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const notification = await notificationsService.markAsRead(notificationId, req.user!.sub);
      return success(res, notification);
    } catch (error: any) {
      if (error.message === 'Notification not found or access denied') {
        return notFoundError(res, 'Notification not found or you do not have permission');
      }
      throw error;
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await notificationsService.markAllAsRead(req.user!.sub);
      return success(res, result);
    } catch (error: any) {
      throw error;
    }
  }

  async createNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, type, title, content } = req.body;
      const notification = await notificationsService.createNotification(userId, type, title, content);
      return success(res, notification, 201);
    } catch (error: any) {
      throw error;
    }
  }

  async broadcastNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const { userIds, type, title, content } = req.body;
      const notifications = await notificationsService.broadcastNotification(userIds, type, title, content);
      return success(res, notifications, 201);
    } catch (error: any) {
      throw error;
    }
  }
}
