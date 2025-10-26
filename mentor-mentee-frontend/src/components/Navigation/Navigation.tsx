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

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-brand">
          🎓 Mentor-Mentee
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✖' : '☰'}
        </button>

        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <li>
            <Link to="/dashboard" className={isActive('/dashboard')} onClick={closeMobileMenu}>
              🏠 Dashboard
            </Link>
          </li>
          <li>
            <Link to="/posts" className={isActive('/posts')} onClick={closeMobileMenu}>
              📝 Posts
            </Link>
          </li>
          <li>
            <Link to="/schedules" className={isActive('/schedules')} onClick={closeMobileMenu}>
              🗓️ Schedules
            </Link>
          </li>
          <li>
            <Link to="/bookings" className={isActive('/bookings')} onClick={closeMobileMenu}>
              📅 Bookings
            </Link>
          </li>
          <li>
            <Link to="/feedback" className={isActive('/feedback')} onClick={closeMobileMenu}>
              ⭐ Feedback
            </Link>
          </li>
          <li>
            <Link to="/profile" className={isActive('/profile')} onClick={closeMobileMenu}>
              👤 Profile
            </Link>
          </li>
          {user.role === 'ADMIN' && (
            <li>
              <Link to="/admin/permissions" className={isActive('/admin/permissions')} onClick={closeMobileMenu}>
                🔐 Permissions
              </Link>
            </li>
          )}

          <div className="user-info">
            <span className="user-email">{user.email}</span>
            <span className="user-role">{user.role}</span>
          </div>

          <li>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
