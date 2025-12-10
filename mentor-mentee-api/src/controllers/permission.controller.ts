import { Response } from 'express';
import 'express-async-errors';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { success, notFoundError, badRequestError } from '../utils/responses';
import prisma from '../db/client';
import { PERMISSION_DEFINITIONS } from '../utils/permissions';

export class PermissionController {
  // Get all permissions
  async getAllPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' }
        ]
      });

      return success(res, {
        permissions,
        total: permissions.length
      });
    } catch (error: any) {
      throw error;
    }
  }

  // Get all roles with their permissions
  async getAllRoles(req: AuthenticatedRequest, res: Response) {
    try {
      const roles = await prisma.role.findMany({
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          },
          users: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Transform data
      const transformedRoles = roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        userCount: role.users.length,
        permissions: role.rolePermissions.map(rp => rp.permission),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }));

      return success(res, {
        roles: transformedRoles,
        total: roles.length
      });
    } catch (error: any) {
      throw error;
    }
  }

  // Get specific role by ID
  async getRoleById(req: AuthenticatedRequest, res: Response) {
    try {
      const roleId = parseInt(req.params.id);

      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          },
          users: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!role) {
        return notFoundError(res, 'Role not found');
      }

      const transformed = {
        id: role.id,
        name: role.name,
        description: role.description,
        userCount: role.users.length,
        users: role.users,
        permissions: role.rolePermissions.map(rp => rp.permission),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      };

      return success(res, transformed);
    } catch (error: any) {
      throw error;
    }
  }

  // Update role permissions
  async updateRolePermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const roleId = parseInt(req.params.id);
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds)) {
        return badRequestError(res, 'permissionIds must be an array');
      }

      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return notFoundError(res, 'Role not found');
      }

      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId }
      });

      // Create new role permissions
      const rolePermissions = await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: number) => ({
          roleId,
          permissionId
        }))
      });

      // Fetch updated role with permissions
      const updatedRole = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      return success(res, {
        role: updatedRole,
        message: 'Role permissions updated successfully'
      });
    } catch (error: any) {
      throw error;
    }
  }

  // Get user permissions (role + user-specific)
  async getUserPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roleRelation: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          },
          userPermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      if (!user) {
        return notFoundError(res, 'User not found');
      }

      const rolePermissions = user.roleRelation?.rolePermissions.map(rp => rp.permission) || [];
      const userPermissions = user.userPermissions || [];

      return success(res, {
        userId: user.id,
        email: user.email,
        role: user.role,
        rolePermissions,
        userPermissions,
        effectivePermissions: this.calculateEffectivePermissions(rolePermissions, userPermissions)
      });
    } catch (error: any) {
      throw error;
    }
  }

  // Grant permission to user
  async grantUserPermission(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { permissionId, isGranted } = req.body;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return notFoundError(res, 'User not found');
      }

      const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
      if (!permission) {
        return notFoundError(res, 'Permission not found');
      }

      // Upsert user permission
      const userPermission = await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId
          }
        },
        create: {
          userId,
          permissionId,
          isGranted: isGranted ?? true,
          updatedAt: new Date()
        },
        update: {
          isGranted: isGranted ?? true,
          updatedAt: new Date()
        },
        include: {
          permission: true
        }
      });

      return success(res, {
        userPermission,
        message: `Permission ${isGranted ? 'granted' : 'revoked'} successfully`
      });
    } catch (error: any) {
      throw error;
    }
  }

  // Revoke permission from user
  async revokeUserPermission(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const permissionId = parseInt(req.params.permissionId);

      await prisma.userPermission.delete({
        where: {
          userId_permissionId: {
            userId,
            permissionId
          }
        }
      });

      return success(res, {
        message: 'Permission revoked successfully'
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return notFoundError(res, 'User permission not found');
      }
      throw error;
    }
  }

  // Update user permissions (bulk update by permission codes)
  async updateUserPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { permissionCodes } = req.body;

      if (!Array.isArray(permissionCodes)) {
        return badRequestError(res, 'permissionCodes must be an array');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return notFoundError(res, 'User not found');
      }

      // Get permission IDs from codes
      const permissions = await prisma.permission.findMany({
        where: {
          code: {
            in: permissionCodes
          }
        }
      });

      const permissionIds = permissions.map(p => p.id);

      // Delete all existing user permissions
      await prisma.userPermission.deleteMany({
        where: { userId }
      });

      // Create new user permissions
      if (permissionIds.length > 0) {
        await prisma.userPermission.createMany({
          data: permissionIds.map(permissionId => ({
            userId,
            permissionId,
            isGranted: true,
            updatedAt: new Date()
          }))
        });
      }

      // Fetch updated user permissions
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roleRelation: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          },
          userPermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      const rolePermissions = updatedUser?.roleRelation?.rolePermissions.map(rp => rp.permission) || [];
      const userPermissions = updatedUser?.userPermissions || [];

      return success(res, {
        userId: updatedUser!.id,
        email: updatedUser!.email,
        role: updatedUser!.role,
        rolePermissions,
        directPermissions: userPermissions.map(up => up.permission),
        effectivePermissions: this.calculateEffectivePermissions(rolePermissions, userPermissions),
        message: 'User permissions updated successfully'
      });
    } catch (error: any) {
      throw error;
    }
  }

  // Update user permissions with bulk grant/revoke (support isGranted flag)
  async updateUserPermissionsBulk(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return badRequestError(res, 'permissions must be an array');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return notFoundError(res, 'User not found');
      }

      // Get all permission codes
      const permissionCodes = permissions.map(p => p.code);
      
      // Fetch permission records from database
      const permissionRecords = await prisma.permission.findMany({
        where: {
          code: {
            in: permissionCodes
          }
        }
      });

      // Create a map of code -> id
      const codeToId = new Map(permissionRecords.map(p => [p.code, p.id]));

      // Delete all existing user permissions
      await prisma.userPermission.deleteMany({
        where: { userId }
      });

      // Create new user permissions with isGranted flag
      const permissionData = permissions
        .map(p => {
          const permissionId = codeToId.get(p.code);
          if (!permissionId) return null;
          return {
            userId,
            permissionId,
            isGranted: p.isGranted !== false, // default to true if not specified
            updatedAt: new Date()
          };
        })
        .filter(Boolean);

      if (permissionData.length > 0) {
        await prisma.userPermission.createMany({
          data: permissionData as any[]
        });
      }

      // Fetch updated user permissions
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roleRelation: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          },
          userPermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      const rolePermissions = updatedUser?.roleRelation?.rolePermissions.map(rp => rp.permission) || [];
      const userPermissions = updatedUser?.userPermissions || [];

      return success(res, {
        userId: updatedUser!.id,
        email: updatedUser!.email,
        role: updatedUser!.role,
        rolePermissions,
        userPermissions,
        effectivePermissions: this.calculateEffectivePermissions(rolePermissions, userPermissions),
        message: 'User permissions updated successfully'
      });
    } catch (error: any) {
      throw error;
    }
  }

  // Helper: Calculate effective permissions
  private calculateEffectivePermissions(rolePermissions: any[], userPermissions: any[]) {
    const effective = new Set<string>();

    // Add role permissions
    rolePermissions.forEach(p => effective.add(p.code));

    // Apply user-specific overrides
    userPermissions.forEach(up => {
      if (up.isGranted) {
        effective.add(up.permission.code);
      } else {
        effective.delete(up.permission.code);
      }
    });

    return Array.from(effective);
  }
}
