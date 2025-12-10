import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminPermissionManagement.css';

interface Permission {
  id: number;
  code: string;
  resource: string;
  action: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  userCount: number;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

const AdminPermissionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const [rolesResponse, permissionsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/permissions/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/permissions/permissions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setRoles(rolesResponse.data.data.roles || []);
      setPermissions(permissionsResponse.data.data.permissions || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load permissions data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const handlePermissionToggle = (permissionId: number) => {
    if (!selectedRole) return;

    const hasPermission = selectedRole.permissions.some(p => p.id === permissionId);
    const permission = permissions.find(p => p.id === permissionId);

    if (!permission) return;

    setSelectedRole({
      ...selectedRole,
      permissions: hasPermission
        ? selectedRole.permissions.filter(p => p.id !== permissionId)
        : [...selectedRole.permissions, permission]
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const permissionIds = selectedRole.permissions.map(p => p.id);

      await axios.put(
        `${process.env.REACT_APP_API_URL}/permissions/roles/${selectedRole.id}/permissions`,
        { permissionIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Permissions updated successfully!');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="admin-permissions-container">
        <div className="loading">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="admin-permissions-container">
      <div className="permissions-header">
        <button className="btn-back" onClick={() => navigate('/admin')}>
          ← Back to Dashboard
        </button>
        <h1>🔐 Permission Management</h1>
      </div>

      <div className="permissions-content">
        {/* Roles List */}
        <div className="roles-panel">
          <h2>Roles ({roles.length})</h2>
          <div className="roles-list">
            {roles.map(role => (
              <div
                key={role.id}
                className={`role-card ${selectedRole?.id === role.id ? 'active' : ''}`}
                onClick={() => handleRoleSelect(role)}
              >
                <div className="role-header">
                  <h3>{role.name}</h3>
                  <span className="user-count">{role.userCount} users</span>
                </div>
                {role.description && (
                  <p className="role-description">{role.description}</p>
                )}
                <div className="role-stats">
                  <span>{role.permissions.length} permissions</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Editor */}
        <div className="permissions-panel">
          {selectedRole ? (
            <>
              <div className="panel-header">
                <div>
                  <h2>Permissions for {selectedRole.name}</h2>
                  <p className="subtitle">
                    {selectedRole.permissions.length} of {permissions.length} permissions assigned
                  </p>
                </div>
                <button
                  className="btn-save"
                  onClick={handleSavePermissions}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="permissions-groups">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="permission-group">
                    <h3 className="group-title">
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </h3>
                    <div className="permission-items">
                      {perms.map(permission => {
                        const isChecked = selectedRole.permissions.some(
                          p => p.id === permission.id
                        );
                        return (
                          <label key={permission.id} className="permission-item">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handlePermissionToggle(permission.id)}
                            />
                            <div className="permission-info">
                              <span className="permission-code">{permission.code}</span>
                              <span className="permission-description">
                                {permission.description}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>← Select a role to manage its permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPermissionManagement;
