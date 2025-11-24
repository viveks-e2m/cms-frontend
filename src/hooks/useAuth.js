import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { authAPI } from '../utils/api';
import { rbacAPI } from '../utils/rbacAPI';
import { clearAllUserCache, setCachedUser } from '../utils/userCache';

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
  
  // Ref to prevent duplicate calls in development (React StrictMode)
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Load user data and permissions on mount
  useEffect(() => {
    // Prevent duplicate calls in StrictMode
    if (hasLoadedRef.current || isLoadingRef.current) {
      return;
    }
    loadUserData();
  }, []);

  const loadUserData = async () => {
    // Prevent duplicate concurrent calls
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      hasLoadedRef.current = true;
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Get current user info (will use cache if available)
      const userResponse = await authAPI.getCurrentUser();
      setUser(userResponse);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userResponse));
      setCachedUser(userResponse);

      // Get user permissions and role from RBAC service (will use cache if available)
      console.log('Loading RBAC data...');
      const rbacData = await rbacAPI.getMyPermissions();
      console.log('RBAC data received:', rbacData);
      
      console.log('Setting role:', rbacData.role);
      console.log('Setting permissions:', rbacData.permissions);
      setRole(rbacData.role);
      setPermissions(rbacData.permissions || []);
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
      isLoadingRef.current = false;
    }
  };

  const login = async (credentials, onProgress = null) => {
    try {
      // Ensure credentials is an object with email and password
      if (!credentials || typeof credentials !== 'object' || !credentials.email || !credentials.password) {
        throw new Error('Invalid credentials format. Expected object with email and password.');
      }
      
      // Clear any existing cache before login to ensure fresh data
      clearAllUserCache();
      
      const result = await authAPI.login(credentials);
      
      // Store tokens and user data
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('refreshToken', result.refreshToken);

      let enrichedUser = result.user;
      try {
        enrichedUser = await authAPI.getCurrentUser(true);
      } catch (profileError) {
        console.error('Failed to fetch enriched user profile after login:', profileError);
      }

      localStorage.setItem('user', JSON.stringify(enrichedUser));
      setCachedUser(enrichedUser);
      
      setUser(enrichedUser);
      setIsAuthenticated(true);
      
      // Load RBAC data after login (force refresh to get fresh data)
      try {
        const rbacData = await rbacAPI.getMyPermissions(true);
        setRole(rbacData.role);
        setPermissions(rbacData.permissions || []);
      } catch (error) {
        console.error('Error loading RBAC data after login:', error);
        // Don't fail login if RBAC fails, user data is already set
      }
      
      return { success: true };
    } catch (error) {
      console.log('useAuth login error:', error);
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      console.log('Error name:', error.name);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Login failed';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.code === 'TIMEOUT_ERROR') {
        errorMessage = 'The request timed out. Please try again.';
      }
      
      console.log('Final error message being returned:', errorMessage);
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and cache regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      clearAllUserCache();
      setUser(null);
      setRole(null);
      setPermissions([]);
      setIsAuthenticated(false);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const updatedUser = await authAPI.getCurrentUser(true);
      setUser(updatedUser);
      setCachedUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
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
    refreshUserProfile,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isAiIntern,
    isAccountManager,
    isAdoptionSpecialist,
    loadUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};