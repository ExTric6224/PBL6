import { z } from 'zod';

export const createScheduleSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  startAt: z.string().datetime('Invalid start date format'),
  endAt: z.string().datetime('Invalid end date format'),
  capacity: z.number().int().min(1).default(1),
}).refine((data) => {
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  return end > start;
}, {
  message: 'End time must be after start time',
});

export const updateScheduleSchema = z.object({
  topic: z.string().min(1).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  capacity: z.number().int().min(1).optional(),
  status: z.enum(['AVAILABLE', 'CANCELLED']).optional(),
}).refine((data) => {
  if (data.startAt && data.endAt) {
    const start = new Date(data.startAt);
    const end = new Date(data.endAt);
    return end > start;
  }
  return true;
}, {
  message: 'End time must be after start time',
});

export const scheduleQuerySchema = z.object({
  status: z.enum(['AVAILABLE', 'CANCELLED']).optional(),
  mentorId: z.string().transform((val) => parseInt(val, 10)).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleDto = z.infer<typeof updateScheduleSchema>;
export type ScheduleQueryDto = z.infer<typeof scheduleQuerySchema>;
