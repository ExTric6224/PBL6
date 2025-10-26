import { Router } from 'express';
import { SchedulesController } from '../controllers/schedules.controller';
import { validate, validateQuery } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';
import { createScheduleSchema, updateScheduleSchema, scheduleQuerySchema } from '../schemas/schedules.schema';
import prisma from '../db/client';

const router = Router();
const schedulesController = new SchedulesController();

// All routes require authentication
router.post('/', authenticate, authorizePermissions('schedule:create'), validate(createScheduleSchema), schedulesController.createSchedule.bind(schedulesController));
router.get('/', authenticate, authorizePermissions('schedule:view_any'), validateQuery(scheduleQuerySchema), schedulesController.getSchedules.bind(schedulesController));
router.get('/my-schedules', authenticate, authorizePermissions('schedule:view_own'), validateQuery(scheduleQuerySchema), schedulesController.getMentorSchedules.bind(schedulesController));
router.get('/:id', authenticate, authorizePermissions('schedule:view_any'), schedulesController.getScheduleById.bind(schedulesController));
router.patch('/:id', authenticate, authorizePermissions('schedule:update', {
  scope: 'own',
  getResourceOwnerId: async (req) => {
    const schedule = await prisma.schedule.findUnique({ where: { id: Number(req.params.id) } });
    return schedule?.mentorId ?? null;
  }
}), validate(updateScheduleSchema), schedulesController.updateSchedule.bind(schedulesController));
router.delete('/:id', authenticate, authorizePermissions('schedule:delete', {
  scope: 'own',
  getResourceOwnerId: async (req) => {
    const schedule = await prisma.schedule.findUnique({ where: { id: Number(req.params.id) } });
    return schedule?.mentorId ?? null;
  }
}), schedulesController.deleteSchedule.bind(schedulesController));

export default router;
