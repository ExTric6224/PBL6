import { Response } from 'express';
import 'express-async-errors';
import { SchedulesService } from '../services/schedules.service';
import { success, authError, notFoundError, validationError, conflictError } from '../utils/responses';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const schedulesService = new SchedulesService();

export class SchedulesController {
  async createSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('[CREATE SCHEDULE] Request from user:', req.user!.sub, 'Body:', req.body);
      
      if (req.user!.role !== 'MENTOR') {
        return authError(res, 'Only mentors can create schedules');
      }

      const schedule = await schedulesService.createSchedule(req.user!.sub, req.body);
      console.log('[CREATE SCHEDULE] Success, schedule ID:', schedule.id);
      return success(res, schedule, 201);
    } catch (error: any) {
      console.error('[CREATE SCHEDULE] Error:', error.message);
      
      // Handle validation errors
      if (error.message === 'Mentor profile not found') {
        return notFoundError(res, 'Không tìm thấy hồ sơ mentor. Vui lòng tạo hồ sơ trước.');
      }
      if (error.message === 'Schedule start time must be in the future') {
        return validationError(res, error.message);
      }
      if (error.message === 'Schedule end time must be after start time') {
        return validationError(res, error.message);
      }
      if (error.message === 'Schedule duration must be at least 30 minutes') {
        return validationError(res, error.message);
      }
      if (error.message === 'Schedule duration cannot exceed 8 hours') {
        return validationError(res, error.message);
      }
      if (error.message === 'Schedule overlaps with existing schedule(s)') {
        return validationError(res, error.message);
      }
      
      throw error;
    }
  }

  async getSchedules(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await schedulesService.getSchedules(req.query as any);
      return res.status(200).json(result);
    } catch (error: any) {
      throw error;
    }
  }

  async updateSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const scheduleId = parseInt(req.params.id, 10);
      let schedule;

      // Admin can update any schedule
      if (req.user!.role === 'ADMIN') {
        schedule = await schedulesService.adminUpdateSchedule(scheduleId, req.body);
      } else if (req.user!.role === 'MENTOR') {
        schedule = await schedulesService.updateSchedule(scheduleId, req.user!.sub, req.body);
      } else {
        return authError(res, 'Only mentors and admins can update schedules');
      }

      return success(res, schedule);
    } catch (error: any) {
      if (error.message === 'Schedule not found or access denied' || error.message === 'Schedule not found') {
        return notFoundError(res, 'Không tìm thấy lịch học hoặc bạn không có quyền cập nhật');
      }
      if (error.message === 'Mentor profile not found') {
        return notFoundError(res, 'Mentor profile not found');
      }
      if (error.message.includes('Cannot edit') || 
          error.message.includes('Cannot manually set') ||
          error.message.includes('overlaps') ||
          error.message.includes('must be')) {
        return conflictError(res, error.message);
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
        return success(res, { message: 'Đã xóa lịch học thành công' });
      }
      
      // Mentors can only soft delete (cancel) their own schedules
      if (req.user!.role !== 'MENTOR') {
        return authError(res, 'Only mentors and admins can delete schedules');
      }

      const schedule = await schedulesService.deleteSchedule(scheduleId, req.user!.sub);
      return success(res, schedule);
    } catch (error: any) {
      if (error.message === 'Schedule not found or access denied' || error.message === 'Schedule not found') {
        return notFoundError(res, 'Không tìm thấy lịch học hoặc bạn không có quyền xóa');
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

      const result = await schedulesService.getMentorSchedules(req.user!.sub, req.query as any);
      return res.status(200).json(result);
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
        return notFoundError(res, 'Không tìm thấy lịch học');
      }
      throw error;
    }
  }
}
