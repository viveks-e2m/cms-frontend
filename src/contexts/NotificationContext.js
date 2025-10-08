import React, { createContext, useContext } from 'react';
import { useNotification } from '../hooks/useNotification';
import NotificationContainer from '../components/UI/NotificationContainer/NotificationContainer';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const notificationMethods = useNotification();

  return (
    <NotificationContext.Provider value={notificationMethods}>
      {children}
      <NotificationContainer 
        notifications={notificationMethods.notifications}
        onRemove={notificationMethods.removeNotification}
      />
    </NotificationContext.Provider>
  );
};