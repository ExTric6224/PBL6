import prisma from '../db/client';
import { PERMISSION_DEFINITIONS, ROLE_PERMISSIONS } from '../utils/permissions';

/**
 * Get effective permissions for a user (role permissions + user overrides)
 */
export async function getEffectivePermissions(userId: number): Promise<Set<string>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roleId: true,
      userPermissions: {
        select: {
          isGranted: true,
          permission: {
            select: { code: true }
          }
        }
      }
    }
  });

  const result = new Set<string>();

  // 1) Add permissions from role
  if (user?.roleId) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      select: {
        permission: {
          select: { code: true }
        }
      }
    });
    // console.log(`[PERMISSIONS] User ${userId} roleId: ${user.roleId}, permissions: ${rolePermissions.length}`);
    rolePermissions.forEach(rp => {
      result.add(rp.permission.code);
      // console.log(`  [ROLE] Added: ${rp.permission.code}`);
    });
  } else {
    // console.log(`[PERMISSIONS] User ${userId} has NO roleId`);
  }

  // 2) Apply user-specific overrides (grant or revoke)
  user?.userPermissions.forEach(up => {
    if (up.isGranted) {
      result.add(up.permission.code);
    } else {
      result.delete(up.permission.code);
    }
  });

  // console.log(`[PERMISSIONS] User ${userId} effective permissions: ${Array.from(result).join(', ')}`);

  return result;
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(userId: number, permissionCode: string): Promise<boolean> {
  const permissions = await getEffectivePermissions(userId);
  return permissions.has(permissionCode);
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(userId: number, permissionCodes: string[]): Promise<boolean> {
  const permissions = await getEffectivePermissions(userId);
  return permissionCodes.some(code => permissions.has(code));
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(userId: number, permissionCodes: string[]): Promise<boolean> {
  const permissions = await getEffectivePermissions(userId);
  return permissionCodes.every(code => permissions.has(code));
}

/**
 * Grant a permission to a user (override)
 */
export async function grantUserPermission(userId: number, permissionCode: string): Promise<void> {
  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode }
  });

  if (!permission) {
    throw new Error(`Không tìm thấy quyền: ${permissionCode}`);
  }

  await prisma.userPermission.upsert({
    where: {
      userId_permissionId: {
        userId,
        permissionId: permission.id
      }
    },
    update: {
      isGranted: true,
      updatedAt: new Date()
    },
    create: {
      userId,
      permissionId: permission.id,
      isGranted: true,
      updatedAt: new Date()
    }
  });
}

/**
 * Revoke a permission from a user (override - deny)
 */
export async function revokeUserPermission(userId: number, permissionCode: string): Promise<void> {
  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode }
  });

  if (!permission) {
    throw new Error(`Không tìm thấy quyền: ${permissionCode}`);
  }

  // Set isGranted to false to explicitly deny this permission
  await prisma.userPermission.upsert({
    where: {
      userId_permissionId: {
        userId,
        permissionId: permission.id
      }
    },
    update: {
      isGranted: false,
      updatedAt: new Date()
    },
    create: {
      userId,
      permissionId: permission.id,
      isGranted: false,
      updatedAt: new Date()
    }
  });
}

/**
 * Remove user permission override (revert to role default)
 */
export async function removeUserPermissionOverride(userId: number, permissionCode: string): Promise<void> {
  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode }
  });

  if (!permission) {
    throw new Error(`Không tìm thấy quyền: ${permissionCode}`);
  }

  await prisma.userPermission.delete({
    where: {
      userId_permissionId: {
        userId,
        permissionId: permission.id
      }
    }
  }).catch(() => {
    // Ignore if not exists
  });
}

/**
 * Set permissions for a role
 */
