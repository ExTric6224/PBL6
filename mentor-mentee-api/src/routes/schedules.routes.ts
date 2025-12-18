import { Router, Request } from 'express';
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
router.patch('/:id', authenticate, authorizePermissions('schedule:update_any', 'schedule:update_own'), validate(updateScheduleSchema), schedulesController.updateSchedule.bind(schedulesController));
router.delete('/:id', authenticate, authorizePermissions('schedule:delete_any', 'schedule:delete_own'), schedulesController.deleteSchedule.bind(schedulesController));

export default router;
