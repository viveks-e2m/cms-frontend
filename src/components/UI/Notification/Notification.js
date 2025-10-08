import React, { useEffect, useState } from 'react';
import './Notification.css';

const Notification = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300); // Match CSS transition duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div 
      className={`notification notification--${notification.type} ${
        isVisible ? 'notification--visible' : ''
      } ${isRemoving ? 'notification--removing' : ''}`}
    >
      <div className="notification__icon">
        {getIcon()}
      </div>
      
      <div className="notification__content">
        {notification.title && (
          <div className="notification__title">
            {notification.title}
          </div>
        )}
        <div className="notification__message">
          {notification.message}
        </div>
      </div>
      
      <button 
        className="notification__close"
        onClick={handleRemove}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

export default Notification;