import { z } from 'zod';

// Transform string to array for FormData
const stringOrArrayTransform = z.union([
  z.array(z.string()),
  z.string().transform((str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  })
]).default([]);

// Transform string to number for FormData
const stringOrNumberTransform = z.union([
  z.number(),
  z.string().transform((val) => parseInt(val, 10))
]).optional();

export const createMentorProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  avatar: z.string().optional(),
  school: z.string().optional(),
  expertise: stringOrArrayTransform,
  degree: z.string().optional(),
  yearsExp: stringOrNumberTransform,
  bio: z.string().optional(),
});

export const updateMentorProfileSchema = createMentorProfileSchema.partial();

export const createMenteeProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  avatar: z.string().optional(),
  goals: z.string().optional(),
  interests: stringOrArrayTransform,
});

export const updateMenteeProfileSchema = createMenteeProfileSchema.partial();

export type CreateMentorProfileDto = z.infer<typeof createMentorProfileSchema>;
export type UpdateMentorProfileDto = z.infer<typeof updateMentorProfileSchema>;
export type CreateMenteeProfileDto = z.infer<typeof createMenteeProfileSchema>;
export type UpdateMenteeProfileDto = z.infer<typeof updateMenteeProfileSchema>;
