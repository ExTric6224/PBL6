import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create mentor user
  const mentorPassword = await hashPassword('mentor123');
  const mentor = await prisma.user.create({
    data: {
      email: 'mentor@example.com',
      password: mentorPassword,
      role: 'MENTOR',
    },
  });
  console.log('✅ Created mentor user:', mentor.email);

  // Create mentor profile
  const mentorProfile = await prisma.mentorProfile.create({
    data: {
      userId: mentor.id,
      fullName: 'John Smith',
      school: 'MIT',
      expertise: JSON.stringify(['Backend', '.NET', 'Mobile']),
      degree: 'Master of Computer Science',
      yearsExp: 5,
      bio: 'Experienced software engineer with expertise in backend development and mobile applications.',
    },
  });
  console.log('✅ Created mentor profile for:', mentorProfile.fullName);

  // Create mentee user
  const menteePassword = await hashPassword('mentee123');
  const mentee = await prisma.user.create({
    data: {
      email: 'mentee@example.com',
      password: menteePassword,
      role: 'MENTEE',
    },
  });
  console.log('✅ Created mentee user:', mentee.email);

  // Create mentee profile
  const menteeProfile = await prisma.menteeProfile.create({
    data: {
      userId: mentee.id,
      fullName: 'Jane Doe',
      goals: 'Learn backend development and best practices',
      interests: JSON.stringify(['Web', 'AI', 'Career']),
    },
  });
  console.log('✅ Created mentee profile for:', menteeProfile.fullName);

  // Create available schedule
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

  const endTime = new Date(tomorrow);
  endTime.setHours(15, 0, 0, 0); // 3 PM tomorrow

  const schedule = await prisma.schedule.create({
    data: {
      mentorId: mentorProfile.id,
      topic: 'Backend Development Fundamentals',
      startAt: tomorrow,
      endAt: endTime,
      capacity: 3,
      status: 'AVAILABLE',
    },
  });
  console.log('✅ Created available schedule:', schedule.topic);

  // Create some notifications
  await prisma.notification.create({
    data: {
      userId: mentor.id,
      type: 'APP',
      title: 'Welcome to MentorMentee!',
      content: 'Your mentor account has been created successfully.',
    },
  });

  await prisma.notification.create({
    data: {
      userId: mentee.id,
      type: 'APP',
      title: 'Welcome to MentorMentee!',
      content: 'Your mentee account has been created successfully.',
    },
  });

  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('Test accounts:');
  console.log('- Admin: admin@example.com / admin123');
  console.log('- Mentor: mentor@example.com / mentor123');
  console.log('- Mentee: mentee@example.com / mentee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
