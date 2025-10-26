import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  grantUserPermission,
  revokeUserPermission,
  removeUserPermissionOverride,
  setRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getRolePermissions,
  getUserPermissionOverrides,
  getEffectivePermissions
} from '../services/permission.service';
import {
  success,
  badRequestError,
  notFoundError,
  internalError
} from '../utils/responses';
import prisma from '../db/client';

/**
 * Grant a permission to a specific user (override)
 * POST /api/admin/permissions/users/:userId/grant
 */
export async function grantPermissionToUser(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = Number(req.params.userId);
    const { permissionCode } = req.body;

    if (!permissionCode) {
      return badRequestError(res, 'permissionCode is required');
    }

    if (isNaN(userId)) {
      return badRequestError(res, 'Invalid userId');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return notFoundError(res, 'User not found');
    }

    await grantUserPermission(userId, permissionCode);

    return success(res, {
      userId,
      permissionCode,
      granted: true,
      message: `Permission ${permissionCode} granted to user ${user.email}`
    });
  } catch (error: any) {
    console.error('Grant permission error:', error);
    return internalError(res, error.message || 'Failed to grant permission');
  }
}

/**
 * Revoke a permission from a specific user (override - deny)
 * POST /api/admin/permissions/users/:userId/revoke
 */
export async function revokePermissionFromUser(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = Number(req.params.userId);
    const { permissionCode } = req.body;

    if (!permissionCode) {
      return badRequestError(res, 'permissionCode is required');
    }

    if (isNaN(userId)) {
      return badRequestError(res, 'Invalid userId');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return notFoundError(res, 'User not found');
    }

    await revokeUserPermission(userId, permissionCode);

    return success(res, {
      userId,
      permissionCode,
      granted: false,
      message: `Permission ${permissionCode} revoked from user ${user.email}`
    });
  } catch (error: any) {
    console.error('Revoke permission error:', error);
    return internalError(res, error.message || 'Failed to revoke permission');
  }
}

/**
 * Remove permission override for a user (revert to role default)
 * DELETE /api/admin/permissions/users/:userId/:permissionCode
 */
export async function removeUserOverride(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = Number(req.params.userId);
    const { permissionCode } = req.params;

    if (isNaN(userId)) {
      return badRequestError(res, 'Invalid userId');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return notFoundError(res, 'User not found');
    }

    await removeUserPermissionOverride(userId, permissionCode);

    return success(res, {
      userId,
      permissionCode,
      message: `Permission override removed for user ${user.email}. Reverted to role default.`
    });
  } catch (error: any) {
    console.error('Remove override error:', error);
    return internalError(res, error.message || 'Failed to remove override');
  }
}

/**
 * Get user's effective permissions
 * GET /api/admin/permissions/users/:userId
 */
export async function getUserPermissions(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = Number(req.params.userId);

    if (isNaN(userId)) {
      return badRequestError(res, 'Invalid userId');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        roleRelation: {
          select: { name: true }
        }
      }
    });

    if (!user) {
      return notFoundError(res, 'User not found');
    }

    const effectivePermissions = await getEffectivePermissions(userId);
    const overrides = await getUserPermissionOverrides(userId);

    return success(res, {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        roleName: user.roleRelation?.name
      },
      effectivePermissions: Array.from(effectivePermissions),
      overrides
    });
  } catch (error: any) {
    console.error('Get user permissions error:', error);
    return internalError(res, error.message || 'Failed to get user permissions');
  }
}

/**
 * Set permissions for a role (replaces all existing permissions)
 * PUT /api/admin/permissions/roles/:roleName
 */
export async function setPermissionsForRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { roleName } = req.params;
    const { permissionCodes } = req.body;

    if (!Array.isArray(permissionCodes)) {
      return badRequestError(res, 'permissionCodes must be an array');
    }

    await setRolePermissions(roleName, permissionCodes);

    return success(res, {
      roleName,
      permissionCodes,
      message: `Permissions updated for role ${roleName}`
    });
  } catch (error: any) {
    console.error('Set role permissions error:', error);
    return internalError(res, error.message || 'Failed to set role permissions');
  }
}

/**
 * Add a permission to a role
 * POST /api/admin/permissions/roles/:roleName/add
 */
export async function addPermissionToRoleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { roleName } = req.params;
    const { permissionCode } = req.body;

    if (!permissionCode) {
      return badRequestError(res, 'permissionCode is required');
    }

    await addPermissionToRole(roleName, permissionCode);

    return success(res, {
      roleName,
      permissionCode,
      message: `Permission ${permissionCode} added to role ${roleName}`
    });
  } catch (error: any) {
    console.error('Add permission to role error:', error);
    return internalError(res, error.message || 'Failed to add permission to role');
  }
}

/**
 * Remove a permission from a role
 * POST /api/admin/permissions/roles/:roleName/remove
 */
export async function removePermissionFromRoleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { roleName } = req.params;
    const { permissionCode } = req.body;

    if (!permissionCode) {
      return badRequestError(res, 'permissionCode is required');
    }

    await removePermissionFromRole(roleName, permissionCode);

    return success(res, {
      roleName,
      permissionCode,
      message: `Permission ${permissionCode} removed from role ${roleName}`
    });
  } catch (error: any) {
    console.error('Remove permission from role error:', error);
    return internalError(res, error.message || 'Failed to remove permission from role');
  }
}

/**
 * Get all permissions for a role
 * GET /api/admin/permissions/roles/:roleName
 */
export async function getPermissionsForRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { roleName } = req.params;

    const permissions = await getRolePermissions(roleName);

    return success(res, {
      roleName,
      permissions
    });
  } catch (error: any) {
    console.error('Get role permissions error:', error);
    return internalError(res, error.message || 'Failed to get role permissions');
  }
}

/**
 * List all available permissions
 * GET /api/admin/permissions
 */
export async function listAllPermissions(req: AuthenticatedRequest, res: Response) {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });

    // Group by resource
    const groupedByResource = permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push({
        id: perm.id,
        code: perm.code,
        action: perm.action,
        description: perm.description
      });
      return acc;
    }, {} as Record<string, any[]>);

    return success(res, {
      total: permissions.length,
      permissions,
      groupedByResource
    });
  } catch (error: any) {
    console.error('List permissions error:', error);
    return internalError(res, error.message || 'Failed to list permissions');
  }
}

/**
 * List all roles with their permissions
 * GET /api/admin/permissions/roles
 */
export async function listAllRoles(req: AuthenticatedRequest, res: Response) {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                code: true,
                resource: true,
                action: true,
                description: true
              }
            }
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    const result = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: role._count.users,
      permissions: role.rolePermissions.map(rp => ({
        code: rp.permission.code,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }));

    return success(res, {
      total: result.length,
      roles: result
    });
  } catch (error: any) {
    console.error('List roles error:', error);
    return internalError(res, error.message || 'Failed to list roles');
  }
}
