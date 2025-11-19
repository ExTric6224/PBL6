import { z } from 'zod';

// Transform string to array of numbers for topic IDs from FormData
const topicIdsTransform = z.union([
  z.array(z.number()),
  z.array(z.string()).transform((arr) => arr.map(id => parseInt(id, 10))),
  z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
      }
      return [];
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
  phoneNumber: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Phone number can only contain digits, spaces, +, -, and parentheses')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .optional()
    .or(z.literal('')),
  school: z.string().optional(),
  expertise: topicIdsTransform,
  degree: z.string().optional(),
  yearsExp: stringOrNumberTransform,
  bio: z.string().optional(),
});

export const updateMentorProfileSchema = createMentorProfileSchema.partial();

export const createMenteeProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  avatar: z.string().optional(),
  phoneNumber: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Phone number can only contain digits, spaces, +, -, and parentheses')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .optional()
    .or(z.literal('')),
  goals: z.string().optional(),
  interests: topicIdsTransform,
});

export const updateMenteeProfileSchema = createMenteeProfileSchema.partial();

export type CreateMentorProfileDto = z.infer<typeof createMentorProfileSchema>;
export type UpdateMentorProfileDto = z.infer<typeof updateMentorProfileSchema>;
export type CreateMenteeProfileDto = z.infer<typeof createMenteeProfileSchema>;
export type UpdateMenteeProfileDto = z.infer<typeof updateMenteeProfileSchema>;
