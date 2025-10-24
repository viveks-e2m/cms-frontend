import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(false);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileMenu = () => {
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        isMobileOpen={mobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;