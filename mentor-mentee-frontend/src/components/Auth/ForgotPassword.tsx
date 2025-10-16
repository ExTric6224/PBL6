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
      setSuccess(`Verification code sent to ${email}. Check your email!`);
      setCurrentStep(Step.VERIFY_CODE);
      setCanResend(false);
      setResendTimer(60); // 60 seconds cooldown
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to send verification code. Please try again.';
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
      setSuccess('Code verified successfully! Please enter your new password.');
      setCurrentStep(Step.RESET_PASSWORD);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Invalid or expired code. Please try again.';
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
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      await forgotPasswordAPI.resetPassword({ email, code, newPassword });
      setSuccess('Password reset successfully! Redirecting to login...');
      setCurrentStep(Step.SUCCESS);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to reset password. Please try again.';
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
      setSuccess('New verification code sent to your email!');
      setCanResend(false);
      setResendTimer(60);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to resend code. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep === Step.REQUEST_CODE ? 'active' : ''} ${[Step.VERIFY_CODE, Step.RESET_PASSWORD, Step.SUCCESS].includes(currentStep) ? 'completed' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">Request Code</div>
      </div>
      <div className={`step ${currentStep === Step.VERIFY_CODE ? 'active' : ''} ${[Step.RESET_PASSWORD, Step.SUCCESS].includes(currentStep) ? 'completed' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">Verify Code</div>
      </div>
      <div className={`step ${currentStep === Step.RESET_PASSWORD ? 'active' : ''} ${currentStep === Step.SUCCESS ? 'completed' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Reset Password</div>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Forgot Password</h2>
          <p>Reset your password using email verification</p>
        </div>

        {renderStepIndicator()}

        {/* Step 1: Request Reset Code */}
        {currentStep === Step.REQUEST_CODE && (
          <form onSubmit={handleRequestCode} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
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
                placeholder="Enter your email"
                disabled={isLoading}
              />
              <small className="form-hint">
                We'll send a 6-digit verification code to this email
              </small>
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
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
              <label htmlFor="code">Verification Code</label>
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
                placeholder="Enter 6-digit code"
                disabled={isLoading}
                maxLength={6}
                pattern="\d{6}"
              />
              <small className="form-hint">
                Enter the 6-digit code sent to your email
              </small>
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="resend-section">
              <p>Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendCode}
                className="auth-button secondary"
                disabled={!canResend || isLoading}
              >
                {!canResend && resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : 'Resend Code'}
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
              <label htmlFor="newPassword">New Password</label>
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
                placeholder="Enter new password"
                disabled={isLoading}
                minLength={6}
              />
              <small className="form-hint">
                Password must be at least 6 characters
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
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
                placeholder="Confirm new password"
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Success Message */}
        {currentStep === Step.SUCCESS && (
          <div className="success-container">
            <div className="success-icon">✓</div>
            <div className="success-message large">
              Password reset successfully!
            </div>
            <p>Redirecting to login page...</p>
          </div>
        )}

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
