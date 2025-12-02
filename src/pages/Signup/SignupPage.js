import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SignupForm from '../../components/Auth/SignupForm/SignupForm';
import LoadingSpinner from '../../components/UI/LoadingSpinner/LoadingSpinner';
import './SignupPage.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSignupSuccess = () => {
    // After successful signup, redirect to login page
    navigate('/login', { 
      replace: true,
      state: { 
        message: 'Account created successfully! Please sign in with your credentials.' 
      }
    });
  };

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <h1 className="signup-title">Create Your Account</h1>
          <p className="signup-subtitle">
            Get started with just your email and password
          </p>
        </div>

        <SignupForm onSuccess={handleSignupSuccess} />

        {/* <div className="signup-footer">
          <p>© 2025 CMS Dashboard. All rights reserved.</p>
        </div> */}
      </div>
      
      {/* Background Decoration */}
      <div className="signup-background">
        <div className="background-shape shape-1"></div>
        <div className="background-shape shape-2"></div>
        <div className="background-shape shape-3"></div>
      </div>
    </div>
  );
};

export default SignupPage;