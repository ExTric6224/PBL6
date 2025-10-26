import React from 'react';
import type { Permission } from '../../types/permission';
import './PermissionList.css';

interface PermissionListProps {
  permissions: Record<string, Permission[]>;
  selectedPermissions?: string[];
  onTogglePermission?: (permissionCode: string) => void;
  readOnly?: boolean;
  highlightGranted?: string[];
  highlightRevoked?: string[];
}

const PermissionList: React.FC<PermissionListProps> = ({
  permissions,
  selectedPermissions = [],
  onTogglePermission,
  readOnly = false,
  highlightGranted = [],
  highlightRevoked = [],
}) => {
  const isSelected = (code: string) => selectedPermissions.includes(code);
  const isGranted = (code: string) => highlightGranted.includes(code);
  const isRevoked = (code: string) => highlightRevoked.includes(code);

  return (
    <div className="permission-list">
      {Object.entries(permissions).map(([resource, perms]) => (
        <div key={resource} className="permission-group">
          <h3 className="resource-title">
            {resource.charAt(0).toUpperCase() + resource.slice(1)}
          </h3>
          <div className="permissions-grid">
            {perms.map((perm) => {
              const isChecked = isSelected(perm.code);
              const isOverrideGranted = isGranted(perm.code);
              const isOverrideRevoked = isRevoked(perm.code);

              return (
                <label
                  key={perm.code}
                  className={`permission-item ${
                    isOverrideGranted ? 'override-granted' : ''
                  } ${isOverrideRevoked ? 'override-revoked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onTogglePermission?.(perm.code)}
                    disabled={readOnly}
                  />
                  <div className="permission-info">
                    <span className="permission-code">{perm.code}</span>
                    <span className="permission-description">{perm.description}</span>
                    {isOverrideGranted && (
                      <span className="badge badge-granted">✓ Granted Override</span>
                    )}
                    {isOverrideRevoked && (
                      <span className="badge badge-revoked">✗ Revoked Override</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PermissionList;
