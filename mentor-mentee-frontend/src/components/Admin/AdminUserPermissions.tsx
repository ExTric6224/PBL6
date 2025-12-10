import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminUserPermissions.css';

interface Permission {
  id: number;
  code: string;
  name: string;
  resource: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface UserData {
  id: number;
  email: string;
  role: string;
  roleId: number | null;
  roleData?: Role;
  mentorprofile?: {
    fullName: string;
  };
  menteeprofile?: {
    fullName: string;
  };
}

interface EffectivePermissions {
  userId: number;
  rolePermissions: Permission[];
  directPermissions: Permission[];
  effectivePermissions: Permission[];
}

const AdminUserPermissions: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [permissions, setPermissions] = useState<EffectivePermissions | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [revokedPermissions, setRevokedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadUserPermissions();
      loadAllPermissions();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load user');
    }
  };

  const loadUserPermissions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/permissions/users/${userId}/permissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data.data;
      
      // Transform userPermissions array to match directPermissions structure
      const directPerms = data.userPermissions?.map((up: any) => up.permission || up) || [];
      
      // Separate granted and revoked permissions
      const granted: string[] = [];
      const revoked: string[] = [];
      
      data.userPermissions?.forEach((up: any) => {
        const perm = up.permission || up;
        if (up.isGranted === false) {
          revoked.push(perm.code);
        } else if (up.isGranted === true) {
          granted.push(perm.code);
        }
      });
      
      setPermissions({
        userId: data.userId,
        rolePermissions: data.rolePermissions || [],
        directPermissions: directPerms,
        effectivePermissions: data.effectivePermissions || []
      });
      
      setSelectedPermissions(granted);
      setRevokedPermissions(revoked);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadAllPermissions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/permissions/permissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Flatten grouped permissions
      const grouped = response.data.data;
      const flat = Object.values(grouped).flat() as Permission[];
      setAllPermissions(flat);
    } catch (err: any) {
      console.error('Failed to load all permissions:', err);
    }
  };

  const handleTogglePermission = (permissionCode: string, isFromRole: boolean = false) => {
    if (isFromRole) {
      // Toggle revoked state for role permissions
      setRevokedPermissions(prev => 
        prev.includes(permissionCode)
          ? prev.filter(p => p !== permissionCode)
          : [...prev, permissionCode]
      );
    } else {
      // Toggle granted state for non-role permissions
      setSelectedPermissions(prev => 
        prev.includes(permissionCode)
          ? prev.filter(p => p !== permissionCode)
          : [...prev, permissionCode]
      );
    }
  };

  const handleSavePermissions = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      
      // Only send overrides (permissions that differ from role defaults)
      const permissionUpdates = [];
      
      // Add direct grants (permissions not from role but user has them)
      for (const code of selectedPermissions) {
        const isFromRole = permissions?.rolePermissions.some(rp => rp.code === code);
        if (!isFromRole) {
          permissionUpdates.push({ code, isGranted: true });
        }
      }
      
      // Add revokes (permissions from role but user doesn't want them)
      for (const code of revokedPermissions) {
        permissionUpdates.push({ code, isGranted: false });
      }

      // Send to backend
      await axios.put(
        `${process.env.REACT_APP_API_URL}/permissions/users/${userId}/permissions/bulk`,
        { permissions: permissionUpdates },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Permissions updated successfully! ✅');
      loadUserPermissions();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const groupPermissionsByResource = () => {
    const grouped: Record<string, Permission[]> = {};
    allPermissions.forEach(perm => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });
    return grouped;
  };

  const userName = user?.mentorprofile?.fullName || user?.menteeprofile?.fullName || user?.email || 'User';

  if (loading && !user) {
    return (
      <div className="admin-user-permissions-container">
        <div className="loading">Loading user permissions...</div>
      </div>
    );
  }

  return (
    <div className="admin-user-permissions-container">
      <div className="permissions-header">
        <button className="btn-back" onClick={() => navigate('/admin/users')}>
          ← Back to Users
        </button>
        <div className="header-info">
          <h1>🔐 User Permissions</h1>
          <div className="user-info-card">
            <p><strong>User:</strong> {userName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> <span className={`role-badge role-${user?.role.toLowerCase()}`}>{user?.role}</span></p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')}>✖</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="icon">✓</span>
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>✖</button>
        </div>
      )}

      {/* Current Permissions Summary */}
      {permissions && (
        <div className="permissions-summary">
          <div className="summary-card">
            <h3>📋 Role Permissions</h3>
            <p className="count">{permissions.rolePermissions.length}</p>
            <p className="desc">From {user?.role} role</p>
          </div>
          <div className="summary-card">
            <h3>⭐ Direct Permissions</h3>
            <p className="count">{permissions.directPermissions.length}</p>
            <p className="desc">User-specific</p>
          </div>
          <div className="summary-card">
            <h3>✅ Total Effective</h3>
            <p className="count">{permissions.effectivePermissions.length}</p>
            <p className="desc">Combined permissions</p>
          </div>
        </div>
      )}

      {/* Permission Editor */}
      <div className="permissions-editor">
        <div className="editor-header">
          <h2>Edit Direct Permissions</h2>
          <button 
            className="btn-save"
            onClick={handleSavePermissions}
            disabled={loading}
          >
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>

        <div className="permissions-groups">
          {Object.entries(groupPermissionsByResource()).map(([resource, perms]) => (
            <div key={resource} className="permission-group">
              <h3 className="resource-title">
                {resource.charAt(0).toUpperCase() + resource.slice(1)}
              </h3>
              <div className="permissions-list">
                {perms.map(perm => {
                  const isFromRole = permissions?.rolePermissions.some(rp => rp.code === perm.code);
                  const isDirect = selectedPermissions.includes(perm.code);
                  const isRevoked = revokedPermissions.includes(perm.code);
                  const isActive = isFromRole ? !isRevoked : isDirect;
                  
                  return (
                    <div key={perm.id} className={`permission-item ${isFromRole ? 'from-role' : ''} ${isRevoked ? 'revoked' : ''}`}>
                      <label>
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => handleTogglePermission(perm.code, isFromRole)}
                          disabled={loading}
                        />
                        <div className="permission-info">
                          <span className="permission-name">{perm.name}</span>
                          <span className="permission-code">{perm.code}</span>
                          {perm.description && (
                            <span className="permission-desc">{perm.description}</span>
                          )}
                        </div>
                        {isFromRole && (
                          <span className="role-badge-small" title={`Inherited from ${user?.role} role`}>
                            From Role
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Effective Permissions View */}
      {permissions && permissions.effectivePermissions.length > 0 && (
        <div className="effective-permissions">
          <h2>✅ All Effective Permissions ({permissions.effectivePermissions.length})</h2>
          <div className="permissions-grid">
            {permissions.effectivePermissions.map((perm, index) => (
              <div key={perm.code || perm.id || index} className="permission-tag">
                {perm.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserPermissions;
