import * as cron from 'node-cron';
import { SessionsService } from './sessions.service';
import { NotificationsService } from './notifications.service';
import prisma from '../db/client';

export class SessionSchedulerService {
  private sessionsService: SessionsService;
  private notificationsService: NotificationsService;
  private startTask: cron.ScheduledTask | null = null;
  private endTask: cron.ScheduledTask | null = null;
  private reminderTask: cron.ScheduledTask | null = null;

  constructor() {
    this.sessionsService = new SessionsService();
    this.notificationsService = new NotificationsService();
  }

  // Chạy mỗi phút để check sessions cần start
  startAutoStartScheduler() {
    if (this.startTask) {
      console.log('Auto-start scheduler is already running');
      return;
    }

    // Chạy mỗi phút
    this.startTask = cron.schedule('* * * * *', async () => {
      try {
        // console.log('Checking for sessions to auto-start...');
        const startedSessions = await this.sessionsService.autoStartSessions();
        if (startedSessions.length > 0) {
          console.log(`Auto-started ${startedSessions.length} session(s)`);
        }
      } catch (error) {
        console.error('Error in auto-start scheduler:', error);
      }
    });

    console.log('Session auto-start scheduler started (runs every minute)');
  }

  // Chạy mỗi phút để check sessions cần end
  startAutoEndScheduler() {
    if (this.endTask) {
      console.log('Auto-end scheduler is already running');
      return;
    }

    // Chạy mỗi phút
    this.endTask = cron.schedule('* * * * *', async () => {
      try {
        // console.log('Checking for sessions to auto-end...');
        const endedSessions = await this.sessionsService.autoEndSessions();
        if (endedSessions.length > 0) {
          console.log(`Auto-ended ${endedSessions.length} session(s)`);
        }
      } catch (error) {
        console.error('Error in auto-end scheduler:', error);
      }
    });

    console.log('Session auto-end scheduler started (runs every minute)');
  }

  // Chạy mỗi 5 phút để gửi reminder cho sessions sắp bắt đầu
  startReminderScheduler() {
    if (this.reminderTask) {
      console.log('Reminder scheduler is already running');
      return;
    }

    // Chạy mỗi 5 phút
    this.reminderTask = cron.schedule('*/5 * * * *', async () => {
      try {
        // console.log('Checking for sessions to send reminders...');
        await this.sendSessionReminders();
      } catch (error) {
        console.error('Error in reminder scheduler:', error);
      }
    });

    console.log('Session reminder scheduler started (runs every 5 minutes)');
  }

  // Start tất cả schedulers
  startAllSchedulers() {
    this.startAutoStartScheduler();
    this.startAutoEndScheduler();
    this.startReminderScheduler();
  }

  // Gửi reminder cho sessions sẽ bắt đầu trong 30 phút
  private async sendSessionReminders() {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // Tìm bookings đã được confirm và schedule sẽ bắt đầu trong 30 phút tới
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        schedule: {
          startAt: {
            gte: now,
            lte: thirtyMinutesFromNow,
          },
        },
      },
      include: {
        user: { // mentee
          select: {
            id: true,
            email: true,
          },
        },
        schedule: {
          include: {
            user: { // mentor
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    for (const booking of upcomingBookings) {
      try {
        const menteeId = booking.user.id;
        const mentorId = booking.schedule.user.id;
        const sessionTime = new Date(booking.schedule.startAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        // Check if reminder already sent by looking for existing session_reminder notifications
        const existingReminders = await prisma.notification.findMany({
          where: {
            userId: { in: [menteeId, mentorId] },
            type: 'session_reminder',
            content: {
              contains: `30 phút nữa bạn có cuộc họp vào lúc ${sessionTime}`,
            },
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Check last 24 hours
            },
          },
        });

        // If reminders already exist for both users, skip
        const menteeReminderExists = existingReminders.some(n => n.userId === menteeId);
        const mentorReminderExists = existingReminders.some(n => n.userId === mentorId);

        if (menteeReminderExists && mentorReminderExists) {
          continue;
        }

        // Gửi reminder cho mentee nếu chưa gửi
        if (!menteeReminderExists) {
          await this.notificationsService.createNotification(
            menteeId,
            'session_reminder',
            'Phiên họp sắp bắt đầu',
            `30 phút nữa bạn có cuộc họp vào lúc ${sessionTime}.`
          );
        }

        // Gửi reminder cho mentor nếu chưa gửi
        if (!mentorReminderExists) {
          await this.notificationsService.createNotification(
            mentorId,
            'session_reminder',
            'Phiên họp sắp bắt đầu',
            `30 phút nữa bạn có cuộc họp vào lúc ${sessionTime}.`
          );
        }

        console.log(`Sent reminders for booking ${booking.id} starting at ${sessionTime}`);
      } catch (error) {
        console.error(`Error sending reminder for booking ${booking.id}:`, error);
      }
    }
  }

  // Stop tất cả schedulers
  stopAllSchedulers() {
    if (this.startTask) {
      this.startTask.stop();
      this.startTask = null;
      console.log('Auto-start scheduler stopped');
    }

    if (this.endTask) {
      this.endTask.stop();
      this.endTask = null;
      console.log('Auto-end scheduler stopped');
    }

    if (this.reminderTask) {
      this.reminderTask.stop();
      this.reminderTask = null;
      console.log('Reminder scheduler stopped');
    }
  }
}

// Export singleton instance
export const sessionScheduler = new SessionSchedulerService();
