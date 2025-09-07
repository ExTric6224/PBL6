import { z } from 'zod';

export const createMentorProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  school: z.string().optional(),
  expertise: z.array(z.string()).default([]),
  degree: z.string().optional(),
  yearsExp: z.number().int().min(0).optional(),
  bio: z.string().optional(),
});

export const updateMentorProfileSchema = createMentorProfileSchema.partial();

export const createMenteeProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  goals: z.string().optional(),
  interests: z.array(z.string()).default([]),
});

export const updateMenteeProfileSchema = createMenteeProfileSchema.partial();

export type CreateMentorProfileDto = z.infer<typeof createMentorProfileSchema>;
export type UpdateMentorProfileDto = z.infer<typeof updateMentorProfileSchema>;
export type CreateMenteeProfileDto = z.infer<typeof createMenteeProfileSchema>;
export type UpdateMenteeProfileDto = z.infer<typeof updateMenteeProfileSchema>;
