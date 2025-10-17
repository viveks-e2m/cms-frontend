import React from 'react';
import { useAuth } from '../hooks/useAuth';

// Component to conditionally render based on permissions
export const PermissionGuard = ({ 
  permissions = [], 
  roles = [], 
  requireAll = false, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = useAuth();

  // Check role-based access
  if (roles.length > 0) {
    const hasRequiredRole = hasAnyRole(roles);
    if (!hasRequiredRole) {
      return fallback;
    }
  }

  // Check permission-based access
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasRequiredPermissions) {
      return fallback;
    }
  }

  return children;
};

// Higher-order component for permission-based rendering
export const withPermissions = (permissions = [], roles = []) => {
  return (WrappedComponent) => {
    return (props) => (
      <PermissionGuard 
        permissions={permissions} 
        roles={roles}
        fallback={<div>Access Denied</div>}
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
};

// Specific permission components for common use cases
export const AdminOnly = ({ children, fallback = null }) => (
  <PermissionGuard roles={['admin']} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const ClientManagerOnly = ({ children, fallback = null }) => (
  <PermissionGuard 
    roles={['admin', 'account_manager']} 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanCreateClient = ({ children, fallback = null }) => (
  <PermissionGuard 
    permissions={['create_client']} 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManageUsers = ({ children, fallback = null }) => (
  <PermissionGuard 
    permissions={['manage_user_roles']} 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanViewAnalytics = ({ children, fallback = null }) => (
  <PermissionGuard 
    permissions={['view_analytics']} 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const AiInternOnly = ({ children, fallback = null }) => (
  <PermissionGuard 
    roles={['ai_intern']} 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);