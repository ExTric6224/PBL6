import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordAPI } from '../../services/api';
import './AuthForm.css';

enum Step {
  REQUEST_CODE = 'REQUEST_CODE',
  VERIFY_CODE = 'VERIFY_CODE',
  RESET_PASSWORD = 'RESET_PASSWORD',
  SUCCESS = 'SUCCESS'
}

const ForgotPassword: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.REQUEST_CODE);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);

  const navigate = useNavigate();

  // Timer for resend button
  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0 && !canResend) {
      setCanResend(true);
    }
  }, [resendTimer, canResend]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await forgotPasswordAPI.requestResetCode({ email });
      setSuccess(`Mã xác thực đã được gửi đến ${email}. Kiểm tra email của bạn!`);
      setCurrentStep(Step.VERIFY_CODE);
      setCanResend(false);
      setResendTimer(60); // 60 seconds cooldown
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await forgotPasswordAPI.verifyResetCode({ email, code });
      setSuccess('Xác thực mã thành công! Vui lòng nhập mật khẩu mới của bạn.');
      setCurrentStep(Step.RESET_PASSWORD);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Mã không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu không khớp');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setIsLoading(false);
      return;
    }

    try {
      await forgotPasswordAPI.resetPassword({ email, code, newPassword });
      setSuccess('Đặt lại mật khẩu thành công! Đang chuyển đến đăng nhập...');
      setCurrentStep(Step.SUCCESS);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await forgotPasswordAPI.resendResetCode({ email });
      setSuccess('Mã xác thực mới đã được gửi đến email của bạn!');
      setCanResend(false);
      setResendTimer(60);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Không thể gửi lại mã. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep === Step.REQUEST_CODE ? 'active' : ''} ${[Step.VERIFY_CODE, Step.RESET_PASSWORD, Step.SUCCESS].includes(currentStep) ? 'completed' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">Yêu cầu mã</div>
      </div>
      <div className={`step ${currentStep === Step.VERIFY_CODE ? 'active' : ''} ${[Step.RESET_PASSWORD, Step.SUCCESS].includes(currentStep) ? 'completed' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">Xác thực mã</div>
      </div>
      <div className={`step ${currentStep === Step.RESET_PASSWORD ? 'active' : ''} ${currentStep === Step.SUCCESS ? 'completed' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Đặt lại mật khẩu</div>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Quên mật khẩu</h2>
          <p>Đặt lại mật khẩu của bạn bằng xác thực email</p>
        </div>

        {renderStepIndicator()}

        {/* Step 1: Request Reset Code */}
        {currentStep === Step.REQUEST_CODE && (
          <form onSubmit={handleRequestCode} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="email">Địa chỉ Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                required
                placeholder="Nhập email của bạn"
                disabled={isLoading}
              />
              <small className="form-hint">
                Chúng tôi sẽ gửi mã xác thực 6 chữ số đến email này
              </small>
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </button>
          </form>
        )}

        {/* Step 2: Verify Code */}
        {currentStep === Step.VERIFY_CODE && (
          <form onSubmit={handleVerifyCode} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="disabled-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="code">Mã xác thực</label>
              <input
                type="text"
                id="code"
                name="code"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                  if (error) setError('');
                }}
                required
                placeholder="Nhập mã 6 chữ số"
                disabled={isLoading}
                maxLength={6}
                pattern="\d{6}"
              />
              <small className="form-hint">
                Nhập mã 6 chữ số đã được gửi đến email của bạn
              </small>
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? 'Đang xác thực...' : 'Xác thực mã'}
            </button>

            <div className="resend-section">
              <p>Chưa nhận được mã?</p>
              <button
                type="button"
                onClick={handleResendCode}
                className="auth-button secondary"
                disabled={!canResend || isLoading}
              >
                {!canResend && resendTimer > 0
                  ? `Gửi lại sau ${resendTimer}s`
                  : 'Gửi lại mã'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {currentStep === Step.RESET_PASSWORD && (
          <form onSubmit={handleResetPassword} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError('');
                }}
                required
                placeholder="Nhập mật khẩu mới"
                disabled={isLoading}
                minLength={6}
              />
              <small className="form-hint">
                Mật khẩu phải có ít nhất 6 ký tự
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                required
                placeholder="Xác nhận mật khẩu mới"
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        {/* Success Message */}
        {currentStep === Step.SUCCESS && (
          <div className="success-container">
            <div className="success-icon">✓</div>
            <div className="success-message large">
              Đặt lại mật khẩu thành công!
            </div>
            <p>Đang chuyển đến trang đăng nhập...</p>
          </div>
        )}

        <div className="auth-footer">
          <p>
            Đã nhớ mật khẩu?{' '}
            <Link to="/login" className="auth-link">
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
