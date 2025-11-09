import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Get user's display name from profile or email
  const getUserDisplayName = () => {
    if (user.mentorProfile?.fullName) {
      return user.mentorProfile.fullName;
    }
    if (user.menteeProfile?.fullName) {
      return user.menteeProfile.fullName;
    }
    // Fallback to email username (part before @)
    return user.email.split('@')[0];
  };

  const getRoleDescription = () => {
    switch (user.role) {
      case 'MENTOR':
        return 'Share your knowledge and guide mentees to success';
      case 'MENTEE':
        return 'Learn from experienced mentors and achieve your goals';
      case 'ADMIN':
        return 'Manage the platform and ensure smooth operations';
      default:
        return 'Welcome to your dashboard';
    }
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'MENTOR': return '👨‍🏫';
      case 'MENTEE': return '👩‍🎓';
      case 'ADMIN': return '⚡';
      default: return '👤';
    }
  };

  const quickLinks = [
    { 
      path: '/posts', 
      icon: '📝', 
      title: 'Posts', 
      desc: 'Read and create posts',
      color: '#667eea'
    },
    { 
      path: '/schedules', 
      icon: '🗓️', 
      title: 'Schedules', 
      desc: user.role === 'MENTOR' ? 'Manage your availability' : 'Browse available mentors',
      color: '#764ba2'
    },
    { 
      path: '/bookings', 
      icon: '📅', 
      title: 'Bookings', 
      desc: user.role === 'MENTOR' ? 'View booking requests' : 'Your booked sessions',
      color: '#f093fb'
    },
    { 
      path: '/feedback', 
      icon: '⭐', 
      title: 'Feedback', 
      desc: 'View and give feedback',
      color: '#f5576c'
    },
    { 
      path: '/profile', 
      icon: '👤', 
      title: 'Profile', 
      desc: 'Manage your profile',
      color: '#4facfe'
    },
  ];

  if (user.role === 'ADMIN') {
    quickLinks.push({ 
      path: '/admin/permissions', 
      icon: '🔐', 
      title: 'Permissions', 
      desc: 'Manage system permissions',
      color: '#43e97b'
    });
  }

  const stats = [
    { label: 'Sessions Completed', value: '12', change: '+2', trend: 'up' },
    { label: 'Rating', value: '4.8', change: '+0.2', trend: 'up' },
    { label: 'Active Posts', value: '5', change: '0', trend: 'neutral' },
    { label: 'Upcoming', value: '3', change: '+1', trend: 'up' },
  ];

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <div className="welcome-text">
            <h1>
              Welcome back, <span className="highlight">{getUserDisplayName()}</span>! {getRoleIcon()}
            </h1>
            <p>{getRoleDescription()}</p>
          </div>
          <div className="role-badge">
            {user.role}
          </div>
        </div>
        <div className="welcome-graphics">
          <div className="graphic-circle circle-1"></div>
          <div className="graphic-circle circle-2"></div>
          <div className="graphic-circle circle-3"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-section">
        <h2>Your Overview</h2>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon">
                {['📊', '⭐', '📝', '🕒'][index]}
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
                <span className={`stat-change ${stat.trend}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="quick-links-section">
        <h2>Quick Access</h2>
        <div className="quick-links-grid">
          {quickLinks.map((link) => (
            <div
              key={link.path}
              className="quick-link-card"
              onClick={() => navigate(link.path)}
              style={{ '--card-color': link.color } as React.CSSProperties}
            >
              <div className="card-icon" style={{ background: link.color }}>
                {link.icon}
              </div>
              <div className="card-content">
                <h3>{link.title}</h3>
                <p>{link.desc}</p>
              </div>
              <div className="card-arrow">
                →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Info */}
      <div className="user-info-section">
        <div className="user-info-header">
          <h3>Account Information</h3>
          <div className="status-indicator">
            <div className="status-dot"></div>
            Active
          </div>
        </div>
        <div className="user-info-grid">
          <div className="info-item">
            <div className="info-label">
              <span className="info-icon">🆔</span>
              USER ID
            </div>
            <div className="info-value">{user.id}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <span className="info-icon">📧</span>
              EMAIL
            </div>
            <div className="info-value">{user.email}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <span className="info-icon">🎯</span>
              ROLE
            </div>
            <div className="info-value role-value">{user.role}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <span className="info-icon">📅</span>
              MEMBER SINCE
            </div>
            <div className="info-value">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">📅</div>
            <div className="activity-content">
              <p>New booking request received</p>
              <span>2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">💬</div>
            <div className="activity-content">
              <p>Someone commented on your post</p>
              <span>5 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">⭐</div>
            <div className="activity-content">
              <p>You received a 5-star rating</p>
              <span>1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;