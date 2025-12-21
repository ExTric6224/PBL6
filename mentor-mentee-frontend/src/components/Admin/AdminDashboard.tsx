import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './AdminDashboard.css';

interface Statistics {
  // Basic stats
  totalUsers: number;
  totalMentors: number;
  totalMentees: number;
  totalSessions: number;
  completedSessions: number;
  totalPosts: number;
  totalFeedbacks: number;
  totalBookings: number;
  totalSchedules: number;
  averageRating: number;
  
  // Analytics data
  ratingDistribution: Array<{ rating: number; count: number }>;
  topMentors: Array<{
    id: number;
    name: string;
    sessionCount: number;
    averageRating: number;
  }>;
  userGrowth: Array<{ date: string; count: number }>;
  sessionStats: {
    SCHEDULED: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  bookingStats: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
    CANCELLED: number;
  };
  recentUsers: Array<{
    id: number;
    email: string;
    role: string;
    createdAt: string;
  }>;
  recentActivities: Array<{
    type: string;
    status: string;
    mentor: string;
    mentee: string;
    createdAt: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/statistics`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Statistics response:', response.data);
      if (response.data?.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchStatistics();
  }, [user, navigate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatistics();
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Prepare chart data
  const sessionChartData = stats?.sessionStats ? [
    { name: 'Scheduled', value: stats.sessionStats.SCHEDULED, color: '#3b82f6' },
    { name: 'In Progress', value: stats.sessionStats.IN_PROGRESS, color: '#f59e0b' },
    { name: 'Completed', value: stats.sessionStats.COMPLETED, color: '#10b981' },
    { name: 'Cancelled', value: stats.sessionStats.CANCELLED, color: '#ef4444' },
  ] : [];

  const bookingChartData = stats?.bookingStats ? [
    { name: 'Pending', value: stats.bookingStats.PENDING, color: '#f59e0b' },
    { name: 'Approved', value: stats.bookingStats.APPROVED, color: '#10b981' },
    { name: 'Rejected', value: stats.bookingStats.REJECTED, color: '#ef4444' },
    { name: 'Cancelled', value: stats.bookingStats.CANCELLED, color: '#6b7280' },
  ] : [];

  const ratingChartData = stats?.ratingDistribution?.map(item => ({
    name: `${item.rating} ⭐`,
    count: item.count,
  })) || [];

  const completionRate = stats 
    ? ((stats.completedSessions / stats.totalSessions) * 100).toFixed(1)
    : 0;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Tổng quan hệ thống và phân tích dữ liệu</p>
        </div>
        <button 
          className={`btn-refresh ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-content">
            <h3>Tổng người dùng</h3>
            <div className="metric-value">{stats?.totalUsers || 0}</div>
            <div className="metric-detail">
              {stats?.totalMentors || 0} mentors • {stats?.totalMentees || 0} mentees
            </div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-content">
            <h3>Sessions</h3>
            <div className="metric-value">{stats?.totalSessions || 0}</div>
            <div className="metric-detail">
              {stats?.completedSessions || 0} hoàn thành ({completionRate}%)
            </div>
          </div>
        </div>

        {/* <div className="metric-card warning" onClick={() => navigate('/posts')} style={{cursor: 'pointer'}}>
          <div className="metric-content">
            <h3>Bookings</h3>
            <div className="metric-value">{stats?.totalBookings || 0}</div>
            <div className="metric-detail">
              {stats?.bookingStats?.APPROVED || 0} đã duyệt
            </div>
          </div>
        </div> */}

        <div className="metric-card info">
          <div className="metric-content">
            <h3>Đánh giá</h3>
            <div className="metric-value">{stats?.averageRating?.toFixed(1) || 0}</div>
            <div className="metric-detail">
              {stats?.totalFeedbacks || 0} feedbacks
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* User Growth Chart */}
        <div className="chart-card">
          <h3>Người dùng mới (7 ngày qua)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Người dùng mới"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Distribution */}
        <div className="chart-card">
          <h3>Phân bố đánh giá</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratingChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="Số lượng" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Session Status Pie Chart */}
        <div className="chart-card">
          <h3>Trạng thái Sessions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sessionChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: any) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sessionChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Pie Chart */}
        <div className="chart-card">
          <h3>Trạng thái Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookingChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: any) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {bookingChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Mentors Table */}
      <div className="data-section">
        <div className="data-card">
          <h3>Top Mentors</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên Mentor</th>
                  <th>Số Sessions</th>
                  <th>Đánh giá TB</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topMentors?.slice(0, 5).map((mentor, index) => (
                  <tr key={mentor.id}>
                    <td>{index + 1}</td>
                    <td>{mentor.name}</td>
                    <td>
                      <span className="badge badge-info">{mentor.sessionCount}</span>
                    </td>
                    <td>
                      <span className="badge badge-warning">
                        {mentor.averageRating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats?.topMentors || stats.topMentors.length === 0) && (
                  <tr>
                    <td colSpan={4} className="no-data">Chưa có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="data-card">
          <h3>Hoạt động gần đây</h3>
          <div className="activity-list">
            {stats?.recentActivities?.slice(0, 10).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-status status-${activity.status.toLowerCase()}`}>
                  {activity.status}
                </div>
                <div className="activity-content">
                  <p><strong>{activity.mentor}</strong> ↔ <strong>{activity.mentee}</strong></p>
                  <small>{new Date(activity.createdAt).toLocaleString('vi-VN')}</small>
                </div>
              </div>
            ))}
            {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
              <p className="no-data">Chưa có hoạt động nào</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
