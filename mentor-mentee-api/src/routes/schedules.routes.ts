import { Router } from 'express';
import { SchedulesController } from '../controllers/schedules.controller';
import { validate, validateQuery } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { createScheduleSchema, updateScheduleSchema, scheduleQuerySchema } from '../schemas/schedules.schema';

const router = Router();
const schedulesController = new SchedulesController();

// All routes require authentication
router.post('/', authenticate, validate(createScheduleSchema), schedulesController.createSchedule.bind(schedulesController));
router.get('/', authenticate, validateQuery(scheduleQuerySchema), schedulesController.getSchedules.bind(schedulesController));
router.get('/my-schedules', authenticate, validateQuery(scheduleQuerySchema), schedulesController.getMentorSchedules.bind(schedulesController));
router.get('/:id', authenticate, schedulesController.getScheduleById.bind(schedulesController));
router.patch('/:id', authenticate, validate(updateScheduleSchema), schedulesController.updateSchedule.bind(schedulesController));
router.delete('/:id', authenticate, schedulesController.deleteSchedule.bind(schedulesController));

export default router;
