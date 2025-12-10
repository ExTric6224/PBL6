import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      include: {
        roleRelation: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('\n📊 Admin User Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', admin.email);
    console.log('Role (enum):', admin.role);
    console.log('Role ID:', admin.roleId);
    console.log('User ID:', admin.id);
    
    if (admin.roleRelation) {
      console.log('\n🔐 Role Details:');
      console.log('Role Name:', admin.roleRelation.name);
      console.log('Role ID:', admin.roleRelation.id);
      console.log('Permissions Count:', admin.roleRelation.rolePermissions.length);
      
      console.log('\n✅ Permissions:');
      admin.roleRelation.rolePermissions.forEach((rp: any) => {
        console.log(`  - ${rp.permission.code}: ${rp.permission.description}`);
      });
    } else {
      console.log('\n❌ No role relation found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
