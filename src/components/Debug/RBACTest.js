import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { rbacAPI } from '../../utils/rbacAPI';
import { PermissionGuard, AdminOnly, CanManageUsers } from '../PermissionGuard';
import DashboardLayout from '../Layout/DashboardLayout/DashboardLayout';

const RBACTest = () => {
  const { 
    user, 
    role, 
    permissions, 
    hasPermission, 
    hasRole, 
    isAdmin,
    isAuthenticated,
    loading 
  } = useAuth();
  
  const [testResults, setTestResults] = useState({});
  const [rbacData, setRbacData] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      runTests();
    }
  }, [isAuthenticated, user, role, permissions]);

  const runTests = async () => {
    const results = {};
    
    // Test basic auth state
    results.isAuthenticated = isAuthenticated;
    results.hasUser = !!user;
    results.hasRole = !!role;
    results.hasPermissions = permissions && permissions.length > 0;
    
    // Test role checks
    results.isAdmin = isAdmin();
    results.hasAdminRole = hasRole('admin');
    results.hasAiInternRole = hasRole('ai_intern');
    
    // Test permission checks
    results.canManageClients = hasPermission('manage_clients');
    results.canViewAnalytics = hasPermission('view_analytics');
    results.canManageUsers = hasPermission('manage_user_roles');
    
    // Test RBAC API
    try {
      const myPerms = await rbacAPI.getMyPermissions();
      results.rbacApiWorking = true;
      setRbacData(myPerms);
    } catch (error) {
      results.rbacApiWorking = false;
      results.rbacApiError = error.message;
    }
    
    setTestResults(results);
  };

  if (loading) {
    return <div>Loading RBAC test...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to test RBAC functionality.</div>;
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>RBAC Integration Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>User Information</h3>
        <pre>{JSON.stringify({ user, role, permissions }, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Results</h3>
        <pre>{JSON.stringify(testResults, null, 2)}</pre>
      </div>

      {rbacData && (
        <div style={{ marginBottom: '20px' }}>
          <h3>RBAC API Data</h3>
          <pre>{JSON.stringify(rbacData, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Permission Guard Tests</h3>
        
        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
          <h4>Admin Only Component:</h4>
          <AdminOnly fallback={<span style={{ color: 'red' }}>❌ Access Denied - Not Admin</span>}>
            <span style={{ color: 'green' }}>✅ Admin Access Granted</span>
          </AdminOnly>
        </div>

        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
          <h4>Can Manage Users Component:</h4>
          <CanManageUsers fallback={<span style={{ color: 'red' }}>❌ Access Denied - Cannot Manage Users</span>}>
            <span style={{ color: 'green' }}>✅ User Management Access Granted</span>
          </CanManageUsers>
        </div>

        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
          <h4>Custom Permission Guard (manage_clients):</h4>
          <PermissionGuard 
            permissions={['manage_clients']} 
            fallback={<span style={{ color: 'red' }}>❌ Access Denied - Cannot Manage Clients</span>}
          >
            <span style={{ color: 'green' }}>✅ Client Management Access Granted</span>
          </PermissionGuard>
        </div>

        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
          <h4>Role-based Guard (admin or account_manager):</h4>
          <PermissionGuard 
            roles={['admin', 'account_manager']} 
            fallback={<span style={{ color: 'red' }}>❌ Access Denied - Not Admin or Account Manager</span>}
          >
            <span style={{ color: 'green' }}>✅ Manager Access Granted</span>
          </PermissionGuard>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Actions</h3>
        <button onClick={runTests} style={{ margin: '5px', padding: '10px' }}>
          Re-run Tests
        </button>
        <button 
          onClick={() => window.location.reload()} 
          style={{ margin: '5px', padding: '10px' }}
        >
          Reload Page
        </button>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default RBACTest;