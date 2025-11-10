import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserRoleIds() {
  try {
    console.log('🔧 Fixing users with null roleId...\n');

    // Find all users with null roleId
    const usersWithoutRoleId = await prisma.user.findMany({
      where: {
        roleId: null
      },
      select: {
        id: true,
        email: true,
        role: true,
        roleId: true
      }
    });

    if (usersWithoutRoleId.length === 0) {
      console.log('✅ All users already have roleId assigned!\n');
      return;
    }

    console.log(`📊 Found ${usersWithoutRoleId.length} users with null roleId\n`);

    // Fix each user
    for (const user of usersWithoutRoleId) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: user.role }
      });

      if (roleRecord) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: roleRecord.id }
        });
        console.log(`✓ Fixed user: ${user.email} (${user.role}) → roleId: ${roleRecord.id}`);
      } else {
        console.log(`⚠ No role found for: ${user.email} (${user.role})`);
      }
    }

    console.log(`\n✅ Successfully fixed ${usersWithoutRoleId.length} users!\n`);

  } catch (error) {
    console.error('❌ Error fixing user roleIds:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoleIds();
