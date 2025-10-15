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
import ProtectedRoute from './components/Auth/ProtectedRoute/ProtectedRoute';
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
                  <ProtectedRoute>
                    <ClientsPage />
                  </ProtectedRoute>
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
                  <ProtectedRoute>
                    <SecretsPage />
                  </ProtectedRoute>
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
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;