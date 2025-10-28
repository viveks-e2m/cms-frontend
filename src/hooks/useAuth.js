import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user data and permissions on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Get current user info
      const userResponse = await authAPI.getCurrentUser();
      setUser(userResponse);
      setIsAuthenticated(true);

      // Get user permissions and role from RBAC service
      console.log('Loading RBAC data...');
      const rbacResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://py-cms.sitepreviews.dev'}/rbac/my-permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('RBAC response status:', rbacResponse.status);

      if (rbacResponse.ok) {
        const rbacData = await rbacResponse.json();
        console.log('RBAC data received:', rbacData);
        if (rbacData.success) {
          const userData = rbacData.data;
          console.log('Setting role:', userData.role);
          console.log('Setting permissions:', userData.permissions);
          setRole(userData.role);
          setPermissions(userData.permissions || []);
        } else {
          console.error('RBAC API returned success=false:', rbacData);
        }
      } else {
        console.error('RBAC API call failed:', rbacResponse.status, rbacResponse.statusText);
        const errorText = await rbacResponse.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Clear invalid token
      localStorage.removeItem('authToken');
      setUser(null);
      setRole(null);
      setPermissions([]);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      // Ensure credentials is an object with email and password
      if (!credentials || typeof credentials !== 'object' || !credentials.email || !credentials.password) {
        throw new Error('Invalid credentials format. Expected object with email and password.');
      }
      
      const result = await authAPI.login(credentials);
      
      // Store token and user data
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      setUser(result.user);
      setIsAuthenticated(true);
      
      // Load RBAC data after login
      await loadUserData();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setRole(null);
      setPermissions([]);
      setIsAuthenticated(false);
    }
  };

  const signup = async (userData) => {
    try {
      console.log('Signup function called with:', userData);
      const result = await authAPI.signup(userData);
      console.log('Signup result:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.message || 'Signup failed' 
      };
    }
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList) => {
    return permissionList.every(permission => permissions.includes(permission));
  };

  const hasRole = (requiredRole) => {
    return role?.name === requiredRole;
  };

  const hasAnyRole = (roleList) => {
    return roleList.includes(role?.name);
  };

  const isAdmin = () => {
    return hasRole('admin');
  };

  const isAiIntern = () => {
    return hasRole('ai_intern');
  };

  const isAccountManager = () => {
    return hasRole('account_manager');
  };

  const isAdoptionSpecialist = () => {
    return hasRole('adoption_specialist');
  };

  const value = {
    user,
    role,
    permissions,
    loading,
    isAuthenticated,
    login,
    logout,
    signup,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isAiIntern,
    isAccountManager,
    isAdoptionSpecialist,
    loadUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};