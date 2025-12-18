const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  // Check RolePermission records
  const rolePerms = await prisma.$queryRaw`
    SELECT rp.*, p.name as permission_name, p.id as permission_id
    FROM RolePermission rp
    LEFT JOIN Permission p ON rp.permissionId = p.id
    WHERE rp.roleId = 2
    LIMIT 5
  `;
  
  console.log('Direct SQL query results:');
  console.log(rolePerms);
  
  // Check if permissions exist
  const permCount = await prisma.permission.count();
  console.log('\nTotal permissions in DB:', permCount);
  
  // Check RolePermission count
  const rpCount = await prisma.rolePermission.count({ where: { roleId: 2 } });
  console.log('Total RolePermissions for roleId 2:', rpCount);
  
  await prisma.$disconnect();
}

checkDatabase().catch(console.error);
