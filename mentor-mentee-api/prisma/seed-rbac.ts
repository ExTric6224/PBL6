import { PrismaClient } from '@prisma/client';
import { PERMISSION_DEFINITIONS, ROLE_PERMISSIONS } from '../src/utils/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting RBAC seed...');

  // 1. Create all permissions
  console.log('\n📝 Creating permissions...');
  for (const permDef of PERMISSION_DEFINITIONS) {
    const permission = await prisma.permission.upsert({
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
    console.log(`  ✓ ${permission.code}`);
  }
  console.log(`\n✅ Created ${PERMISSION_DEFINITIONS.length} permissions`);

  // 2. Create roles and assign permissions
  console.log('\n👥 Creating roles and assigning permissions...');
  for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    // Create role
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {
        description: `${roleName} role with predefined permissions`,
        updatedAt: new Date()
      },
      create: {
        name: roleName,
        description: `${roleName} role with predefined permissions`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`\n  📌 Role: ${roleName} (ID: ${role.id})`);

    // Get all permissions for this role
    const permissions = await prisma.permission.findMany({
      where: {
        code: { in: permissionCodes }
      }
    });

    // Remove old role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    // Create role permissions
    for (const permission of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
    console.log(`  ✓ Assigned ${permissions.length} permissions to ${roleName}`);
  }

  // 3. Sync existing users with their roles
  console.log('\n🔄 Syncing existing users with RBAC roles...');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true
    }
  });

  for (const user of users) {
    const role = await prisma.role.findUnique({
      where: { name: user.role }
    });

    if (role) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: role.id }
        });
        console.log(`  ✓ Synced user ${user.email} with role ${user.role}`);
      } catch (error) {
        // Ignore if already synced
        console.log(`  ℹ User ${user.email} already synced`);
      }
    }
  }

  console.log('\n✨ RBAC seed completed successfully!');
  console.log('\n📊 Summary:');
  const totalPermissions = await prisma.permission.count();
  const totalRoles = await prisma.role.count();
  const totalRolePermissions = await prisma.rolePermission.count();
  console.log(`  - Permissions: ${totalPermissions}`);
  console.log(`  - Roles: ${totalRoles}`);
  console.log(`  - Role-Permission mappings: ${totalRolePermissions}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    // process.exit(1);
  });
