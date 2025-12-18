const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPermissions() {
  const user = await prisma.user.findUnique({
    where: { id: 16 },
    select: { id: true, email: true, roleId: true }
  });
  
  console.log('User:', user);
  
  if (user.roleId) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: { permission: true }
    });
    
    console.log('\nTotal RolePermissions found:', rolePermissions.length);
    console.log('\nFirst 3 RolePermissions:');
    rolePermissions.slice(0, 3).forEach(rp => {
      console.log('  -', rp.permission?.name || 'NULL');
    });
    
    const permissions = rolePermissions.map(rp => rp.permission?.name);
    console.log('\nMapped permissions:', permissions.slice(0, 5));
    console.log('Has null values?', permissions.includes(null));
  }
  
  await prisma.$disconnect();
}

testPermissions().catch(console.error);
