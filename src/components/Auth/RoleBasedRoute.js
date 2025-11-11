import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const RoleBasedRoute = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = "/dashboard",
  fallbackComponent = null,
}) => {
  const { user, role, permissions, loading, isAuthenticated } = useAuth();
  const location = useLocation();



  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access OR permission-based access
  let hasAccess = true;

  // If both roles and permissions are specified, user needs either one
  if (allowedRoles.length > 0 || requiredPermissions.length > 0) {
    hasAccess = false;

    // Check role-based access
    if (allowedRoles.length > 0) {
      const hasAllowedRole = allowedRoles.includes(role?.name);
      if (hasAllowedRole) {
        hasAccess = true;
      }
    }

    // Check permission-based access (if role check didn't pass)
    if (!hasAccess && requiredPermissions.length > 0) {
      const hasRequiredPermissions = requireAll
        ? requiredPermissions.every((permission) =>
            permissions.includes(permission)
          )
        : requiredPermissions.some((permission) =>
            permissions.includes(permission)
          );

      if (hasRequiredPermissions) {
        hasAccess = true;
      }
    }

    // If no access, show fallback or redirect
    if (!hasAccess) {
      if (fallbackComponent) {
        return fallbackComponent;
      }
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
};

// Specific role-based route components
export const AdminRoute = ({ children, fallbackPath = "/dashboard" }) => (
  <RoleBasedRoute
    allowedRoles={["admin"]}
    fallbackPath={fallbackPath}
    fallbackComponent={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    }
  >
    {children}
  </RoleBasedRoute>
);

export const ManagerRoute = ({ children, fallbackPath = "/dashboard" }) => (
  <RoleBasedRoute
    allowedRoles={["admin", "account_manager"]}
    fallbackPath={fallbackPath}
    fallbackComponent={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need manager privileges to access this page.
          </p>
        </div>
      </div>
    }
  >
    {children}
  </RoleBasedRoute>
);

export const ClientManagerRoute = ({
  children,
  fallbackPath = "/dashboard",
}) => (
  <RoleBasedRoute
    allowedRoles={["admin", "account_manager"]}
    requiredPermissions={["read_client"]}
    fallbackPath={fallbackPath}
    fallbackComponent={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need client management permissions to access this page.
          </p>
        </div>
      </div>
    }
  >
    {children}
  </RoleBasedRoute>
);

export default RoleBasedRoute;
