import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthForm.css';

const OtpRegister: React.FC = () => {
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'MENTEE' as 'MENTOR' | 'MENTEE',
  });
  const [otpData, setOtpData] = useState({
    email: '',
    code: '',
    ttlMinutes: 0,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const { requestOtpCode, verifyOtpCode, resendOtpCode } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (step === 'verify') {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (step === 'register') {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    } else {
      setOtpData({
        ...otpData,
        [e.target.name]: e.target.value,
      });
    }
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp');
      return false;
    }
    return true;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await requestOtpCode({
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      setOtpData({
        email: response.email,
        code: '',
        ttlMinutes: response.ttlMinutes,
      });
      
      setStep('verify');
      setCountdown(60); // 60 seconds cooldown for resend
      setCanResend(false);
      setSuccess(`Mã xác minh đã được gửi đến ${response.email}. Mã hết hạn sau ${response.ttlMinutes} phút.`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpData.code || otpData.code.length !== 6) {
      setError('Vui lòng nhập mã 6 chữ số hợp lệ');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await verifyOtpCode({
        email: otpData.email,
        code: otpData.code,
      });
      
      setSuccess('Đăng ký thành công! Đang chuyển hướng đến bảng điều khiển...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Xác thực thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isLoading) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await resendOtpCode(otpData.email);
      setCountdown(60);
      setCanResend(false);
      setSuccess(`Mã xác minh mới đã được gửi đến ${response.email}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Gửi lại mã thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'register') {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <div className="auth-header">
            <h2>Tạo tài khoản với xác minh email</h2>
            <p>Chúng tôi sẽ gửi mã xác minh để xác nhận email của bạn</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label htmlFor="email">Địa chỉ Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Nhập địa chỉ email của bạn"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Ít nhất 6 ký tự"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận Mật khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Nhập lại mật khẩu của bạn"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Tôi muốn đăng ký với vai trò</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="MENTEE">Học viên</option>
                <option value="MENTOR">Chuyên gia</option>
              </select>
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Đang gửi mã...' : 'Gửi mã xác minh'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Bạn đã có tài khoản? <Link to="/login">Đăng nhập tại đây</Link>
            </p>
            <p>
              <Link to="/register">Sử dụng đăng ký cũ (không xác minh email)</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div className="auth-header">
          <h2>Xác minh Email của bạn</h2>
          <p>Nhập mã 6 chữ số đã gửi đến <strong>{otpData.email}</strong></p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleVerifySubmit}>
          <div className="form-group">
            <label htmlFor="code">Mã xác minh</label>
            <input
              type="text"
              id="code"
              name="code"
              value={otpData.code}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Nhập mã 6 chữ số"
              maxLength={6}
              pattern="\d{6}"
              style={{
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.5rem',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Xác thực...' : 'Xác thực & Tạo tài khoản'}
          </button>
        </form>

        <div className="auth-footer">
          <div className="resend-section">
            {countdown > 0 ? (
              <p>Gửi lại mã sau {formatCountdown(countdown)}</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="link-button"
              >
                {isLoading ? 'Đang gửi...' : 'Gửi lại mã'}
              </button>
            )}
          </div>
          <p>
            <button
              type="button"
              onClick={() => setStep('register')}
              className="link-button"
              disabled={isLoading}
            >
              ← Quay lại đăng ký
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpRegister;