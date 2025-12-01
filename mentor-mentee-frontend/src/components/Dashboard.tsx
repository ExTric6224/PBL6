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

  const quickLinks = [
    { 
      path: '/posts', 
      title: 'Posts', 
      desc: 'Read and create posts'
    },
    { 
      path: '/schedules', 
      title: 'Schedules', 
      desc: user.role === 'MENTOR' ? 'Manage your availability' : 'Browse available mentors'
    },
    { 
      path: '/bookings', 
      title: 'Bookings', 
      desc: user.role === 'MENTOR' ? 'View booking requests' : 'Your booked sessions'
    },
    { 
      path: '/feedback', 
      title: 'Feedback', 
      desc: 'View and give feedback'
    },
    { 
      path: '/profile', 
      title: 'Profile', 
      desc: 'Manage your profile'
    },
  ];

  if (user.role === 'ADMIN') {
    quickLinks.push({ 
      path: '/admin/permissions', 
      title: 'Permissions', 
      desc: 'Manage system permissions'
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
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Welcome back, <span className="user-name">{getUserDisplayName()}</span></h1>
            <p className="header-subtitle">{getRoleDescription()}</p>
          </div>
          <div className="header-right">
            <div className="user-badge">{user.role}</div>
            <div className="user-status">
              <div className="status-dot"></div>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-header">
                <span className="stat-label" data-label={stat.label}>
                  {stat.label}
                </span>
                <span className={`stat-change ${stat.trend}`}>
                  {stat.change}
                </span>
              </div>
              <div className="stat-value">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        {/* Navigation Cards */}
        <div className="navigation-section">
          <h2 className="section-title" data-title="Navigation">Navigation</h2>
          <div className="nav-grid">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                className="nav-card"
                data-path={link.path}
                onClick={() => navigate(link.path)}
              >
                <h3>{link.title}</h3>
                <p>{link.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Info Grid */}
        <div className="info-grid">
          {/* Account Details */}
          <div className="info-section">
            <h2 className="section-title" data-title="Account Details">Account Details</h2>
            <div className="detail-list">
              <div className="detail-item">
                <span className="detail-label" data-label="User ID">User ID</span>
                <span className="detail-value">{user.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label" data-label="Email">Email</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label" data-label="Role">Role</span>
                <span className="detail-value detail-role">{user.role}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label" data-label="Member Since">Member Since</span>
                <span className="detail-value">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="info-section">
            <h2 className="section-title" data-title="Recent Activity">Recent Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-time">2h ago</div>
                <div className="activity-text">New booking request received</div>
              </div>
              <div className="activity-item">
                <div className="activity-time">5h ago</div>
                <div className="activity-text">Someone commented on your post</div>
              </div>
              <div className="activity-item">
                <div className="activity-time">1d ago</div>
                <div className="activity-text">You received a 5-star rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;