import React, { useState, useEffect } from 'react';
import { Menu, X, Bell, Moon, Sun } from 'lucide-react';
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') setIsDarkMode(true);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

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
          <button className="mobile-toggle" onClick={() => setIsMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
          <span className="brand-subtitle">{brandLabel}</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => (
            <button
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
          <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--color-critical)' }}>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="mobile-toggle" onClick={() => setIsMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>{title}</h1>
              {subtitle && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>{subtitle}</p>}
            </div>
          </div>

          <div className="topbar-actions">
            <button 
              onClick={toggleDarkMode}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)' }}
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
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
