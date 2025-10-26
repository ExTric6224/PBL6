import React, { useState, useEffect } from 'react';
import permissionApi from '../../services/permissionApi';
import PermissionList from './PermissionList';
import type { Permission, EffectivePermissions } from '../../types/permission';
import './UserPermissionManager.css';

const UserPermissionManager: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<EffectivePermissions | null>(null);
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Load all permissions khi component mount
  useEffect(() => {
    loadAllPermissions();
  }, []);

  const loadAllPermissions = async () => {
    try {
      const response = await permissionApi.getAllPermissions();
      setAllPermissions(response.data);
    } catch (err: any) {
      console.error('Failed to load permissions:', err);
    }
  };

  const loadUserPermissions = async () => {
    if (!userId) {
      setError('Please enter a user ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await permissionApi.getUserPermissions(Number(userId));
      setUserPermissions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user permissions');
      setUserPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPermission = async (permissionCode: string) => {
    if (!userId) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await permissionApi.grantPermissionToUser(Number(userId), permissionCode);
      setUserPermissions(response.data);
      setSuccessMessage(`✓ Granted "${permissionCode}" to user ${userId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to grant permission');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePermission = async (permissionCode: string) => {
    if (!userId) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await permissionApi.revokePermissionFromUser(Number(userId), permissionCode);
      setUserPermissions(response.data);
      setSuccessMessage(`✗ Revoked "${permissionCode}" from user ${userId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke permission');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOverride = async (permissionCode: string) => {
    if (!userId) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await permissionApi.removeUserOverride(Number(userId), permissionCode);
      setUserPermissions(response.data);
      setSuccessMessage(`⟲ Removed override for "${permissionCode}" - user back to role defaults`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove override');
    } finally {
      setLoading(false);
    }
  };

  const getGrantedOverrides = (): string[] => {
    if (!userPermissions) return [];
    return userPermissions.userOverrides
      .filter(override => override.granted)
      .map(override => override.permission.code);
  };

  const getRevokedOverrides = (): string[] => {
    if (!userPermissions) return [];
    return userPermissions.userOverrides
      .filter(override => !override.granted)
      .map(override => override.permission.code);
  };

  return (
    <div className="user-permission-manager">
      <div className="header">
        <h2>👤 User Permission Management</h2>
        <p>Grant or revoke specific permissions for individual users (overrides role defaults)</p>
      </div>

      {/* Search Section */}
      <div className="search-section card">
        <div className="input-group">
          <input
            type="number"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadUserPermissions()}
          />
          <button onClick={loadUserPermissions} disabled={loading || !userId}>
            {loading ? 'Loading...' : 'Load User Permissions'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* User Info */}
      {userPermissions && (
        <div className="user-info card">
          <h3>User Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">User ID:</span>
              <span className="value">{userPermissions.userId}</span>
            </div>
            <div className="info-item">
              <span className="label">Role:</span>
              <span className={`badge badge-${userPermissions.role.toLowerCase()}`}>
                {userPermissions.role}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Role Permissions:</span>
              <span className="value">{userPermissions.rolePermissions.length} permissions</span>
            </div>
            <div className="info-item">
              <span className="label">Overrides:</span>
              <span className="value">
                {userPermissions.userOverrides.length} override(s)
                {userPermissions.userOverrides.length > 0 && (
                  <span className="override-detail">
                    ({getGrantedOverrides().length} granted, {getRevokedOverrides().length} revoked)
                  </span>
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Effective Permissions:</span>
              <span className="value">{userPermissions.effectivePermissions.length} permissions</span>
            </div>
          </div>
        </div>
      )}

      {/* Permission Actions */}
      {userPermissions && (
        <div className="permission-actions card">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <select
              id="permission-select"
              className="permission-select"
              onChange={(e) => {
                if (e.target.value) {
                  handleGrantPermission(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="">-- Grant Permission --</option>
              {Object.entries(allPermissions).map(([resource, perms]) => (
                <optgroup key={resource} label={resource.toUpperCase()}>
                  {perms.map(perm => (
                    <option key={perm.code} value={perm.code}>
                      {perm.code} - {perm.description}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <select
              className="permission-select"
              onChange={(e) => {
                if (e.target.value) {
                  handleRevokePermission(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="">-- Revoke Permission --</option>
              {Object.entries(allPermissions).map(([resource, perms]) => (
                <optgroup key={resource} label={resource.toUpperCase()}>
                  {perms.map(perm => (
                    <option key={perm.code} value={perm.code}>
                      {perm.code} - {perm.description}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* User Overrides List */}
      {userPermissions && userPermissions.userOverrides.length > 0 && (
        <div className="overrides-list card">
          <h3>Active Overrides</h3>
          <div className="overrides-grid">
            {userPermissions.userOverrides.map(override => (
              <div
                key={override.id}
                className={`override-item ${override.granted ? 'granted' : 'revoked'}`}
              >
                <div className="override-info">
                  <span className="override-code">{override.permission.code}</span>
                  <span className="override-status">
                    {override.granted ? '✓ Granted' : '✗ Revoked'}
                  </span>
                </div>
                <button
                  className="btn-remove"
                  onClick={() => handleRemoveOverride(override.permission.code)}
                  disabled={loading}
                >
                  Remove Override
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Permissions Display */}
      {userPermissions && Object.keys(allPermissions).length > 0 && (
        <div className="all-permissions card">
          <h3>All Permissions (Read-only View)</h3>
          <p className="hint">
            ✓ Green border = Granted override | ✗ Red border = Revoked override | 
            Checked = User has this permission
          </p>
          <PermissionList
            permissions={allPermissions}
            selectedPermissions={userPermissions.effectivePermissions}
            highlightGranted={getGrantedOverrides()}
            highlightRevoked={getRevokedOverrides()}
            readOnly={true}
          />
        </div>
      )}
    </div>
  );
};

export default UserPermissionManager;
