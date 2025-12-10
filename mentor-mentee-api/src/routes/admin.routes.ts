import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';

const router = Router();
const adminController = new AdminController();

// All routes require authentication and admin permissions
router.get('/users', authenticate, authorizePermissions('admin:manage_users'), adminController.getAllUsers.bind(adminController));
router.get('/users/:id', authenticate, authorizePermissions('admin:manage_users'), adminController.getUserById.bind(adminController));
router.delete('/users/:id', authenticate, authorizePermissions('admin:manage_users'), adminController.deleteUser.bind(adminController));
router.get('/statistics', authenticate, authorizePermissions('admin:view_stats'), adminController.getStatistics.bind(adminController));

export default router;
