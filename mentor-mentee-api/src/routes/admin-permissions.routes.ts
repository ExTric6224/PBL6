import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as ctrl from '../controllers/admin-permissions.controller';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Permission listing
router.get('/', ctrl.listAllPermissions);

// Role management
router.get('/roles', ctrl.listAllRoles);
router.get('/roles/:roleName', ctrl.getPermissionsForRole);
router.put('/roles/:roleName', ctrl.setPermissionsForRole);
router.post('/roles/:roleName/add', ctrl.addPermissionToRoleHandler);
router.post('/roles/:roleName/remove', ctrl.removePermissionFromRoleHandler);

// User permission management
router.get('/users/:userId', ctrl.getUserPermissions);
router.post('/users/:userId/grant', ctrl.grantPermissionToUser);
router.post('/users/:userId/revoke', ctrl.revokePermissionFromUser);
router.delete('/users/:userId/:permissionCode', ctrl.removeUserOverride);

export default router;