export async function setRolePermissions(roleName: string, permissionCodes: string[]): Promise<void> {
  const role = await prisma.role.findUnique({
    where: { name: roleName }
  });

  if (!role) {
    throw new Error(`Không tìm thấy vai trò: ${roleName}`);
  }

  // Get all permissions by codes
  const permissions = await prisma.permission.findMany({
    where: {
      code: { in: permissionCodes }
    }
  });

  // Get current role permissions
  const currentRolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: role.id }
  });

  const currentPermissionIds = new Set(currentRolePermissions.map(rp => rp.permissionId));
  const targetPermissionIds = new Set(permissions.map(p => p.id));

  // Add missing permissions
  for (const permission of permissions) {
    if (!currentPermissionIds.has(permission.id)) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  // Remove extra permissions
  for (const currentRp of currentRolePermissions) {
    if (!targetPermissionIds.has(currentRp.permissionId)) {
      await prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: currentRp.permissionId
          }
        }
      });
    }
  }
}

/**
 * Add a permission to a role
 */
export async function addPermissionToRole(roleName: string, permissionCode: string): Promise<void> {
  const role = await prisma.role.findUnique({
    where: { name: roleName }
  });

  if (!role) {
    throw new Error(`Role not found: ${roleName}`);
  }

  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode }
  });

  if (!permission) {
    throw new Error(`Không tìm thấy quyền: ${permissionCode}`);
  }

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: role.id,
        permissionId: permission.id
      }
    },
    update: {},
    create: {
      roleId: role.id,
      permissionId: permission.id
    }
  });
}

/**
 * Remove a permission from a role
 */
export async function removePermissionFromRole(roleName: string, permissionCode: string): Promise<void> {
  const role = await prisma.role.findUnique({
    where: { name: roleName }
  });

  if (!role) {
    throw new Error(`Không tìm thấy vai trò: ${roleName}`);
  }

  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode }
  });

  if (!permission) {
    throw new Error(`Không tìm thấy quyền: ${permissionCode}`);
  }

  await prisma.rolePermission.delete({
    where: {
      roleId_permissionId: {
        roleId: role.id,
        permissionId: permission.id
      }
    }
  }).catch(() => {
    // Ignore if not exists
  });
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(roleName: string): Promise<string[]> {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
    select: {
      rolePermissions: {
        select: {
          permission: {
            select: { code: true }
          }
        }
      }
    }
  });

  if (!role) {
    throw new Error(`Role not found: ${roleName}`);
  }

  return role.rolePermissions.map(rp => rp.permission.code);
}

/**
 * Get user's permission overrides
 */
export async function getUserPermissionOverrides(userId: number): Promise<Array<{ code: string; isGranted: boolean }>> {
  const userPermissions = await prisma.userPermission.findMany({
    where: { userId },
    select: {
      isGranted: true,
      permission: {
        select: { code: true }
      }
    }
  });

  return userPermissions.map(up => ({
    code: up.permission.code,
    isGranted: up.isGranted
  }));
}

/**
 * Initialize permissions in database (run once during setup)
 */
export async function initializePermissions(): Promise<void> {
  console.log('Initializing permissions...');

  // Create all permissions
  for (const permDef of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: permDef.code },
      update: {
        resource: permDef.resource,
        action: permDef.action,
        description: permDef.description
      },
      create: {
        code: permDef.code,
        resource: permDef.resource,
        action: permDef.action,
        description: permDef.description
      }
    });
  }

  console.log(`Created/updated ${PERMISSION_DEFINITIONS.length} permissions`);

  // Create roles
  for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { name: roleName },
      create: {
        name: roleName,
        description: `${roleName} role`,
        updatedAt: new Date()
      }
    });

    console.log(`Created/updated role: ${roleName}`);

    // Assign permissions to role
    await setRolePermissions(roleName, permissionCodes);
    console.log(`Assigned ${permissionCodes.length} permissions to ${roleName}`);
  }

  console.log('Permissions initialization complete!');
}

/**
 * Sync user's roleId based on their role enum
 * This is for backward compatibility during migration
 */
export async function syncUserRoles(): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, role: true }
  });

  for (const user of users) {
    const role = await prisma.role.findUnique({
      where: { name: user.role }
    });

    if (role && !user.role) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: role.id }
      });
    }
  }

  console.log(`Synced ${users.length} users with their roles`);
}
