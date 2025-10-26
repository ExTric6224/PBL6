import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <div>Loading...</div>;
  }

  const quickLinks = [
    { path: '/posts', icon: '📝', title: 'Posts', desc: 'Read and create posts' },
    { path: '/schedules', icon: '🗓️', title: 'Schedules', desc: user.role === 'MENTOR' ? 'Manage your availability' : 'Browse available mentors' },
    { path: '/bookings', icon: '📅', title: 'Bookings', desc: user.role === 'MENTOR' ? 'View booking requests' : 'Your booked sessions' },
    { path: '/feedback', icon: '⭐', title: 'Feedback', desc: 'View and give feedback' },
    { path: '/profile', icon: '👤', title: 'Profile', desc: 'Manage your profile' },
  ];

  if (user.role === 'ADMIN') {
    quickLinks.push({ path: '/admin/permissions', icon: '🔐', title: 'Permissions', desc: 'Manage system permissions' });
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Welcome Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        borderRadius: '16px', 
        padding: '40px', 
        marginBottom: '40px',
        color: 'white',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
      }}>
        <h1 style={{ margin: '0 0 12px 0', fontSize: '36px' }}>
          Welcome back, {user.email}! 👋
        </h1>
        <p style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>
          {user.role === 'MENTOR' && 'Share your knowledge and guide mentees to success'}
          {user.role === 'MENTEE' && 'Learn from experienced mentors and achieve your goals'}
          {user.role === 'ADMIN' && 'Manage the platform and ensure smooth operations'}
        </p>
        <div style={{ 
          display: 'inline-block', 
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '8px 20px',
          borderRadius: '20px',
          marginTop: '16px',
          fontSize: '16px',
          fontWeight: 'bold',
          backdropFilter: 'blur(10px)'
        }}>
          {user.role}
        </div>
      </div>

      {/* Quick Links Grid */}
      <h2 style={{ marginBottom: '24px', color: '#2d3748', fontSize: '24px' }}>Quick Access</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        {quickLinks.map((link) => (
          <div
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.borderColor = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{link.icon}</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '20px' }}>{link.title}</h3>
            <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>{link.desc}</p>
          </div>
        ))}
      </div>

      {/* User Info */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' }}>
        <h3 style={{ marginTop: 0, color: '#2d3748' }}>Account Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', color: '#718096', fontSize: '14px', fontWeight: 600 }}>USER ID</p>
            <p style={{ margin: 0, color: '#2d3748', fontSize: '16px', fontWeight: 600 }}>{user.id}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', color: '#718096', fontSize: '14px', fontWeight: 600 }}>EMAIL</p>
            <p style={{ margin: 0, color: '#2d3748', fontSize: '16px', fontWeight: 600 }}>{user.email}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', color: '#718096', fontSize: '14px', fontWeight: 600 }}>ROLE</p>
            <p style={{ margin: 0, color: '#2d3748', fontSize: '16px', fontWeight: 600 }}>{user.role}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', color: '#718096', fontSize: '14px', fontWeight: 600 }}>MEMBER SINCE</p>
            <p style={{ margin: 0, color: '#2d3748', fontSize: '16px', fontWeight: 600 }}>
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;