import { z } from 'zod';

export const createFeedbackSchema = z.object({
  sessionId: z.number().int().min(1, 'Valid session ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().optional(),
});

export const feedbackQuerySchema = z.object({
  ratingMin: z.string().transform((val) => parseInt(val, 10)).optional(),
  ratingMax: z.string().transform((val) => parseInt(val, 10)).optional(),
});

export type CreateFeedbackDto = z.infer<typeof createFeedbackSchema>;
export type FeedbackQueryDto = z.infer<typeof feedbackQuerySchema>;
