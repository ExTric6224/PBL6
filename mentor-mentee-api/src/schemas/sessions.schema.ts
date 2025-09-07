import { z } from 'zod';

export const startSessionSchema = z.object({
  bookingId: z.number().int().min(1, 'Valid booking ID is required'),
});

export const endSessionSchema = z.object({
  sessionId: z.number().int().min(1, 'Valid session ID is required'),
  notes: z.string().optional(),
});

export type StartSessionDto = z.infer<typeof startSessionSchema>;
export type EndSessionDto = z.infer<typeof endSessionSchema>;
