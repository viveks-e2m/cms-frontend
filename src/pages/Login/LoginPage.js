import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationContext } from "../../contexts/NotificationContext";
import LoginForm from "../../components/Auth/LoginForm/LoginForm";
import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { showSuccess } = useNotificationContext();

  const from = location.state?.from?.pathname || "/dashboard";
  const successMessage = location.state?.message;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Show success message from signup
  useEffect(() => {
    if (successMessage) {
      showSuccess(successMessage);
      // Clear the message from location state to prevent showing it again
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, message: undefined },
      });
    }
  }, [successMessage, showSuccess, navigate, location]);

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to access your CMS dashboard</p>
        </div>

        <LoginForm onSuccess={handleLoginSuccess} />

        <div className="login-footer">
          <p>© 2025 CMS Dashboard. All rights reserved.</p>
          <p>Version 1.0.10 | Dt. 02/12/2025 | Time 11:47 PM</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
