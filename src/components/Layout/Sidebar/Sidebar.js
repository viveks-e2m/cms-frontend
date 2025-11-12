import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { PERMISSIONS } from "../../../constants/permissions";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccountTree as WorkflowIcon,
  Assignment as ActionItemsIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import "./Sidebar.css";

const Sidebar = ({ isCollapsed, onToggle, isMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout, hasPermission } = useAuth();

  const menuItems = [
    {
      id: "dashboard",
      icon: <DashboardIcon />,
      label: "Dashboard",
      path: "/dashboard",
      description: "Overview and analytics",
      show: true, // Always show dashboard
    },
    {
      id: "clients",
      icon: <PeopleIcon />,
      label: "Manage Clients",
      path: "/clients",
      description: "Client management and assignments",
      permissions: [PERMISSIONS.READ_CLIENT],
      // roles: ["admin","ai_executor", "account_manager"],
    },
    {
      id: "action-items",
      icon: <ActionItemsIcon />,
      label: "Action Items",
      path: "/action-items",
      description: "All action items across meetings",
      permissions: [PERMISSIONS.READ_TASK],
      // roles: ["admin", "account_manager", "ai_intern"],
    },
    {
      id: "n8n-workflows",
      icon: <WorkflowIcon />,
      label: "n8n Workflows",
      path: "/n8n-workflows",
      description: "Coming soon - Workflow automation and executions",
      permissions: [PERMISSIONS.READ_WORKFLOW],
      // roles: ["admin", "ai_intern"],
    },
    {
      id: "admin",
      icon: <AdminIcon />,
      label: "Admin Panel",
      path: "/admin",
      description: "User and role management",
      roles: ["admin"], // Only show to admin role, not account_manager
    },
  ];



  // Filter menu items based on user permissions and roles
  const visibleMenuItems = menuItems.filter((item) => {
    // Show all items if role is not loaded (for debugging)
    if (!role) {
      return true;
    }

    if (item.show) {
      return true;
    }

    if (item.roles && item.roles.length > 0) {
      return item.roles.includes(role?.name);
    }

    if (item.permissions && item.permissions.length > 0) {
      return item.permissions.some((permission) =>
        hasPermission(permission)
      );
    }

    return false;
  });

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
          {visibleMenuItems.map((item) => (
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
        <div className="sidebar-user-profile">
          <div className="sidebar-user-avatar">
            {user?.name
              ? user.name.charAt(0).toUpperCase()
              : user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.first_name ||
                  user?.full_name ||
                  user?.email?.split("@")[0] ||
                  "User"}
              </div>
              <div className="sidebar-user-email">{user?.email}</div>
              {role && (
                <div className="sidebar-user-role">
                  {role.display_name || role.name}
                </div>
              )}
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="sidebar-actions">
            <button
              className="sidebar-settings-btn"
              onClick={() => navigate("/profile")}
              title="Profile"
            >
              <SettingsIcon className="sidebar-btn-icon" /> Profile
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
              onClick={() => navigate("/profile")}
              title="Profile"
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
