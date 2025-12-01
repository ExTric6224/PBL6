import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navigation.css';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigation chỉ render trong protected routes, nên luôn có user
  if (!user) return null; // Fallback safety check

  const navItems = [
    { path: '/posts', label: 'Posts' },
    { path: '/schedules', label: 'Schedules' },
    { path: '/bookings', label: 'Bookings' },
    { path: '/sessions', label: 'Sessions' },
    { path: '/feedback', label: 'Feedback' },
    { path: '/profile', label: 'Profile' },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ path: '/admin/permissions', label: 'Permissions' });
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Brand Section */}
        <Link 
          to="/dashboard" 
          className={`nav-brand ${isActive('/dashboard')}`}
          onClick={closeMobileMenu}
        >
          <span className="brand-text">MenteeMentor</span>
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
        <div className="nav-user">
          <div className="user-info">
            <div className="user-avatar">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-email">{user.email}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-text">Logout</span>
          </button>
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