import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const TEST_EMAIL = 'test@example.com'; // Thay bằng email có trong database
const TEST_PASSWORD = 'newpassword123';

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

// Màu sắc cho console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testForgotPasswordFlow() {
  let resetCode = '';

  try {
    log('\n🧪 ===== BẮT ĐẦU TEST CHỨC NĂNG QUÊN MẬT KHẨU =====\n', colors.blue);

    // ========== BƯỚC 1: Request Reset Code ==========
    log('📧 BƯỚC 1: Gửi yêu cầu reset mật khẩu...', colors.yellow);
    try {
      const response = await axios.post<ApiResponse>(
        `${API_URL}/auth/forgot-password/request-code`,
        { email: TEST_EMAIL }
      );

      if (response.data.success) {
        log('✅ Yêu cầu thành công!', colors.green);
        log(`   TTL: ${response.data.data?.ttlMinutes} phút`, colors.green);
        log('   📬 Kiểm tra console server để lấy mã OTP', colors.yellow);
        log('\n   ⏳ Vui lòng nhập mã OTP từ console...', colors.yellow);
        
        // Đợi người dùng nhập mã OTP
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        resetCode = await new Promise<string>((resolve) => {
          rl.question('   Nhập mã OTP (6 chữ số): ', (code: string) => {
            rl.close();
            resolve(code.trim());
          });
        });

        log(`   📝 Mã OTP đã nhập: ${resetCode}\n`, colors.blue);
      }
    } catch (error: any) {
      log('❌ Lỗi khi request reset code:', colors.red);
      log(`   ${error.response?.data?.message || error.message}`, colors.red);
      if (error.response?.status === 429) {
        log('   💡 Gợi ý: Đợi 60 giây trước khi thử lại', colors.yellow);
      }
      return;
    }

    // ========== BƯỚC 2: Verify Reset Code (Optional) ==========
    log('🔍 BƯỚC 2: Xác minh mã OTP...', colors.yellow);
    try {
      const response = await axios.post<ApiResponse>(
        `${API_URL}/auth/forgot-password/verify-code`,
        { email: TEST_EMAIL, code: resetCode }
      );

      if (response.data.success) {
        log('✅ Mã OTP hợp lệ!', colors.green);
        log(`   Email: ${response.data.data?.email}\n`, colors.green);
      }
    } catch (error: any) {
      log('❌ Lỗi khi verify code:', colors.red);
      log(`   ${error.response?.data?.message || error.message}`, colors.red);
      if (error.response?.status === 400) {
        const message = error.response?.data?.message;
        if (message?.includes('expired')) {
          log('   💡 Gợi ý: Mã đã hết hạn, yêu cầu mã mới', colors.yellow);
        } else if (message?.includes('Invalid code')) {
          log('   💡 Gợi ý: Mã không đúng, kiểm tra lại', colors.yellow);
        }
      }
      return;
    }

    // ========== BƯỚC 3: Reset Password ==========
    log('🔐 BƯỚC 3: Đặt lại mật khẩu mới...', colors.yellow);
    try {
      const response = await axios.post<ApiResponse>(
        `${API_URL}/auth/forgot-password/reset-password`,
        {
          email: TEST_EMAIL,
          code: resetCode,
          newPassword: TEST_PASSWORD,
        }
      );

      if (response.data.success) {
        log('✅ Đặt lại mật khẩu thành công!', colors.green);
        log(`   Message: ${response.data.data?.message}\n`, colors.green);
      }
    } catch (error: any) {
      log('❌ Lỗi khi reset password:', colors.red);
      log(`   ${error.response?.data?.message || error.message}`, colors.red);
      return;
    }

    // ========== BƯỚC 4: Test Login với mật khẩu mới ==========
    log('🔑 BƯỚC 4: Kiểm tra đăng nhập với mật khẩu mới...', colors.yellow);
    try {
      const response = await axios.post<ApiResponse>(
        `${API_URL}/auth/login`,
        {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }
      );

      if (response.data.success && response.data.data?.token) {
        log('✅ Đăng nhập thành công với mật khẩu mới!', colors.green);
        log(`   Token: ${response.data.data.token.substring(0, 20)}...`, colors.green);
        log(`   User: ${response.data.data.user?.fullName || response.data.data.user?.email}\n`, colors.green);
      }
    } catch (error: any) {
      log('❌ Lỗi khi đăng nhập:', colors.red);
      log(`   ${error.response?.data?.message || error.message}`, colors.red);
      return;
    }

    log('🎉 ===== HOÀN THÀNH TEST - TẤT CẢ ĐỀU THÀNH CÔNG! =====\n', colors.green);

  } catch (error: any) {
    log('\n❌ ===== LỖI KHÔNG MONG MUỐN =====', colors.red);
    log(`${error.message}`, colors.red);
    if (error.response) {
      log(`Status: ${error.response.status}`, colors.red);
      log(`Data: ${JSON.stringify(error.response.data, null, 2)}`, colors.red);
    }
  }
}

