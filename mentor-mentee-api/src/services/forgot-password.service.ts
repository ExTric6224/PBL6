import { hashPassword } from '../utils/password';
import prisma from '../db/client';
import { sendPasswordResetEmail } from '../utils/mailer';
import bcrypt from 'bcrypt';

const CODE_TTL_MINUTES = 10;
const RESEND_INTERVAL_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const SALT_ROUNDS = 10;

function generateCode(): string {
  // 6 digits, leading zeros allowed
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class ForgotPasswordService {
  async requestResetCode(params: { email: string }) {
    const { email } = params;

    // 1) Kiểm tra email có tồn tại không
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Để tránh leak thông tin, vẫn trả về success nhưng không gửi email
      console.log(`[SECURITY] Password reset requested for non-existent email: ${email}`);
      return { email, ttlMinutes: CODE_TTL_MINUTES };
    }

    // 2) Throttle resend
    const existing = await prisma.passwordReset.findUnique({ where: { email } });
    const now = new Date();

    if (existing && !existing.isUsed) {
      const diffSec = (now.getTime() - new Date(existing.lastSentAt).getTime()) / 1000;
      if (diffSec < RESEND_INTERVAL_SECONDS) {
        throw new Error('Too many requests');
      }
    }

    // 3) Tạo mã & hash
    const code = generateCode();
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);

    // 4) Upsert bản ghi
    await prisma.passwordReset.upsert({
      where: { email },
      update: {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        isUsed: false,
        updatedAt: now,
      },
      create: {
        email,
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        isUsed: false,
        updatedAt: now,
      },
    });

    // 5) Gửi email
    console.log(`🔐 [DEBUG] Generated password reset OTP for ${email}: ${code}`);
    
    try {
      console.log(`📧 [DEBUG] Attempting to send password reset email to: ${email}`);
      await sendPasswordResetEmail(email, code);
      console.log(`✅ [DEBUG] Password reset email sent successfully to: ${email}`);
    } catch (error) {
      console.error('❌ [ERROR] Failed to send password reset email:', error);
      console.log(`🔐 [FALLBACK] Password reset code for ${email}: ${code}`);
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to send password reset email');
      }
    }

    return { email, ttlMinutes: CODE_TTL_MINUTES };
  }

  async verifyResetCode(params: { email: string; code: string }) {
    const { email, code } = params;

    const rec = await prisma.passwordReset.findUnique({ where: { email } });
    if (!rec) throw new Error('Reset request not found');

    if (rec.isUsed) throw new Error('Code already used');

    // Hết hạn?
    if (new Date() > new Date(rec.expiresAt)) {
      await prisma.passwordReset.update({
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
      await prisma.passwordReset.update({
        where: { email },
        data: { attempts: { increment: 1 }, updatedAt: new Date() },
      });
      throw new Error('Invalid code');
    }

    // Mã đúng
    return { email, valid: true };
  }

  async resetPassword(params: { email: string; code: string; newPassword: string }) {
    const { email, code, newPassword } = params;

    // Verify code first
    await this.verifyResetCode({ email, code });

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password và đánh dấu code đã sử dụng
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email },
        data: { password: passwordHash, updatedAt: new Date() },
      });
      
      await tx.passwordReset.update({
        where: { email },
        data: { isUsed: true, updatedAt: new Date() },
      });
    });

    console.log(`✅ Password reset successful for: ${email}`);
    
    return { email, message: 'Password reset successful' };
  }

  async resendResetCode(params: { email: string }) {
    const { email } = params;
    
    const rec = await prisma.passwordReset.findUnique({ where: { email } });
    if (!rec) throw new Error('Reset request not found');

    if (rec.isUsed) throw new Error('Code already used');

    const now = new Date();
    const diffSec = (now.getTime() - new Date(rec.lastSentAt).getTime()) / 1000;
    if (diffSec < RESEND_INTERVAL_SECONDS) {
      throw new Error('Too many requests');
    }

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);

    await prisma.passwordReset.update({
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
      await sendPasswordResetEmail(email, code);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 Resend password reset code for ${email}: ${code}`);
      }
    }

    return { email, ttlMinutes: CODE_TTL_MINUTES };
  }
}
