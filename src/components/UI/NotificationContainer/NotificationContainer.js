import React from 'react';
import { createPortal } from 'react-dom';
import Notification from '../Notification/Notification';
import './NotificationContainer.css';

const NotificationContainer = ({ notifications, onRemove }) => {
  if (!notifications.length) return null;

  return createPortal(
    <div className="notification-container">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>,
    document.body
  );
};

export default NotificationContainer;