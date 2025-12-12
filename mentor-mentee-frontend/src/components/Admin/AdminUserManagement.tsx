import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminUserManagement.css';

interface User {
  id: number;
  email: string;
  role: string;
  roleId: number | null;
  createdAt: string;
  mentorprofile?: {
    fullName: string;
  };
  menteeprofile?: {
    fullName: string;
  };
}

const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Failed to load users. You may not have permission.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`Are you sure you want to delete user: ${email}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${process.env.REACT_APP_API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User deleted successfully');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mentorprofile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.menteeprofile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="admin-users-container"><div className="loading">Loading users...</div></div>;
  }

  return (
    <div className="admin-users-container">
      <div className="users-header">
        <button className="btn-back" onClick={() => navigate('/admin')}>
          ← Back to Dashboard
        </button>
        <h1>👥 User Management</h1>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterRole === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterRole('ALL')}
          >
            All ({users.length})
          </button>
          <button
            className={`filter-btn ${filterRole === 'MENTOR' ? 'active' : ''}`}
            onClick={() => setFilterRole('MENTOR')}
          >
            Mentors ({users.filter(u => u.role === 'MENTOR').length})
          </button>
          <button
            className={`filter-btn ${filterRole === 'MENTEE' ? 'active' : ''}`}
            onClick={() => setFilterRole('MENTEE')}
          >
            Mentees ({users.filter(u => u.role === 'MENTEE').length})
          </button>
          <button
            className={`filter-btn ${filterRole === 'ADMIN' ? 'active' : ''}`}
            onClick={() => setFilterRole('ADMIN')}
          >
            Admins ({users.filter(u => u.role === 'ADMIN').length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">No users found</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.mentorprofile?.fullName || 
                     user.menteeprofile?.fullName || 
                     'N/A'}
                  </td>
                  <td>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => navigate(`/profile/${user.id}`)}
                      >
                        View
                      </button>
                      <button
                        className="btn-permissions"
                        onClick={() => navigate(`/admin/users/${user.id}/permissions`)}
                      >
                        Permissions
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="summary">
        <p>Showing {filteredUsers.length} of {users.length} users</p>
      </div>
    </div>
  );
};

export default AdminUserManagement;
