import { Response } from 'express';
import 'express-async-errors';
import { SchedulesService } from '../services/schedules.service';
import { success, authError, notFoundError, validationError } from '../utils/responses';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const schedulesService = new SchedulesService();

export class SchedulesController {
  async createSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'MENTOR') {
        return authError(res, 'Only mentors can create schedules');
      }

      const schedule = await schedulesService.createSchedule(req.user!.sub, req.body);
      return success(res, schedule, 201);
    } catch (error: any) {
      if (error.message === 'Mentor profile not found') {
        return notFoundError(res, 'Mentor profile not found. Please create your profile first.');
      }
      throw error;
    }
  }

  async getSchedules(req: AuthenticatedRequest, res: Response) {
    try {
      const schedules = await schedulesService.getSchedules(req.query as any);
      return success(res, schedules);
    } catch (error: any) {
      throw error;
    }
  }

  async updateSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'MENTOR') {
        return authError(res, 'Only mentors can update schedules');
      }

      const scheduleId = parseInt(req.params.id, 10);
      const schedule = await schedulesService.updateSchedule(scheduleId, req.user!.sub, req.body);
      return success(res, schedule);
    } catch (error: any) {
      if (error.message === 'Schedule not found or access denied') {
        return notFoundError(res, 'Schedule not found or you do not have permission to update it');
      }
      if (error.message === 'Mentor profile not found') {
        return notFoundError(res, 'Mentor profile not found');
      }
      throw error;
    }
  }

  async deleteSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const scheduleId = parseInt(req.params.id, 10);
      
      // Admin can hard delete any schedule
      if (req.user!.role === 'ADMIN') {
        await schedulesService.hardDeleteSchedule(scheduleId);
        return success(res, { message: 'Schedule deleted successfully' });
      }
      
      // Mentors can only soft delete (cancel) their own schedules
      if (req.user!.role !== 'MENTOR') {
        return authError(res, 'Only mentors and admins can delete schedules');
      }

      const schedule = await schedulesService.deleteSchedule(scheduleId, req.user!.sub);
      return success(res, schedule);
    } catch (error: any) {
      if (error.message === 'Schedule not found or access denied' || error.message === 'Schedule not found') {
        return notFoundError(res, 'Schedule not found or you do not have permission to delete it');
      }
      if (error.message === 'Mentor profile not found') {
        return notFoundError(res, 'Mentor profile not found');
      }
      throw error;
    }
  }

  async getMentorSchedules(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'MENTOR') {
        return authError(res, 'Only mentors can access their schedules');
      }

      const schedules = await schedulesService.getMentorSchedules(req.user!.sub, req.query as any);
      return success(res, schedules);
    } catch (error: any) {
      if (error.message === 'Mentor profile not found') {
        return notFoundError(res, 'Mentor profile not found');
      }
      throw error;
    }
  }

  async getScheduleById(req: AuthenticatedRequest, res: Response) {
    try {
      const scheduleId = parseInt(req.params.id, 10);
      const schedule = await schedulesService.getScheduleById(scheduleId);
      return success(res, schedule);
    } catch (error: any) {
      if (error.message === 'Schedule not found') {
        return notFoundError(res, 'Schedule not found');
      }
      throw error;
    }
  }
}
