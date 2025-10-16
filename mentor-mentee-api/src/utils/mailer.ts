// src/utils/mailer.ts
import 'dotenv/config';
import nodemailer from 'nodemailer';

const PORT = Number(process.env.SMTP_PORT || 587);
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: PORT,
  secure: PORT === 465, // 465=SSL, 587=STARTTLS
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
  logger: true, // log chi tiết để debug
  debug: true,
});

export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log('✅ SMTP transporter verified successfully');
  } catch (error) {
    console.error('❌ SMTP transporter verification failed:', error);
    throw error;
  }
}

/**
 * Gửi OTP xác thực email đăng ký.
 * Ở DEV: nếu DEV_MODE_LOG_OTP=true thì chỉ log code, không gửi mail thật.
 */
export async function sendVerificationEmail(to: string, code: string) {
  const appName = process.env.APP_NAME || 'MentorMentee';
  const from = process.env.MAIL_FROM || `${appName} <no-reply@example.com>`;

  // Dev mode: chỉ log OTP, không gửi email
  if (process.env.NODE_ENV === 'development' || process.env.DEV_MODE_LOG_OTP === 'true') {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL VERIFICATION CODE (DEVELOPMENT MODE)');
    console.log('='.repeat(60));
    console.log(`📨 To: ${to}`);
    console.log(`🔐 Code: ${code}`);
    console.log(`⏰ Expires: 10 minutes from now`);
    console.log('='.repeat(60) + '\n');
    return;
  }

  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;text-align:center;">
        <h1 style="color:white;margin:0;">${appName}</h1>
      </div>
      <div style="padding:30px;background:#f8f9fa;border-left:4px solid #667eea;">
        <h2 style="color:#333;margin-top:0;">Xác thực email đăng ký</h2>
        <p style="color:#666;font-size:16px;">Mã xác thực của bạn là:</p>
        <div style="background:white;padding:20px;margin:20px 0;text-align:center;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1);">
          <div style="font-size:32px;font-weight:700;letter-spacing:6px;color:#667eea;font-family:monospace;">${code}</div>
        </div>
        <p style="color:#666;font-size:14px;"><strong>Mã có hiệu lực trong 10 phút.</strong></p>
        <div style="margin-top:20px;padding:15px;background:#e7f3ff;border-radius:5px;border-left:4px solid #2196f3;">
          <p style="margin:0;color:#1976d2;font-size:14px;">
            <strong>💡 Lưu ý bảo mật:</strong><br>
            • Không chia sẻ mã này với bất kỳ ai.<br>
            • ${appName} sẽ không bao giờ yêu cầu mã qua điện thoại.<br>
            • Nếu bạn nghi ngờ email giả mạo, hãy liên hệ support.
          </p>
        </div>
      </div>
      <div style="padding:20px;text-align:center;color:#999;font-size:12px;">
        © ${new Date().getFullYear()} ${appName}. All rights reserved.<br>
        <a href="mailto:support@mentormentee.com" style="color:#667eea;">support@mentormentee.com</a>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `${appName} - Mã xác thực email`,
      html,
    });
    console.log(`📧 Verification email sent to: ${to}`);
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error;
  }
}

/**
 * Gửi OTP đặt lại mật khẩu.
 * Ở DEV: nếu DEV_MODE_LOG_OTP=true thì chỉ log code, không gửi mail thật.
 */
export async function sendPasswordResetEmail(to: string, code: string) {
  const appName = process.env.APP_NAME || 'MentorMentee';
  const from = process.env.MAIL_FROM || `${appName} <no-reply@example.com>`;

  if (process.env.NODE_ENV === 'development' || process.env.DEV_MODE_LOG_OTP === 'true') {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 PASSWORD RESET CODE (DEVELOPMENT MODE)');
    console.log('='.repeat(60));
    console.log(`📨 To: ${to}`);
    console.log(`🔐 Code: ${code}`);
    console.log(`⏰ Expires: 10 minutes from now`);
    console.log('📝 Use this code to reset your password');
    console.log('='.repeat(60) + '\n');
    return;
  }

  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial;max-width:600px;margin:0 auto;">
      <h2>Đặt lại mật khẩu</h2>
      <p>Mã đặt lại mật khẩu của bạn là:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;font-family:monospace;">${code}</div>
      <p>Mã có hiệu lực trong 10 phút.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `${appName} - Mã đặt lại mật khẩu`,
      html,
    });
    console.log(`📧 Password reset email sent to: ${to}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw error;
  }
}
