import { z } from 'zod';

export const requestRegisterCodeSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['MENTOR', 'MENTEE'], {
    errorMap: () => ({ message: 'Role must be either MENTOR or MENTEE' }),
  }),
});

export const verifyRegisterCodeSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const resendRegisterCodeSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type RequestRegisterCodeDto = z.infer<typeof requestRegisterCodeSchema>;
export type VerifyRegisterCodeDto = z.infer<typeof verifyRegisterCodeSchema>;
export type ResendRegisterCodeDto = z.infer<typeof resendRegisterCodeSchema>;