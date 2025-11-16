import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎓 Seeding sessions for testing...\n');

  // Get existing users (mentors and mentees)
  const mentors = await prisma.user.findMany({
    where: { role: 'MENTOR' },
    include: { mentorprofile: true },
    take: 3
  });

  const mentees = await prisma.user.findMany({
    where: { role: 'MENTEE' },
    include: { menteeprofile: true },
    take: 3
  });

  if (mentors.length === 0 || mentees.length === 0) {
    console.error('❌ No mentors or mentees found. Please run seed:full first.');
    return;
  }

  console.log(`Found ${mentors.length} mentors and ${mentees.length} mentees\n`);

  // Create schedules and bookings for testing
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Create test schedules
  console.log('📅 Creating test schedules...');
  const schedule1 = await prisma.schedule.create({
    data: {
      mentorId: mentors[0].id,
      topic: 'React and Frontend Development',
      description: 'Available for React, JavaScript, and modern frontend topics',
      startAt: tomorrow,
      endAt: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000), // 8 hours
      capacity: 3,
      status: 'AVAILABLE'
    }
  });

  const schedule2 = await prisma.schedule.create({
    data: {
      mentorId: mentors[1].id,
      topic: 'Machine Learning and AI',
      description: 'Deep learning, neural networks, and AI concepts',
      startAt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000), // Day after tomorrow
      endAt: new Date(tomorrow.getTime() + 32 * 60 * 60 * 1000), // 8 hours
      capacity: 2,
      status: 'AVAILABLE'
    }
  });

  const schedule3 = await prisma.schedule.create({
    data: {
      mentorId: mentors[2].id,
      topic: 'Backend Development',
      description: 'Node.js, databases, and API design',
      startAt: new Date(tomorrow.getTime() + 48 * 60 * 60 * 1000), // 2 days later
      endAt: new Date(tomorrow.getTime() + 58 * 60 * 60 * 1000), // 10 hours
      capacity: 5,
      status: 'AVAILABLE'
    }
  });

  console.log(`✅ Created 3 schedules\n`);

  // Create bookings
  console.log('📝 Creating test bookings...');
  const bookings = await Promise.all([
    // Booking for SCHEDULED session (tomorrow)
    prisma.booking.create({
      data: {
        scheduleId: schedule1.id,
        menteeId: mentees[0].id,
        status: 'CONFIRMED'
      }
    }),
    // Booking for SCHEDULED session 
    prisma.booking.create({
      data: {
        scheduleId: schedule2.id,
        menteeId: mentees[1].id,
        status: 'CONFIRMED'
      }
    }),
    // Booking for IN_PROGRESS session
    prisma.booking.create({
      data: {
        scheduleId: schedule3.id,
        menteeId: mentees[2].id,
        status: 'CONFIRMED'
      }
    }),
    // Booking for COMPLETED session (yesterday)
    prisma.booking.create({
      data: {
        scheduleId: schedule1.id,
        menteeId: mentees[1].id,
        status: 'CONFIRMED'
      }
    }),
    // Booking for COMPLETED session (2 days ago)
    prisma.booking.create({
      data: {
        scheduleId: schedule2.id,
        menteeId: mentees[2].id,
        status: 'CONFIRMED'
      }
    })
  ]);

  console.log(`✅ Created ${bookings.length} bookings\n`);

  // Create sessions with different states
  console.log('🎓 Creating test sessions...');
  
  const sessions = [
    // 1. SCHEDULED session - ready to START (tomorrow)
    {
      bookingId: bookings[0].id,
      mentorId: mentors[0].id,
      menteeId: mentees[0].id,
      status: 'SCHEDULED' as const,
      autoStarted: false,
      autoEnded: false,
      notes: null
    },
    // 2. SCHEDULED session - will auto-start soon (in 2 hours)
    {
      bookingId: bookings[1].id,
      mentorId: mentors[1].id,
      menteeId: mentees[1].id,
      status: 'SCHEDULED' as const,
      autoStarted: false,
      autoEnded: false,
      notes: null
    },
    // 3. IN_PROGRESS session - ready to END (manually started 1 hour ago)
    {
      bookingId: bookings[2].id,
      mentorId: mentors[0].id,
      menteeId: mentees[2].id,
      startedAt: oneHourAgo,
      status: 'IN_PROGRESS' as const,
      autoStarted: false,
      autoEnded: false,
      notes: 'Discussing advanced React patterns and performance optimization.'
    },
    // 4. COMPLETED session - with feedback (yesterday, manually started/ended)
    {
      bookingId: bookings[3].id,
      mentorId: mentors[1].id,
      menteeId: mentees[0].id,
      startedAt: yesterday,
      endedAt: new Date(yesterday.getTime() + 90 * 60 * 1000),
      status: 'COMPLETED' as const,
      autoStarted: false,
      autoEnded: false,
      notes: 'Great session! Covered TypeScript fundamentals and best practices.'
    },
    // 5. COMPLETED session - auto started/ended (2 days ago)
    {
      bookingId: bookings[4].id,
      mentorId: mentors[2].id,
      menteeId: mentees[1].id,
      startedAt: twoDaysAgo,
      endedAt: new Date(twoDaysAgo.getTime() + 2 * 60 * 60 * 1000),
      status: 'COMPLETED' as const,
      autoStarted: true,
      autoEnded: true,
      notes: 'Explored Node.js backend architecture and RESTful API design.'
    }
  ];

  const createdSessions = [];
  for (const session of sessions) {
    const created = await prisma.session.create({
      data: session
    });
    createdSessions.push(created);
    console.log(`  ✓ Session ${created.id}: ${session.status}`);
  }

  console.log(`\n✅ Created ${createdSessions.length} sessions\n`);

  // Create feedbacks for completed sessions
  console.log('⭐ Creating feedbacks...');
  
  const feedbacks = [
    {
      sessionId: createdSessions[3].id, // Completed session (manually)
      mentorId: mentors[1].id,
      menteeId: mentees[0].id,
      rating: 5,
      comment: 'Mentor rất nhiệt tình! Giải thích TypeScript rất chi tiết và dễ hiểu. Highly recommended! 🎯'
    },
    {
      sessionId: createdSessions[4].id, // Completed session (auto)
      mentorId: mentors[2].id,
      menteeId: mentees[1].id,
      rating: 4,
      comment: 'Session rất hữu ích. Node.js architecture được giải thích rõ ràng. Cần thêm ví dụ thực tế. 👍'
    }
  ];

  for (const feedback of feedbacks) {
    await prisma.feedback.create({ data: feedback });
  }

  console.log(`✅ Created ${feedbacks.length} feedbacks\n`);

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ SEED COMPLETED - TEST DATA SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📊 Sessions Created:');
  console.log(`  • SCHEDULED (ready to START):   ${sessions.filter(s => s.status === 'SCHEDULED').length}`);
  console.log(`  • IN_PROGRESS (ready to END):   ${sessions.filter(s => s.status === 'IN_PROGRESS').length}`);
  console.log(`  • COMPLETED (with feedback):    ${sessions.filter(s => s.status === 'COMPLETED').length}`);
  
  console.log('\n🧪 Testing Scenarios:');
  console.log(`  1️⃣  Test START button → Session ${createdSessions[0].id} (SCHEDULED)`);
  console.log(`  2️⃣  Test END button   → Session ${createdSessions[2].id} (IN_PROGRESS)`);
  console.log(`  3️⃣  View completed    → Session ${createdSessions[3].id}, ${createdSessions[4].id}`);
  console.log(`  4️⃣  Auto-start badge  → Session ${createdSessions[4].id} (auto-started)`);
  
  console.log('\n👤 Test Users:');
  console.log(`  Mentor 1: ${mentors[0].email} (ID: ${mentors[0].id})`);
  console.log(`  Mentor 2: ${mentors[1].email} (ID: ${mentors[1].id})`);
  console.log(`  Mentor 3: ${mentors[2].email} (ID: ${mentors[2].id})`);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
