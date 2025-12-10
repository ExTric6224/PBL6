import { z } from 'zod';

export const createBookingSchema = z.object({
  scheduleId: z.number().int().min(1, 'Valid schedule ID is required'),
  notes: z.string().optional(),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
