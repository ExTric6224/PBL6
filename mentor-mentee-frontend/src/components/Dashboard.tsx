import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-message">Đang tải...</div>
      </div>
    );
  }

  // Admin sẽ được redirect, không hiển thị dashboard này
  if (user.role === 'ADMIN') {
    return (
      <div className="dashboard-loading">
        <div className="loading-message">Đang tải...</div>
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
        return 'Chia sẻ kiến thức và hướng dẫn mentee đạt thành công';
      case 'MENTEE':
        return 'Học hỏi từ các mentor giàu kinh nghiệm và đạt được mục tiêu';
      default:
        return 'Chào mừng đến với bảng điều khiển';
    }
  };

  const quickLinks = [
    { 
      path: '/posts', 
      title: 'Bài viết', 
      desc: 'Đọc và tạo bài viết'
    },
    { 
      path: '/schedules', 
      title: 'Lịch trình', 
      desc: user.role === 'MENTOR' ? 'Quản lý thời gian của bạn' : 'Xem mentor có sẵn'
    },
    { 
      path: '/bookings', 
      title: 'Đặt lịch', 
      desc: user.role === 'MENTOR' ? 'Xem yêu cầu đặt lịch' : 'Buổi học đã đặt'
    },
    { 
      path: '/feedback', 
      title: 'Đánh giá', 
      desc: 'Xem và gửi đánh giá'
    },
    { 
      path: '/profile', 
      title: 'Hồ sơ', 
      desc: 'Quản lý hồ sơ của bạn'
    },
  ];

  const stats = [
    { label: 'Buổi học hoàn thành', value: '12', change: '+2', trend: 'up' },
    { label: 'Đánh giá', value: '4.8', change: '+0.2', trend: 'up' },
    { label: 'Bài viết hoạt động', value: '5', change: '0', trend: 'neutral' },
    { label: 'Sắp tới', value: '3', change: '+1', trend: 'up' },
  ];

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Chào mừng trở lại, <span className="user-name">{getUserDisplayName()}</span></h1>
            <p className="header-subtitle">{getRoleDescription()}</p>
          </div>
          <div className="header-right">
            <div className="user-badge">{user.role}</div>
            <div className="user-status">
              <div className="status-dot"></div>
              <span>Đang hoạt động</span>
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
          <h2 className="section-title" data-title="Navigation">Điều hướng</h2>
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
            <h2 className="section-title" data-title="Account Details">Thông tin tài khoản</h2>
            <div className="detail-list">
              <div className="detail-item">
                <span className="detail-label" data-label="User ID">Mã người dùng</span>
                <span className="detail-value">{user.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label" data-label="Email">Email</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label" data-label="Role">Vai trò</span>
                <span className="detail-value detail-role">{user.role}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label" data-label="Member Since">Thành viên từ</span>
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
            <h2 className="section-title" data-title="Recent Activity">Hoạt động gần đây</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-time">2 giờ trước</div>
                <div className="activity-text">Nhận được yêu cầu đặt lịch mới</div>
              </div>
              <div className="activity-item">
                <div className="activity-time">5 giờ trước</div>
                <div className="activity-text">Có người đã bình luận bài viết của bạn</div>
              </div>
              <div className="activity-item">
                <div className="activity-time">1 ngày trước</div>
                <div className="activity-text">Bạn nhận được đánh giá 5 sao</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;