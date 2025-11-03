import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (except RBAC which was already seeded)
  console.log('🧹 Cleaning existing data...');
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.session.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.menteeprofile.deleteMany();
  await prisma.mentorprofile.deleteMany();
  
  // Don't delete users with ADMIN role (keep admin from RBAC seed)
  await prisma.user.deleteMany({
    where: {
      role: {
        in: ['MENTEE', 'MENTOR']
      }
    }
  });

  console.log('✅ Cleaned existing data');

  // Get role IDs from RBAC seed
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const mentorRole = await prisma.role.findUnique({ where: { name: 'MENTOR' } });
  const menteeRole = await prisma.role.findUnique({ where: { name: 'MENTEE' } });

  if (!adminRole || !mentorRole || !menteeRole) {
    throw new Error('❌ Roles not found! Please run seed-rbac.ts first');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Create Mentee users
  console.log('👤 Creating mentee users...');
  const mentee1 = await prisma.user.create({
    data: {
      email: 'mentee1@example.com',
      password: hashedPassword,
      role: 'MENTEE',
      roleId: menteeRole.id,
      updatedAt: new Date(),
      menteeprofile: {
        create: {
          fullName: 'Nguyễn Văn A',
          goals: 'Học lập trình web và mobile',
          interests: JSON.stringify(['JavaScript', 'React', 'Node.js']),
        }
      }
    }
  });

  const mentee2 = await prisma.user.create({
    data: {
      email: 'mentee2@example.com',
      password: hashedPassword,
      role: 'MENTEE',
      roleId: menteeRole.id,
      updatedAt: new Date(),
      menteeprofile: {
        create: {
          fullName: 'Trần Thị B',
          goals: 'Học AI và Machine Learning',
          interests: JSON.stringify(['Python', 'TensorFlow', 'Data Science']),
        }
      }
    }
  });

  const mentee3 = await prisma.user.create({
    data: {
      email: 'mentee3@example.com',
      password: hashedPassword,
      role: 'MENTEE',
      roleId: menteeRole.id,
      updatedAt: new Date(),
      menteeprofile: {
        create: {
          fullName: 'Lê Văn C',
          goals: 'Học DevOps và Cloud Computing',
          interests: JSON.stringify(['Docker', 'Kubernetes', 'AWS']),
        }
      }
    }
  });

  console.log('✅ Created 3 mentee users');

  // Create Mentor users
  console.log('👨‍🏫 Creating mentor users...');
  const mentor1 = await prisma.user.create({
    data: {
      email: 'mentor1@example.com',
      password: hashedPassword,
      role: 'MENTOR',
      roleId: mentorRole.id,
      updatedAt: new Date(),
      mentorprofile: {
        create: {
          fullName: 'Phạm Văn D',
          school: 'Đại học Bách Khoa',
          expertise: JSON.stringify(['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB']),
          degree: 'Thạc sĩ Khoa học Máy tính',
          yearsExp: 5,
          bio: 'Full-stack developer với 5 năm kinh nghiệm. Chuyên về MERN stack.',
        }
      }
    }
  });

  const mentor2 = await prisma.user.create({
    data: {
      email: 'mentor2@example.com',
      password: hashedPassword,
      role: 'MENTOR',
      roleId: mentorRole.id,
      updatedAt: new Date(),
      mentorprofile: {
        create: {
          fullName: 'Hoàng Thị E',
          school: 'Đại học Công nghệ',
          expertise: JSON.stringify(['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch']),
          degree: 'Tiến sĩ AI',
          yearsExp: 8,
          bio: 'AI Researcher với 8 năm kinh nghiệm trong ML và DL.',
        }
      }
    }
  });

  const mentor3 = await prisma.user.create({
    data: {
      email: 'mentor3@example.com',
      password: hashedPassword,
      role: 'MENTOR',
      roleId: mentorRole.id,
      updatedAt: new Date(),
      mentorprofile: {
        create: {
          fullName: 'Vũ Văn F',
          school: 'Đại học FPT',
          expertise: JSON.stringify(['DevOps', 'Docker', 'Kubernetes', 'CI/CD', 'AWS']),
          degree: 'Cử nhân Công nghệ thông tin',
          yearsExp: 6,
          bio: 'DevOps Engineer với 6 năm kinh nghiệm triển khai hệ thống cloud.',
        }
      }
    }
  });

  console.log('✅ Created 3 mentor users');

  // Create Posts
  console.log('📝 Creating posts...');
  
  await prisma.post.create({
    data: {
      authorId: mentor1.id,
      title: 'Tips học React cho người mới bắt đầu',
      content: 'React là một thư viện JavaScript phổ biến để xây dựng giao diện người dùng. Dưới đây là một số tips hữu ích...',
      isPublic: true,
      updatedAt: new Date(),
    }
  });

  await prisma.post.create({
    data: {
      authorId: mentor2.id,
      title: 'Machine Learning roadmap 2025',
      content: 'Để bắt đầu học Machine Learning, bạn nên tập trung vào các kiến thức nền tảng về toán, thống kê...',
      isPublic: true,
      updatedAt: new Date(),
    }
  });

  await prisma.post.create({
    data: {
      authorId: mentor3.id,
      title: 'Docker và Kubernetes - Sự khác biệt',
      content: 'Docker và Kubernetes thường được nhắc đến cùng nhau nhưng chúng có vai trò khác nhau...',
      isPublic: true,
      updatedAt: new Date(),
    }
  });

  await prisma.post.create({
    data: {
      authorId: mentee1.id,
      title: 'Kinh nghiệm học JavaScript của tôi',
      content: 'Sau 3 tháng học JavaScript, tôi muốn chia sẻ một số kinh nghiệm...',
      isPublic: true,
      updatedAt: new Date(),
    }
  });

  console.log('✅ Created 4 posts');

  // Create Schedules
  console.log('📅 Creating schedules...');
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 0, 0, 0);

  await prisma.schedule.create({
    data: {
      mentorId: mentor1.id,
      topic: 'React Hooks và State Management',
      startAt: tomorrow,
      endAt: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours
      capacity: 3,
      status: 'AVAILABLE',
    }
  });

  await prisma.schedule.create({
    data: {
      mentorId: mentor2.id,
      topic: 'Introduction to Neural Networks',
      startAt: nextWeek,
      endAt: new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000), // 3 hours
      capacity: 2,
      status: 'AVAILABLE',
    }
  });

  await prisma.schedule.create({
    data: {
      mentorId: mentor3.id,
      topic: 'Docker Basic to Advanced',
      startAt: new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000), // next week + 1 day
      endAt: new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      capacity: 5,
      status: 'AVAILABLE',
    }
  });

  console.log('✅ Created 3 schedules');

  // Create Notifications
  console.log('🔔 Creating notifications...');
  
  await prisma.notification.create({
    data: {
      userId: mentee1.id,
      type: 'INFO',
      title: 'Chào mừng đến với hệ thống!',
      content: 'Hãy hoàn thiện profile và đăng ký lịch học với mentor nhé!',
      isRead: false,
    }
  });

  await prisma.notification.create({
    data: {
      userId: mentor1.id,
      type: 'INFO',
      title: 'Lịch dạy mới được tạo',
      content: 'Lịch "React Hooks và State Management" của bạn đã được tạo thành công.',
      isRead: false,
    }
  });

  console.log('✅ Created notifications');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('  - 3 Mentee users (password: 123456)');
  console.log('    • mentee1@example.com - Nguyễn Văn A');
  console.log('    • mentee2@example.com - Trần Thị B');
  console.log('    • mentee3@example.com - Lê Văn C');
  console.log('  - 3 Mentor users (password: 123456)');
  console.log('    • mentor1@example.com - Phạm Văn D');
  console.log('    • mentor2@example.com - Hoàng Thị E');
  console.log('    • mentor3@example.com - Vũ Văn F');
  console.log('  - 4 Posts');
  console.log('  - 3 Schedules');
  console.log('  - Notifications\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
