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
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
      setSuccess(`Verification code sent to ${response.email}. Code expires in ${response.ttlMinutes} minutes.`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpData.code || otpData.code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await verifyOtpCode({
        email: otpData.email,
        code: otpData.code,
      });
      
      setSuccess('Registration successful! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Verification failed. Please try again.';
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
      setSuccess(`New verification code sent to ${response.email}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to resend code. Please try again.';
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
            <h2>Create Account with Email Verification</h2>
            <p>We'll send you a verification code to confirm your email</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Enter your email address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Re-enter your password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">I want to register as</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="MENTEE">Mentee (Looking for mentorship)</option>
                <option value="MENTOR">Mentor (Providing mentorship)</option>
              </select>
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Sign in here</Link>
            </p>
            <p>
              <Link to="/register">Use legacy registration (no email verification)</Link>
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
          <h2>Verify Your Email</h2>
          <p>Enter the 6-digit code sent to <strong>{otpData.email}</strong></p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleVerifySubmit}>
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={otpData.code}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Enter 6-digit code"
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
            {isLoading ? 'Verifying...' : 'Verify & Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <div className="resend-section">
            {countdown > 0 ? (
              <p>Resend code in {formatCountdown(countdown)}</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="link-button"
              >
                {isLoading ? 'Sending...' : 'Resend Code'}
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
              ← Back to registration
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpRegister;