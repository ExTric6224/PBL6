import { hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import prisma from '../db/client';
import { sendVerificationEmail } from '../utils/mailer';
import bcrypt from 'bcrypt';

const CODE_TTL_MINUTES = 10;
const RESEND_INTERVAL_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const SALT_ROUNDS = 10;

function generateCode(): string {
  // 6 digits, leading zeros allowed
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class RegistrationOtpService {
  async requestCode(params: { email: string; password: string; role: 'MENTOR' | 'MENTEE' }) {
    const { email, password, role } = params;

    // 1) Nếu email đã là user thực sự -> báo trùng
    const existedUser = await prisma.user.findUnique({ where: { email } });
    if (existedUser) {
      throw new Error('User already exists');
    }

    // 2) Throttle resend
    const existing = await prisma.emailVerification.findUnique({ where: { email } });
    const now = new Date();

    if (existing) {
      const diffSec = (now.getTime() - new Date(existing.lastSentAt).getTime()) / 1000;
      if (diffSec < RESEND_INTERVAL_SECONDS) {
        throw new Error('Too many requests'); // 429 hợp lý ở controller
      }
    }

    // 3) Tạo mã & hash
    const code = generateCode();
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const passwordHash = await hashPassword(password);
    const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);

    // 4) Upsert bản ghi
    await prisma.emailVerification.upsert({
      where: { email },
      update: {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        role,
        passwordHash,
        updatedAt: now,
      },
      create: {
        email,
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        role,
        passwordHash,
        updatedAt: now,
      },
    });

    // 5) Gửi email
    console.log(`🔐 [DEBUG] Generated OTP for ${email}: ${code}`);
    
    try {
      console.log(`📧 [DEBUG] Attempting to send email to: ${email}`);
      await sendVerificationEmail(email, code);
      console.log(`✅ [DEBUG] Email sent successfully to: ${email}`);
    } catch (error) {
      console.error('❌ [ERROR] Failed to send verification email:', error);
      // For development, always log the code  
      console.log(`🔐 [FALLBACK] Verification code for ${email}: ${code}`);
      
      // Don't throw error in development, allow the flow to continue
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to send verification email');
      }
    }

    return { email, ttlMinutes: CODE_TTL_MINUTES };
  }

  async verifyCode(params: { email: string; code: string }) {
    const { email, code } = params;

    const rec = await prisma.emailVerification.findUnique({ where: { email } });
    if (!rec) throw new Error('Verification not found');

    // Hết hạn?
    if (new Date() > new Date(rec.expiresAt)) {
      // dọn dẹp nhẹ: tăng attempts để chặn brute
      await prisma.emailVerification.update({
        where: { email },
        data: { attempts: { increment: 1 }, updatedAt: new Date() },
      });
      throw new Error('Code expired');
    }

    // Quá số lần thử?
    if (rec.attempts >= MAX_ATTEMPTS) {
      throw new Error('Too many attempts');
    }

    // So sánh mã
    const ok = await bcrypt.compare(code, rec.codeHash);
    if (!ok) {
      await prisma.emailVerification.update({
        where: { email },
        data: { attempts: { increment: 1 }, updatedAt: new Date() },
      });
      throw new Error('Invalid code');
    }

    // Mã đúng → tạo user, xong xóa bản ghi xác thực
    const createdUser = await prisma.$transaction(async (tx) => {
      // Look up the Role record by name to get roleId
      const roleRecord = await tx.role.findUnique({
        where: { name: rec.role },
      });

      const user = await tx.user.create({
        data: {
          email,
          password: rec.passwordHash,
          role: rec.role,
          roleId: roleRecord?.id, // Set roleId from RBAC Role table
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          role: true,
          roleId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      await tx.emailVerification.delete({ where: { email } });
      return user;
    });

    // Generate JWT token
    const token = signToken({
      sub: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    });

    return { user: createdUser, token };
  }

  async resendCode(params: { email: string }) {
    const { email } = params;
    const rec = await prisma.emailVerification.findUnique({ where: { email } });
    if (!rec) throw new Error('Verification not found');

    const now = new Date();
    const diffSec = (now.getTime() - new Date(rec.lastSentAt).getTime()) / 1000;
    if (diffSec < RESEND_INTERVAL_SECONDS) {
      throw new Error('Too many requests');
    }

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);

    await prisma.emailVerification.update({
      where: { email },
      data: {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        updatedAt: now,
      },
    });

    try {
      await sendVerificationEmail(email, code);
    } catch (error) {
      console.error('Failed to send email:', error);
      // For development, log the code instead of sending email
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 Resend verification code for ${email}: ${code}`);
      }
    }

    return { email, ttlMinutes: CODE_TTL_MINUTES };
  }
}