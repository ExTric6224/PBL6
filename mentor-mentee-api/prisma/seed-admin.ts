import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Admin Account Seed...\n');

  // Admin account details - YOU CAN CHANGE THESE
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin@123456';

  try {
    // Check if admin role exists
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' }
    });

    if (!adminRole) {
      console.error('❌ ADMIN role not found! Please run seed:rbac first.');
      console.log('   Run: npm run seed:rbac\n');
      return;
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('ℹ️  Admin account already exists:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Role: ${existingAdmin.role}\n`);
      
      // Update to ensure it's an admin
      if (existingAdmin.role !== 'ADMIN' || existingAdmin.roleId !== adminRole.id) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            role: 'ADMIN',
            roleId: adminRole.id,
            updatedAt: new Date()
          }
        });
        console.log('✅ Updated existing user to ADMIN role\n');
      }
      
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        roleId: adminRole.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Admin account created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', adminEmail);
    console.log('🔑 Password: ', adminPassword);
    console.log('👤 Role:     ', admin.role);
    console.log('🆔 User ID:  ', admin.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT: Please change the password after first login!\n');

  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
