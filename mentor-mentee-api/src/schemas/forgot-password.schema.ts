import { z } from 'zod';

export const requestResetCodeSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const resendResetCodeSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type RequestResetCodeDto = z.infer<typeof requestResetCodeSchema>;
export type VerifyResetCodeDto = z.infer<typeof verifyResetCodeSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type ResendResetCodeDto = z.infer<typeof resendResetCodeSchema>;
