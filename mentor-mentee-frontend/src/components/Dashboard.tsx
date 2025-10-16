import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '24px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Dashboard</h1>
          <button 
            onClick={handleLogout}
            style={{
              background: '#e53e3e',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h2>Welcome, {user.email}!</h2>
          <div style={{ 
            display: 'inline-block', 
            background: user.role === 'MENTOR' ? '#48bb78' : '#4299e1',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {user.role}
          </div>
        </div>

        <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '6px' }}>
          <h3>User Information</h3>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        {user.role === 'MENTOR' && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#e6fffa', borderRadius: '6px' }}>
            <h3>Mentor Features</h3>
            <p>• Create and manage schedules</p>
            <p>• Accept mentee bookings</p>
            <p>• Conduct mentoring sessions</p>
          </div>
        )}

        {user.role === 'MENTEE' && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#ebf8ff', borderRadius: '6px' }}>
            <h3>Mentee Features</h3>
            <p>• Browse available mentors</p>
            <p>• Book mentoring sessions</p>
            <p>• Provide feedback after sessions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;