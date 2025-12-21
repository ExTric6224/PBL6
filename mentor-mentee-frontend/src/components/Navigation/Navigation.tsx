import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Navigation.css';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
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

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        setUnreadNotifications(response.data.count || 0);
      } catch (error) {
        console.error('Failed to fetch unread notifications:', error);
      }
    };

    if (user) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
        { path: '/admin', label: 'Trang Chủ' },
        { path: '/admin/users', label: 'Người Dùng' },
        { path: '/admin/posts', label: 'Bài Viết' },
        { path: '/admin/schedules', label: 'Lịch Trình' },
        { path: '/admin/bookings', label: 'Đặt Lịch' },
        { path: '/admin/sessions', label: 'Phiên Học' },
        { path: '/admin/feedbacks', label: 'Đánh Giá' },
        { path: '/admin/permissions', label: 'Phân Quyền' },
      ]
    : user.role === 'MENTOR'
    ? [
        { path: '/posts', label: 'Bài Viết' },
        { path: '/mentors', label: 'Chuyên gia' },
        { path: '/schedules', label: 'Lịch Trình' },
        { path: '/bookings', label: 'Đặt Lịch' },
        { path: '/sessions', label: 'Phiên Học' },
        { path: '/feedback', label: 'Đánh Giá' },
        { path: '/notifications', label: 'Thông Báo', hasBadge: true },
        { path: '/profile', label: 'Hồ Sơ' },
      ]
    : [
        { path: '/posts', label: 'Bài Viết' },
        { path: '/mentors', label: 'Mentor' },
        { path: '/schedules', label: 'Lịch Trình' },
        { path: '/bookings', label: 'Đặt Lịch' },
        { path: '/sessions', label: 'Phiên Học' },
        { path: '/feedback', label: 'Đánh Giá' },
        { path: '/notifications', label: 'Thông Báo', hasBadge: true },
        { path: '/profile', label: 'Hồ Sơ' },
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
                  {item.hasBadge && unreadNotifications > 0 && (
                    <span className="nav-badge">{unreadNotifications}</span>
                  )}
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
                <span>Đổi mật khẩu</span>
              </button>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <span className="item-icon">🚪</span>
                <span>Đăng xuất</span>
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
                  {item.hasBadge && unreadNotifications > 0 && (
                    <span className="mobile-nav-badge">{unreadNotifications}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <button className="mobile-logout-btn" onClick={handleLogout}>
            <span className="logout-text">Đăng xuất</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;