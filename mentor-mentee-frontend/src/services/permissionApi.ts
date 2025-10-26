import api from './api';
import type {
  Permission,
  Role,
  RoleWithPermissions,
  EffectivePermissions,
  ApiResponse,
} from '../types/permission';

const permissionApi = {
  // ==================== PERMISSIONS ====================
  
  /**
   * Lấy tất cả permissions, nhóm theo resource
   */
  getAllPermissions: async (): Promise<ApiResponse<Record<string, Permission[]>>> => {
    const response = await api.get('/admin/permissions');
    return response.data;
  },

  // ==================== ROLES ====================
  
  /**
   * Lấy tất cả roles
   */
  getAllRoles: async (): Promise<ApiResponse<Role[]>> => {
    const response = await api.get('/admin/permissions/roles');
    return response.data;
  },

  /**
   * Lấy permissions của một role
   */
  getRolePermissions: async (roleName: string): Promise<ApiResponse<RoleWithPermissions>> => {
    const response = await api.get(`/admin/permissions/roles/${roleName}`);
    return response.data;
  },

  /**
   * Thay thế toàn bộ permissions của role
   */
  setRolePermissions: async (
    roleName: string,
    permissionCodes: string[]
  ): Promise<ApiResponse<RoleWithPermissions>> => {
    const response = await api.put(`/admin/permissions/roles/${roleName}`, {
      permissionCodes,
    });
    return response.data;
  },

  /**
   * Thêm một permission vào role
   */
  addPermissionToRole: async (
    roleName: string,
    permissionCode: string
  ): Promise<ApiResponse<RoleWithPermissions>> => {
    const response = await api.post(`/admin/permissions/roles/${roleName}/add`, {
      permissionCode,
    });
    return response.data;
  },

  /**
   * Xóa một permission khỏi role
   */
  removePermissionFromRole: async (
    roleName: string,
    permissionCode: string
  ): Promise<ApiResponse<RoleWithPermissions>> => {
    const response = await api.post(`/admin/permissions/roles/${roleName}/remove`, {
      permissionCode,
    });
    return response.data;
  },

  // ==================== USER PERMISSIONS ====================
  
  /**
   * Lấy effective permissions của user
   */
  getUserPermissions: async (userId: number): Promise<ApiResponse<EffectivePermissions>> => {
    const response = await api.get(`/admin/permissions/users/${userId}`);
    return response.data;
  },

  /**
   * Grant permission cho user (override)
   */
  grantPermissionToUser: async (
    userId: number,
    permissionCode: string
  ): Promise<ApiResponse<EffectivePermissions>> => {
    const response = await api.post(`/admin/permissions/users/${userId}/grant`, {
      permissionCode,
    });
    return response.data;
  },

  /**
   * Revoke permission từ user (deny override)
   */
  revokePermissionFromUser: async (
    userId: number,
    permissionCode: string
  ): Promise<ApiResponse<EffectivePermissions>> => {
    const response = await api.post(`/admin/permissions/users/${userId}/revoke`, {
      permissionCode,
    });
    return response.data;
  },

  /**
   * Xóa override, user quay về quyền mặc định của role
   */
  removeUserOverride: async (
    userId: number,
    permissionCode: string
  ): Promise<ApiResponse<EffectivePermissions>> => {
    const response = await api.delete(`/admin/permissions/users/${userId}/${permissionCode}`);
    return response.data;
  },
};

export default permissionApi;
