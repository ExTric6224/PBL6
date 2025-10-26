export interface Permission {
  id: number;
  code: string;
  resource: string;
  action: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserPermission {
  id: number;
  userId: number;
  permissionId: number;
  granted: boolean;
  createdAt: string;
  updatedAt: string;
  permission: Permission;
}

export interface EffectivePermissions {
  userId: number;
  role: string;
  rolePermissions: Permission[];
  userOverrides: UserPermission[];
  effectivePermissions: string[];
}

export interface PermissionGroup {
  resource: string;
  permissions: Permission[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
