import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import './LogoutButton.css';

const LogoutButton = ({ className = '', variant = 'secondary' }) => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`btn btn-${variant} logout-btn ${className}`}
    >
      {isLoggingOut ? (
        <>
          <span className="spinner"></span>
          Signing Out...
        </>
      ) : (
        'Sign Out'
      )}
    </button>
  );
};

export default LogoutButton;