import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navigation.css';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const handleChangePassword = () => {
    navigate('/change-password');
    setUserMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigation chỉ render trong protected routes, nên luôn có user
  if (!user) return null; // Fallback safety check

  // Admin có các tab quản lý riêng
  const navItems = user.role === 'ADMIN' 
    ? [
        { path: '/admin', label: '🛡️ Dashboard' },
        { path: '/admin/users', label: '👥 Users' },
        { path: '/posts', label: '📝 Posts' },
        { path: '/admin/permissions', label: '🔐 Permissions' },
      ]
    : [
        { path: '/posts', label: 'Posts' },
        { path: '/schedules', label: 'Schedules' },
        { path: '/bookings', label: 'Bookings' },
        { path: '/sessions', label: 'Sessions' },
        { path: '/feedback', label: 'Feedback' },
        { path: '/profile', label: 'Profile' },
      ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Brand Section */}
        <Link 
          to="/dashboard" 
          className={`nav-brand ${isActive('/dashboard')}`}
          onClick={closeMobileMenu}
        >
          <span className="brand-text">Menterify</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-main">
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`nav-link ${isActive(item.path)}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* User Section */}
        <div className="nav-user" ref={userMenuRef}>
          <div 
            className="user-info"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="user-avatar">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-email">{user.email}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <span className="dropdown-arrow">{userMenuOpen ? '▲' : '▼'}</span>
          </div>

          {/* User Dropdown Menu */}
          {userMenuOpen && (
            <div className="user-dropdown">
              <button className="dropdown-item" onClick={handleChangePassword}>
                <span className="item-icon">🔑</span>
                <span>Change Password</span>
              </button>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <span className="item-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="menu-icon">{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-content">
          <div className="mobile-user-info">
            <div className="user-avatar">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-email">{user.email}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>

          <ul className="mobile-nav-links">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`mobile-nav-link ${isActive(item.path)}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <button className="mobile-logout-btn" onClick={handleLogout}>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;