// Test riêng lẻ từng chức năng
async function testResendCode() {
  log('\n🔄 ===== TEST RESEND CODE =====\n', colors.blue);
  
  try {
    const response = await axios.post<ApiResponse>(
      `${API_URL}/auth/forgot-password/resend`,
      { email: TEST_EMAIL }
    );

    if (response.data.success) {
      log('✅ Gửi lại mã thành công!', colors.green);
      log(`   TTL: ${response.data.data?.ttlMinutes} phút`, colors.green);
      log('   📬 Kiểm tra console server để lấy mã OTP mới\n', colors.yellow);
    }
  } catch (error: any) {
    log('❌ Lỗi khi resend code:', colors.red);
    log(`   ${error.response?.data?.message || error.message}`, colors.red);
    if (error.response?.status === 429) {
      log('   💡 Gợi ý: Đợi 60 giây trước khi gửi lại\n', colors.yellow);
    }
  }
}

async function testInvalidScenarios() {
  log('\n⚠️  ===== TEST CÁC TRƯỜNG HỢP LỖI =====\n', colors.blue);

  // Test 1: Email không tồn tại
  log('1. Test với email không tồn tại...', colors.yellow);
  try {
    await axios.post(`${API_URL}/auth/forgot-password/request-code`, {
      email: 'nonexistent@example.com',
    });
    log('✅ Server xử lý email không tồn tại (security: không leak info)\n', colors.green);
  } catch (error: any) {
    log(`❌ Unexpected error: ${error.message}\n`, colors.red);
  }

  // Test 2: Mã OTP không đúng
  log('2. Test với mã OTP không đúng...', colors.yellow);
  try {
    await axios.post(`${API_URL}/auth/forgot-password/verify-code`, {
      email: TEST_EMAIL,
      code: '000000',
    });
    log('❌ Không nên verify được với mã sai\n', colors.red);
  } catch (error: any) {
    if (error.response?.status === 400) {
      log('✅ Server từ chối mã OTP không đúng\n', colors.green);
    } else {
      log(`⚠️  Lỗi khác: ${error.message}\n`, colors.yellow);
    }
  }

  // Test 3: Mã OTP không đúng định dạng
  log('3. Test với mã OTP không đúng định dạng...', colors.yellow);
  try {
    await axios.post(`${API_URL}/auth/forgot-password/verify-code`, {
      email: TEST_EMAIL,
      code: '123', // Phải là 6 chữ số
    });
    log('❌ Không nên chấp nhận mã không đúng định dạng\n', colors.red);
  } catch (error: any) {
    if (error.response?.status === 400) {
      log('✅ Server validation đúng\n', colors.green);
    }
  }

  // Test 4: Password quá ngắn
  log('4. Test với mật khẩu quá ngắn...', colors.yellow);
  try {
    await axios.post(`${API_URL}/auth/forgot-password/reset-password`, {
      email: TEST_EMAIL,
      code: '123456',
      newPassword: '123', // Phải ít nhất 6 ký tự
    });
    log('❌ Không nên chấp nhận mật khẩu quá ngắn\n', colors.red);
  } catch (error: any) {
    if (error.response?.status === 400) {
      log('✅ Server validation mật khẩu đúng\n', colors.green);
    }
  }

  log('🏁 ===== HOÀN THÀNH TEST LỖI =====\n', colors.blue);
}

// Main
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  if (command === 'resend') {
    await testResendCode();
  } else if (command === 'errors') {
    await testInvalidScenarios();
  } else if (command === 'full') {
    await testForgotPasswordFlow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testInvalidScenarios();
  } else {
    // Default: chạy flow chính
    await testForgotPasswordFlow();
  }
})();
