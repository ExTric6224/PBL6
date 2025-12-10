import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';

const router = Router();
const permissionController = new PermissionController();

// Get all permissions
router.get('/permissions', authenticate, authorizePermissions('permission:view'), permissionController.getAllPermissions.bind(permissionController));

// Get all roles with their permissions
router.get('/roles', authenticate, authorizePermissions('permission:view'), permissionController.getAllRoles.bind(permissionController));

// Get specific role with permissions
router.get('/roles/:id', authenticate, authorizePermissions('permission:view'), permissionController.getRoleById.bind(permissionController));

// Update role permissions
router.put('/roles/:id/permissions', authenticate, authorizePermissions('permission:grant'), permissionController.updateRolePermissions.bind(permissionController));

// Get user permissions
router.get('/users/:id/permissions', authenticate, authorizePermissions('permission:view'), permissionController.getUserPermissions.bind(permissionController));

// Update user permissions (bulk update)
router.put('/users/:id/permissions', authenticate, authorizePermissions('permission:grant'), permissionController.updateUserPermissions.bind(permissionController));

// Update user permissions with grant/revoke flags (bulk update)
router.put('/users/:id/permissions/bulk', authenticate, authorizePermissions('permission:grant'), permissionController.updateUserPermissionsBulk.bind(permissionController));

// Grant permission to user
router.post('/users/:id/permissions', authenticate, authorizePermissions('permission:grant'), permissionController.grantUserPermission.bind(permissionController));

// Revoke permission from user
router.delete('/users/:id/permissions/:permissionId', authenticate, authorizePermissions('permission:revoke'), permissionController.revokeUserPermission.bind(permissionController));

export default router;
