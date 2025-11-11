import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../utils/api';
import { rbacAPI } from '../utils/rbacAPI';
import { isFirstLogin } from '../utils/cacheStorage';
import { prefetchAllData } from '../utils/dataPrefetch';

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
  const [prefetchProgress, setPrefetchProgress] = useState(null);
  const [isPrefetching, setIsPrefetching] = useState(false);

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

      // Get user permissions and role from RBAC service using the proper API utility
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
    }
  };

  const login = async (credentials, onProgress = null) => {
    try {
      // Ensure credentials is an object with email and password
      if (!credentials || typeof credentials !== 'object' || !credentials.email || !credentials.password) {
        throw new Error('Invalid credentials format. Expected object with email and password.');
      }
      
      const result = await authAPI.login(credentials);
      
      // Store tokens and user data
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('refreshToken', result.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      setUser(result.user);
      setIsAuthenticated(true);
      
      // Load RBAC data after login
      await loadUserData();
      
      // Check if this is first login and prefetch data
      const firstLogin = await isFirstLogin();
      if (firstLogin) {
        setIsPrefetching(true);
        setPrefetchProgress({ percentage: 0, message: 'Preparing your workspace...' });
        
        try {
          const prefetchResult = await prefetchAllData((progress) => {
            if (onProgress) {
              onProgress(progress);
            }
            setPrefetchProgress(progress);
          });
          
          setPrefetchProgress({ 
            percentage: 100, 
            message: 'Setup complete! Redirecting...' 
          });
          
          // Small delay to show completion
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error prefetching data:', error);
          // Continue even if prefetching fails
        } finally {
          setIsPrefetching(false);
          setPrefetchProgress(null);
        }
      }
      
      return { success: true };
    } catch (error) {
      // Clean up prefetching state on error
      setIsPrefetching(false);
      setPrefetchProgress(null);
      
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
      // Clear local state regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
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
    loadUserData,
    prefetchProgress,
    isPrefetching,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};