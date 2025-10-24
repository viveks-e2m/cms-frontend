import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import LogoutButton from '../../Auth/LogoutButton/LogoutButton';
import './Header.css';

const Header = ({ onMobileMenuToggle, showMobileMenuToggle }) => {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            {showMobileMenuToggle && (
              <button 
                className="mobile-menu-toggle"
                onClick={onMobileMenuToggle}
                aria-label="Toggle menu"
              >
                ☰
              </button>
            )}
            <div className="header-brand">
              <h1 className="brand-title">Dashboard</h1>
            </div>
          </div>

          <div className="header-right">
            <div className="header-user">
              {user && (
                <div className="user-info">
                  <p className="user-name">{user.name || user.email}</p>
                  <p className="user-role">{user.role || 'User'}</p>
                </div>
              )}
              <LogoutButton variant="secondary" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;