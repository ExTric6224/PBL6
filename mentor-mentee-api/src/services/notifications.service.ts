import prisma from '../db/client';

export class NotificationsService {
  async getNotifications(userId: number, isRead?: boolean) {
    const where: any = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    return await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAsRead(notificationId: number, userId: number) {
    // Check if notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async createNotification(userId: number, type: string, title: string, content: string) {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
      },
    });
  }

  async markAllAsRead(userId: number) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async getUnreadCount(userId: number) {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async broadcastNotification(userIds: number[], type: string, title: string, content: string) {
    // Create notifications for multiple users
    const notifications = await Promise.all(
      userIds.map(userId => 
        prisma.notification.create({
          data: {
            userId,
            type,
            title,
            content,
          },
        })
      )
    );
    return notifications;
  }
}
