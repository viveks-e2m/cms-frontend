import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import "./LoginForm.css";

const LoginForm = ({ onSuccess }) => {
  const { login, loading } = useAuth();
  const { showError, showSuccess } = useNotificationContext();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log('Form data being sent to login:', formData);
    const result = await login(formData);

    if (result.success) {
      showSuccess("Login successful! Redirecting to dashboard...");
      onSuccess?.();
    } else {
      showError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        {/* <label htmlFor="email" className="form-label">
          Email Address
        </label> */}
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`form-input ${errors.email ? "error" : ""}`}
          placeholder="Enter your email"
          disabled={loading}
        />
        {errors.email && <div className="form-error">{errors.email}</div>}
      </div>

      <div className="form-group">
        {/* <label htmlFor="password" className="form-label">
          Password
        </label> */}
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`form-input ${errors.password ? "error" : ""}`}
          placeholder="Enter your password"
          disabled={loading}
        />
        {errors.password && <div className="form-error">{errors.password}</div>}
      </div>

      <button
        type="submit"
        className="btn btn-primary login-btn"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </button>

      <div className="form-footer">
        <div className="signup-prompt">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="signup-link">
              Create one here
            </Link>
          </p>
        </div>

        <div className="forgot-password">
          <Link to="/forgot-password" className="forgot-link">
            Forgot your password?
          </Link>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
