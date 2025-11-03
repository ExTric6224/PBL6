import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
});

export const broadcastNotificationSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1, 'At least one user ID is required'),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
export type BroadcastNotificationDto = z.infer<typeof broadcastNotificationSchema>;
