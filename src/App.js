import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './pages/Login/LoginPage';
import SignupPage from './pages/Signup/SignupPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ClientsPage from './pages/Clients/ClientsPage';
import MeetingsPage from './pages/Meetings/MeetingsPage';
import SecretsPage from './pages/Secrets/SecretsPage';
import { ActionItemsPage } from './pages/ActionItems';
import N8nWorkflowsPage from './pages/N8nWorkflows/N8nWorkflowsPage';
import WorkflowDetailsPage from './pages/N8nWorkflows/WorkflowDetailsPage';
import AdminPanel from './pages/Admin/AdminPanel';
import UserProfile from './components/User/UserProfile';
import RBACTest from './components/Debug/RBACTest';
import LoginTest from './components/Debug/LoginTest';
import ProtectedRoute from './components/Auth/ProtectedRoute/ProtectedRoute';
import { AdminRoute, ManagerRoute, ClientManagerRoute } from './components/Auth/RoleBasedRoute';
import './styles/App.css';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clients" 
                element={
                  <ClientManagerRoute>
                    <ClientsPage />
                  </ClientManagerRoute>
                } 
              />
              <Route 
                path="/meetings" 
                element={
                  <ProtectedRoute>
                    <MeetingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/secrets" 
                element={
                  <ManagerRoute>
                    <SecretsPage />
                  </ManagerRoute>
                } 
              />
              <Route 
                path="/action-items" 
                element={
                  <ProtectedRoute>
                    <ActionItemsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/n8n-workflows" 
                element={
                  <ProtectedRoute>
                    <N8nWorkflowsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/n8n-workflows/:workflowId" 
                element={
                  <ProtectedRoute>
                    <WorkflowDetailsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rbac-test" 
                element={
                  <ProtectedRoute>
                    <RBACTest />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/login-test" 
                element={<LoginTest />} 
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;