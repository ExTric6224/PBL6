import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './AdminDashboard.css';

interface Statistics {
  totalUsers: number;
  totalMentors: number;
  totalMentees: number;
  totalSessions: number;
  completedSessions: number;
  totalPosts: number;
  totalFeedbacks: number;
  averageRating: number;
  recentUsers: Array<{
    id: number;
    email: string;
    role: string;
    createdAt: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    loadStatistics();
  }, [user, navigate]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/statistics`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      // Use mock data as fallback
      setStats({
        totalUsers: 0,
        totalMentors: 0,
        totalMentees: 0,
        totalSessions: 0,
        completedSessions: 0,
        totalPosts: 0,
        totalFeedbacks: 0,
        averageRating: 0,
        recentUsers: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p className="subtitle">System Overview & Management</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats?.totalUsers || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <div className="stat-label">Mentors</div>
            <div className="stat-value">{stats?.totalMentors || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-content">
            <div className="stat-label">Mentees</div>
            <div className="stat-value">{stats?.totalMentees || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-label">Sessions</div>
            <div className="stat-value">{stats?.totalSessions || 0}</div>
            <div className="stat-detail">
              {stats?.completedSessions || 0} completed
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-label">Posts</div>
            <div className="stat-value">{stats?.totalPosts || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-label">Feedbacks</div>
            <div className="stat-value">{stats?.totalFeedbacks || 0}</div>
            <div className="stat-detail">
              Avg: {stats?.averageRating || 0}/5
            </div>
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div className="management-grid">
        <div className="management-card" onClick={() => navigate('/admin/users')}>
          <div className="card-icon">👥</div>
          <h3>User Management</h3>
          <p>Manage users, roles, and permissions</p>
          <button className="btn-manage">Manage Users →</button>
        </div>

        <div className="management-card" onClick={() => navigate('/admin/posts')}>
          <div className="card-icon">📝</div>
          <h3>Post Management</h3>
          <p>View, moderate, and delete all posts</p>
          <button className="btn-manage">Manage Posts →</button>
        </div>

        <div className="management-card" onClick={() => navigate('/admin/bookings')}>
          <div className="card-icon">📅</div>
          <h3>Booking Management</h3>
          <p>View, monitor, and manage all bookings</p>
          <button className="btn-manage">Manage Bookings →</button>
        </div>

        <div className="management-card" onClick={() => navigate('/admin/permissions')}>
          <div className="card-icon">🔐</div>
          <h3>Permissions</h3>
          <p>Manage roles and permissions</p>
          <button className="btn-manage">Manage Permissions →</button>
        </div>
      </div>

      {/* System Actions */}
      <div className="system-actions">
        <h2>🔧 System Actions</h2>
        <div className="action-buttons">
          <button className="btn-action" onClick={() => window.location.reload()}>
            🔄 Refresh Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
