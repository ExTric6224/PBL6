import React, { useState } from 'react';
import UserPermissionManager from './UserPermissionManager';
import RolePermissionManager from './RolePermissionManager';
import './PermissionDashboard.css';

type TabType = 'user' | 'role';

const PermissionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('user');

  return (
    <div className="permission-dashboard">
      <div className="dashboard-header">
        <h1>🔐 Permission Management System</h1>
        <p>Manage role-based access control for your application</p>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          <span className="tab-icon">👤</span>
          <span className="tab-text">User Permissions</span>
          <span className="tab-description">Grant/Revoke individual user permissions</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'role' ? 'active' : ''}`}
          onClick={() => setActiveTab('role')}
        >
          <span className="tab-icon">🎭</span>
          <span className="tab-text">Role Permissions</span>
          <span className="tab-description">Manage default permissions for roles</span>
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'user' && <UserPermissionManager />}
        {activeTab === 'role' && <RolePermissionManager />}
      </div>

      <div className="dashboard-footer">
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">ℹ️</div>
            <div className="info-content">
              <h4>About Permission System</h4>
              <p>
                This RBAC (Role-Based Access Control) system allows you to manage permissions
                at both the role level and individual user level. User-specific permissions
                override role defaults.
              </p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">📚</div>
            <div className="info-content">
              <h4>Key Concepts</h4>
              <ul>
                <li><strong>Grant:</strong> Give user a permission they don't have from role</li>
                <li><strong>Revoke:</strong> Deny user a permission they have from role</li>
                <li><strong>Remove Override:</strong> Return user to role default</li>
              </ul>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">⚡</div>
            <div className="info-content">
              <h4>Quick Tips</h4>
              <ul>
                <li>Role changes affect ALL users with that role</li>
                <li>User overrides only affect specific users</li>
                <li>Green = Granted, Red = Revoked, No color = Default</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionDashboard;
