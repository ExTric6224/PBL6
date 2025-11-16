import * as cron from 'node-cron';
import { SessionsService } from './sessions.service';

export class SessionSchedulerService {
  private sessionsService: SessionsService;
  private startTask: cron.ScheduledTask | null = null;
  private endTask: cron.ScheduledTask | null = null;

  constructor() {
    this.sessionsService = new SessionsService();
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
        console.log('Checking for sessions to auto-start...');
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
        console.log('Checking for sessions to auto-end...');
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

  // Start tất cả schedulers
  startAllSchedulers() {
    this.startAutoStartScheduler();
    this.startAutoEndScheduler();
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
  }
}

// Export singleton instance
export const sessionScheduler = new SessionSchedulerService();
