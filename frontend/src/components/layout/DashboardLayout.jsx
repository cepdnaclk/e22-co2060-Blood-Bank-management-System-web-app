import React, { useState } from 'react';
import { Menu, X, Home } from 'lucide-react';
import { useAuth } from '../../context/auth/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/dashboard.css';

const DashboardLayout = ({ 
  title, 
  subtitle, 
  brandLabel, 
  menuItems, 
  activeTab, 
  onTabChange, 
  children,
  headerActions
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else if (onTabChange && item.id) {
      onTabChange(item.id);
    }
    setIsMobileOpen(false);
  };

  const checkIsActive = (item) => {
    if (activeTab && item.id) {
      return activeTab === item.id;
    }
    if (item.path) {
      const currentPath = location.pathname + location.search;
      return currentPath === item.path || (item.path === '/admin' && location.pathname === '/admin' && !location.search);
    }
    return false;
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-title">
            <span className="text-primary">HopeDrop</span>
          </div>
          <button type="button" className="mobile-toggle" onClick={() => setIsMobileOpen(false)} aria-label="Close sidebar">
            <X size={24} />
          </button>
        </div>
        
        <div className="dashboard-brand-box">
          <span className="brand-subtitle">{brandLabel}</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => (
            <button
              type="button"
              key={item.id || idx}
              className={`nav-item ${checkIsActive(item) ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="nav-item dashboard-logout-button" onClick={handleLogout}>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <button type="button" className="mobile-toggle" onClick={() => setIsMobileOpen(true)} aria-label="Open sidebar">
              <Menu size={24} />
            </button>
            <div>
              <h1 className="dashboard-page-title">{title}</h1>
              {subtitle && <p className="dashboard-page-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="topbar-actions">
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="dashboard-home-button"
              title="Back to Landing Page"
            >
              <Home size={16} /> <span>Home</span>
            </button>
            {headerActions}
          </div>
        </header>

        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
