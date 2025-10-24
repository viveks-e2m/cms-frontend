import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute, AdminRoute, ClientManagerRoute, AiInternRoute } from './components/ProtectedRoute';
import { PermissionGuard, AdminOnly, CanCreateClient } from './components/PermissionGuard';
import { UserRoleManager } from './components/UserRoleManager';

// Example components (replace with your actual components)
const Login = () => <div>Login Page</div>;
const Dashboard = () => <div>Dashboard</div>;
const ClientList = () => <div>Client List</div>;
const CreateClient = () => <div>Create Client Form</div>;
const UserManagement = () => <div>User Management</div>;
const Unauthorized = () => <div>Unauthorized Access</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <nav>
            <h1>CMS Application</h1>
            
            {/* Navigation with permission-based visibility */}
            <PermissionGuard permissions={['read_client']}>
              <a href="/clients">Clients</a>
            </PermissionGuard>
            
            <CanCreateClient>
              <a href="/clients/create">Create Client</a>
            </CanCreateClient>
            
            <AdminOnly>
              <a href="/admin/users">User Management</a>
            </AdminOnly>
            
            <PermissionGuard permissions={['view_analytics']}>
              <a href="/analytics">Analytics</a>
            </PermissionGuard>
          </nav>

          <main>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Permission-based routes */}
              <Route 
                path="/clients" 
                element={
                  <ProtectedRoute permissions={['read_client']}>
                    <ClientList />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/clients/create" 
                element={
                  <ProtectedRoute permissions={['create_client']}>
                    <CreateClient />
                  </ProtectedRoute>
                } 
              />
              
              {/* Role-based routes */}
              <Route 
                path="/admin/users" 
                element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/admin/rbac" 
                element={
                  <AdminRoute>
                    <UserRoleManager />
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/manager/*" 
                element={
                  <ClientManagerRoute>
                    <div>Manager Dashboard</div>
                  </ClientManagerRoute>
                } 
              />
              
              <Route 
                path="/intern/*" 
                element={
                  <AiInternRoute>
                    <div>AI Intern Dashboard</div>
                  </AiInternRoute>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;