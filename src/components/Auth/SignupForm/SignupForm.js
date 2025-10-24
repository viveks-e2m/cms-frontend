import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import './SignupForm.css';

const SignupForm = ({ onSuccess }) => {
  const { signup, loading } = useAuth();
  const { showError } = useNotificationContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare signup data
    const signupData = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password
    };

    const result = await signup(signupData);
    
    if (result.success) {
      // Redirect to login page with success message
      navigate('/login', {
        state: {
          message: 'Account created successfully! You can now sign in with your credentials.'
        }
      });
      onSuccess?.();
    } else {
      showError(result.error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="signup-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName" className="form-label">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`form-input ${errors.firstName ? 'error' : ''}`}
            placeholder="Enter your first name"
            disabled={loading}
          />
          {errors.firstName && <div className="form-error">{errors.firstName}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="lastName" className="form-label">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`form-input ${errors.lastName ? 'error' : ''}`}
            placeholder="Enter your last name"
            disabled={loading}
          />
          {errors.lastName && <div className="form-error">{errors.lastName}</div>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="Enter your email address"
          disabled={loading}
        />
        {errors.email && <div className="form-error">{errors.email}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Password *
        </label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Create a strong password"
            disabled={loading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.password && <div className="form-error">{errors.password}</div>}
        <div className="password-requirements">
          <small>Password must be at least 8 characters with uppercase, lowercase, and number</small>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">
          Confirm Password *
        </label>
        <div className="password-input-wrapper">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="Confirm your password"
            disabled={loading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={toggleConfirmPasswordVisibility}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
      </div>

      <button
        type="submit"
        className="btn btn-primary signup-btn"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </button>

      <div className="form-footer">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="login-link">
            Sign in here
          </Link>
        </p>
      </div>
    </form>
  );
};

export default SignupForm;