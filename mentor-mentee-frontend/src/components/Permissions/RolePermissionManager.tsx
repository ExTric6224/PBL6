import React, { useState, useEffect } from 'react';
import permissionApi from '../../services/permissionApi';
import PermissionList from './PermissionList';
import type { Role, Permission, RoleWithPermissions } from '../../types/permission';
import './RolePermissionManager.css';

const RolePermissionManager: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<RoleWithPermissions | null>(null);
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        permissionApi.getAllRoles(),
        permissionApi.getAllPermissions(),
      ]);
      setRoles(rolesRes.data);
      setAllPermissions(permsRes.data);
    } catch (err: any) {
      setError('Failed to load initial data');
    }
  };

  const loadRolePermissions = async (roleName: string) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await permissionApi.getRolePermissions(roleName);
      setRolePermissions(response.data);
      setSelectedPermissions(response.data.permissions.map(p => p.code));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load role permissions');
      setRolePermissions(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleName: string) => {
    setSelectedRole(roleName);
    if (roleName) {
      loadRolePermissions(roleName);
    } else {
      setRolePermissions(null);
      setSelectedPermissions([]);
    }
  };

  const handleTogglePermission = (permissionCode: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionCode)) {
        return prev.filter(code => code !== permissionCode);
      } else {
        return [...prev, permissionCode];
      }
    });
  };

  const handleAddPermission = async (permissionCode: string) => {
    if (!selectedRole) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await permissionApi.addPermissionToRole(selectedRole, permissionCode);
      setRolePermissions(response.data);
      setSelectedPermissions(response.data.permissions.map(p => p.code));
      setSuccessMessage(`✓ Added "${permissionCode}" to ${selectedRole} role`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add permission');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async (permissionCode: string) => {
    if (!selectedRole) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await permissionApi.removePermissionFromRole(selectedRole, permissionCode);
      setRolePermissions(response.data);
      setSelectedPermissions(response.data.permissions.map(p => p.code));
      setSuccessMessage(`✗ Removed "${permissionCode}" from ${selectedRole} role`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove permission');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllChanges = async () => {
    if (!selectedRole) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await permissionApi.setRolePermissions(selectedRole, selectedPermissions);
      setRolePermissions(response.data);
      setSuccessMessage(`✓ Successfully updated all permissions for ${selectedRole} role`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!rolePermissions) return false;
    const currentCodes = rolePermissions.permissions.map(p => p.code).sort();
    const selectedCodes = [...selectedPermissions].sort();
    return JSON.stringify(currentCodes) !== JSON.stringify(selectedCodes);
  };

  return (
    <div className="role-permission-manager">
      <div className="header">
        <h2>🎭 Role Permission Management</h2>
        <p>Manage default permissions for each role (applies to all users with that role)</p>
      </div>

      {/* Role Selection */}
      <div className="role-selection card">
        <label htmlFor="role-select">
          <strong>Select Role:</strong>
        </label>
        <select
          id="role-select"
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="role-select"
        >
          <option value="">-- Choose a Role --</option>
          {roles.map(role => (
            <option key={role.id} value={role.name}>
              {role.name} - {role.description}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Role Info */}
      {rolePermissions && (
        <div className="role-info card">
          <h3>Role Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Role Name:</span>
              <span className={`badge badge-${selectedRole.toLowerCase()}`}>
                {rolePermissions.name}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Description:</span>
              <span className="value">{rolePermissions.description}</span>
            </div>
            <div className="info-item">
              <span className="label">Current Permissions:</span>
              <span className="value">{rolePermissions.permissions.length} permissions</span>
            </div>
            <div className="info-item">
              <span className="label">Selected:</span>
              <span className="value">
                {selectedPermissions.length} permissions
                {hasChanges() && <span className="unsaved-badge">• Unsaved Changes</span>}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {rolePermissions && (
        <div className="quick-actions card">
          <h3>Quick Actions</h3>
          <div className="action-buttons-grid">
            <select
              className="permission-dropdown"
              onChange={(e) => {
                if (e.target.value) {
                  handleAddPermission(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="">-- Add Single Permission --</option>
              {Object.entries(allPermissions).map(([resource, perms]) => (
                <optgroup key={resource} label={resource.toUpperCase()}>
                  {perms
                    .filter(p => !selectedPermissions.includes(p.code))
                    .map(perm => (
                      <option key={perm.code} value={perm.code}>
                        {perm.code} - {perm.description}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>

            <select
              className="permission-dropdown"
              onChange={(e) => {
                if (e.target.value) {
                  handleRemovePermission(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="">-- Remove Single Permission --</option>
              {rolePermissions.permissions.map(perm => (
                <option key={perm.code} value={perm.code}>
                  {perm.code} - {perm.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Permission Editor */}
      {rolePermissions && Object.keys(allPermissions).length > 0 && (
        <div className="permission-editor card">
          <div className="editor-header">
            <h3>Edit Permissions</h3>
            {hasChanges() && (
              <button
                className="btn-save"
                onClick={handleSaveAllChanges}
                disabled={loading}
              >
                💾 Save All Changes ({selectedPermissions.length} permissions)
              </button>
            )}
          </div>
          <p className="hint">
            ✓ Check = Permission granted to role | Changes here require clicking "Save All Changes"
          </p>
          <PermissionList
            permissions={allPermissions}
            selectedPermissions={selectedPermissions}
            onTogglePermission={handleTogglePermission}
            readOnly={false}
          />
        </div>
      )}
    </div>
  );
};

export default RolePermissionManager;
