import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ 
  children, 
  permissions = [], 
  roles = [], 
  requireAll = false,
  redirectTo = '/login',
  fallbackComponent = null 
}) => {
  const { 
    user, 
    loading, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasAnyRole 
  } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (roles.length > 0 && !hasAnyRole(roles)) {
    if (fallbackComponent) {
      return fallbackComponent;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission-based access
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasRequiredPermissions) {
      if (fallbackComponent) {
        return fallbackComponent;
      }
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

// Specific route guards for common use cases
export const AdminRoute = ({ children }) => (
  <ProtectedRoute roles={['admin']}>
    {children}
  </ProtectedRoute>
);

export const ClientManagerRoute = ({ children }) => (
  <ProtectedRoute roles={['admin', 'account_manager']}>
    {children}
  </ProtectedRoute>
);

export const AiInternRoute = ({ children }) => (
  <ProtectedRoute roles={['ai_intern']}>
    {children}
  </ProtectedRoute>
);