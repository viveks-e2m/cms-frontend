import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccountTree as WorkflowIcon,
} from "@mui/icons-material";
import "./Sidebar.css";

const Sidebar = ({ isCollapsed, onToggle, isMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: "dashboard",
      icon: <DashboardIcon />,
      label: "Dashboard",
      path: "/dashboard",
      description: "Overview and analytics",
    },
    {
      id: "clients",
      icon: <PeopleIcon />,
      label: "Manage Clients",
      path: "/clients",
      description: "Client management and assignments",
    },
    {
      id: "n8n-workflows",
      icon: <WorkflowIcon />,
      label: "n8n Workflows",
      path: "/n8n-workflows",
      description: "Workflow automation and executions",
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
        isMobileOpen ? "mobile-open" : ""
      }`}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <BusinessIcon />
          </div>
          {!isCollapsed && (
            <div className="logo-text">
              <h2>CMS Portal</h2>
              <p>Management System</p>
            </div>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                onClick={() => handleNavigation(item.path)}
                title={isCollapsed ? item.label : ""}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && (
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.name
              ? user.name.charAt(0).toUpperCase()
              : user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name">
                {user?.name || user?.email?.split("@")[0] || "User"}
              </div>
              <div className="user-email">{user?.email}</div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="sidebar-actions">
            <button
              className="sidebar-settings-btn"
              onClick={() => navigate("/settings")}
              title="Settings"
            >
              <SettingsIcon className="sidebar-btn-icon" /> Settings
            </button>
            <button
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogoutIcon className="sidebar-btn-icon" /> Logout
            </button>
          </div>
        )}

        {isCollapsed && (
          <div className="sidebar-actions-collapsed">
            <button
              className="sidebar-settings-icon-btn"
              onClick={() => navigate("/settings")}
              title="Settings"
            >
              <SettingsIcon />
            </button>
            <button
              className="sidebar-logout-icon-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogoutIcon />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
