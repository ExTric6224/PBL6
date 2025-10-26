import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Creating admin account...\n');

    // Check if admin role exists
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' }
    });

    if (!adminRole) {
      console.error('❌ ADMIN role not found. Please run: npx ts-node prisma/seed-rbac.ts first');
      process.exit(1);
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('   ID:', existingAdmin.id);
      
      // Update to ADMIN role if needed
      if (existingAdmin.role !== 'ADMIN' || existingAdmin.roleId !== adminRole.id) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            role: 'ADMIN',
            roleId: adminRole.id
          }
        });
        console.log('✅ Updated existing user to ADMIN role');
      }
      
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        roleId: adminRole.id,
        updatedAt: new Date()
      }
    });

    console.log('✅ Admin account created successfully!\n');
    console.log('📧 Email:    admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('👤 User ID:  ' + admin.id);
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
