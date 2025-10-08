import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationContext } from '../../contexts/NotificationContext';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useNotificationContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    // Simulate API call - replace with actual implementation
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      showSuccess('Password reset instructions sent to your email');
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h1>Check Your Email</h1>
            <p>
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <p className="help-text">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="action-buttons">
              <Link to="/login" className="btn btn-primary">
                Back to Sign In
              </Link>
              <button 
                onClick={() => setIsSubmitted(false)} 
                className="btn btn-secondary"
              >
                Try Different Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <h1>Reset Your Password</h1>
          <p>
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email address"
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary reset-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Sending Instructions...
              </>
            ) : (
              'Send Reset Instructions'
            )}
          </button>
        </form>

        <div className="forgot-password-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="back-link">
              Back to Sign In
            </Link>
          </p>
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="signup-link">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;