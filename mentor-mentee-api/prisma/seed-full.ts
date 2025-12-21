import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FULL seed with comprehensive data...\n');

  // Clear existing data (except RBAC and Admin)
  console.log('🧹 Cleaning existing data...');
  await prisma.postimage.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.session.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.menteeTopicInterest.deleteMany();
  await prisma.mentorTopicExpertise.deleteMany();
  await prisma.menteeprofile.deleteMany();
  await prisma.mentorprofile.deleteMany();
  
  await prisma.user.deleteMany({
    where: {
      role: { in: ['MENTEE', 'MENTOR'] }
    }
  });
  console.log('✅ Cleaned existing data\n');

  // Get role IDs
  const mentorRole = await prisma.role.findUnique({ where: { name: 'MENTOR' } });
  const menteeRole = await prisma.role.findUnique({ where: { name: 'MENTEE' } });

  if (!mentorRole || !menteeRole) {
    throw new Error('❌ Roles not found! Please run: npm run seed:rbac');
  }

  // Get topics
  const topics = await prisma.topic.findMany();
  if (topics.length === 0) {
    throw new Error('❌ Topics not found! Please run: npm run seed:topics');
  }

  const topicMap = new Map(topics.map(t => [t.name, t.id]));

  const hashedPassword = await bcrypt.hash('123456', 10);

  // ============= MENTEES =============
  console.log('👤 Creating mentee users...');
  
  const mentees = [
    {
      email: 'mentee1@example.com',
      fullName: 'Nguyễn Văn An',
      phoneNumber: '+84901234567',
      goals: 'Muốn trở thành Full-stack Developer trong 2 năm tới',
      interests: ['Web Development', 'Mobile Development']
    },
    {
      email: 'mentee2@example.com',
      fullName: 'Trần Thị Bình',
      phoneNumber: '+84902345678',
      goals: 'Học AI để làm nghiên cứu khoa học',
      interests: ['Data Science', 'Software Architecture']
    },
    {
      email: 'mentee3@example.com',
      fullName: 'Lê Văn Cường',
      phoneNumber: '+84903456789',
      goals: 'Chuyển sang làm DevOps Engineer',
      interests: ['DevOps', 'Cloud Computing']
    },
    {
      email: 'mentee4@example.com',
      fullName: 'Phạm Thị Diễm',
      phoneNumber: '+84904567890',
      goals: 'Trở thành UI/UX Designer chuyên nghiệp',
      interests: ['UI/UX Design', 'Web Development']
    },
    {
      email: 'mentee5@example.com',
      fullName: 'Hoàng Văn Em',
      phoneNumber: '+84905678901',
      goals: 'Học security để bảo vệ hệ thống',
      interests: ['Cybersecurity', 'Database']
    },
    {
      email: 'mentee6@example.com',
      fullName: 'Vũ Thị Phương',
      phoneNumber: '+84906789012',
      goals: 'Phát triển game indie',
      interests: ['Game Development', 'Software Architecture']
    },
    {
      email: 'mentee7@example.com',
      fullName: 'Đỗ Văn Giang',
      phoneNumber: '+84907890123',
      goals: 'Chuẩn bị cho phỏng vấn Senior Developer',
      interests: ['Career Development', 'Software Architecture']
    },
    {
      email: 'mentee8@example.com',
      fullName: 'Ngô Thị Hà',
      phoneNumber: '+84908901234',
      goals: 'Tìm hiểu về Blockchain và Web3',
      interests: ['Blockchain', 'Web Development']
    },
    {
      email: 'mentee9@example.com',
      fullName: 'Nguyễn Minh Khoa',
      phoneNumber: '+84909012345',
      goals: 'Học testing và QA để làm QA Engineer',
      interests: ['Testing & QA', 'Software Architecture']
    },
    {
      email: 'mentee10@example.com',
      fullName: 'Lê Thị Linh',
      phoneNumber: '+84910123456',
      goals: 'Project Management và Agile',
      interests: ['Project Management', 'Soft Skills']
    },
    {
      email: 'mentee11@example.com',
      fullName: 'Phạm Văn Minh',
      phoneNumber: '+84911234567',
      goals: 'Backend Development với microservices',
      interests: ['Web Development', 'Software Architecture', 'Cloud Computing']
    },
    {
      email: 'mentee12@example.com',
      fullName: 'Trần Thị Nga',
      phoneNumber: '+84912345678',
      goals: 'Chuyên về database optimization',
      interests: ['Database', 'Software Architecture']
    },
    {
      email: 'mentee13@example.com',
      fullName: 'Hoàng Văn Oanh',
      phoneNumber: '+84913456789',
      goals: 'Làm iOS Developer',
      interests: ['Mobile Development', 'UI/UX Design']
    },
    {
      email: 'mentee14@example.com',
      fullName: 'Đặng Thị Phương',
      phoneNumber: '+84914567890',
      goals: 'Machine Learning Engineer',
      interests: ['Data Science', 'Software Architecture']
    },
    {
      email: 'mentee15@example.com',
      fullName: 'Vũ Văn Quang',
      phoneNumber: '+84915678901',
      goals: 'Cloud Architect',
      interests: ['Cloud Computing', 'DevOps', 'Software Architecture']
    }
  ];

  const createdMentees = [];
  for (const mentee of mentees) {
    const user = await prisma.user.create({
      data: {
        email: mentee.email,
        password: hashedPassword,
        role: 'MENTEE',
        roleId: menteeRole.id,
        updatedAt: new Date(),
        menteeprofile: {
          create: {
            fullName: mentee.fullName,
            phoneNumber: mentee.phoneNumber,
            goals: mentee.goals,
            interests: {
              create: mentee.interests
                .map(topicName => topicMap.get(topicName))
                .filter(id => id !== undefined)
                .map(topicId => ({ topicId }))
            }
          }
        }
      }
    });
    createdMentees.push(user);
    console.log(`  ✓ ${mentee.fullName}`);
  }
  console.log(`✅ Created ${createdMentees.length} mentees\n`);

  // ============= MENTORS =============
  console.log('👨‍🏫 Creating mentor users...');
  
  const mentors = [
    {
      email: 'mentor1@example.com',
      fullName: 'Trần Minh Tuấn',
      phoneNumber: '+84911234567',
      school: 'Đại học Bách Khoa Hà Nội',
      degree: 'Thạc sĩ Khoa học Máy tính',
      yearsExp: 7,
      bio: 'Full-stack Developer với 7 năm kinh nghiệm. Chuyên về React, Node.js, và PostgreSQL. Đã làm việc tại nhiều công ty startup và tập đoàn lớn.',
      expertise: ['Web Development', 'Database', 'Software Architecture']
    },
    {
      email: 'mentor2@example.com',
      fullName: 'Lê Thị Mai',
      phoneNumber: '+84912345678',
      school: 'Đại học Công nghệ - ĐHQGHN',
      degree: 'Tiến sĩ Trí tuệ Nhân tạo',
      yearsExp: 10,
      bio: 'AI Researcher và Data Scientist. Chuyên về Machine Learning, Deep Learning. Có nhiều bài báo khoa học quốc tế.',
      expertise: ['Data Science', 'Software Architecture', 'Testing & QA']
    },
    {
      email: 'mentor3@example.com',
      fullName: 'Nguyễn Hoàng Nam',
      phoneNumber: '+84913456789',
      school: 'Đại học FPT',
      degree: 'Cử nhân CNTT',
      yearsExp: 6,
      bio: 'DevOps Engineer tại công ty đa quốc gia. Chuyên về CI/CD, Docker, Kubernetes, AWS. Đam mê automation và infrastructure as code.',
      expertise: ['DevOps', 'Cloud Computing', 'Database']
    },
    {
      email: 'mentor4@example.com',
      fullName: 'Phạm Thanh Hà',
      phoneNumber: '+84914567890',
      school: 'Đại học Mỹ thuật Công nghiệp',
      degree: 'Thạc sĩ Thiết kế Đồ họa',
      yearsExp: 8,
      bio: 'Senior UI/UX Designer với 8 năm kinh nghiệm. Đã thiết kế cho nhiều ứng dụng có hàng triệu người dùng. Giảng viên kiêm nhiệm tại các trung tâm đào tạo.',
      expertise: ['UI/UX Design', 'Web Development', 'Mobile Development']
    },
    {
      email: 'mentor5@example.com',
      fullName: 'Vũ Đức Anh',
      phoneNumber: '+84915678901',
      school: 'Học viện Kỹ thuật Mật mã',
      degree: 'Thạc sĩ An toàn Thông tin',
      yearsExp: 9,
      bio: 'Cybersecurity Expert. Chuyên về penetration testing, security audit. CEH và OSCP certified. Đã phát hiện nhiều lỗ hổng bảo mật nghiêm trọng.',
      expertise: ['Cybersecurity', 'Database', 'Cloud Computing']
    },
    {
      email: 'mentor6@example.com',
      fullName: 'Đặng Thị Lan',
      phoneNumber: '+84916789012',
      school: 'Đại học RMIT',
      degree: 'Cử nhân Game Design',
      yearsExp: 5,
      bio: 'Game Developer với kinh nghiệm làm việc tại studio game nổi tiếng. Chuyên Unity và Unreal Engine. Đam mê storytelling và game mechanics.',
      expertise: ['Game Development', 'Software Architecture', 'Mobile Development']
    },
    {
      email: 'mentor7@example.com',
      fullName: 'Hoàng Quốc Việt',
      phoneNumber: '+84917890123',
      school: 'Đại học Bách Khoa TP.HCM',
      degree: 'Thạc sĩ Kỹ thuật Phần mềm',
      yearsExp: 12,
      bio: 'Tech Lead với 12 năm kinh nghiệm. Chuyên về system design, microservices, distributed systems. Mentor cho nhiều senior developers.',
      expertise: ['Software Architecture', 'Web Development', 'DevOps', 'Database']
    },
    {
      email: 'mentor8@example.com',
      fullName: 'Bùi Thị Ngọc',
      phoneNumber: '+84918901234',
      school: 'Đại học Ngoại thương',
      degree: 'MBA',
      yearsExp: 15,
      bio: 'Career Coach và Technical Recruiter. Đã phỏng vấn hơn 1000 ứng viên IT. Giúp developers chuẩn bị CV, phỏng vấn và career path.',
      expertise: ['Career Development', 'Soft Skills', 'Project Management']
    },
    {
      email: 'mentor9@example.com',
      fullName: 'Trịnh Văn Đức',
      phoneNumber: '+84919012345',
      school: 'Stanford University',
      degree: 'PhD Computer Science',
      yearsExp: 8,
      bio: 'Blockchain Developer và Web3 Expert. Founder của startup blockchain. Chuyên về smart contracts, DeFi, và NFT.',
      expertise: ['Blockchain', 'Web Development', 'Software Architecture']
    },
    {
      email: 'mentor10@example.com',
      fullName: 'Lương Thị Hương',
      phoneNumber: '+84920123456',
      school: 'Đại học Công nghệ',
      degree: 'Thạc sĩ Mobile Computing',
      yearsExp: 6,
      bio: 'Mobile Developer chuyên React Native và Flutter. Đã phát triển hơn 20 ứng dụng mobile thành công trên cả iOS và Android.',
      expertise: ['Mobile Development', 'Web Development', 'UI/UX Design']
    },
    {
      email: 'mentor11@example.com',
      fullName: 'Nguyễn Thị Rồng',
      phoneNumber: '+84921234567',
      school: 'Đại học Bách Khoa',
      degree: 'Thạc sĩ Software Testing',
      yearsExp: 7,
      bio: 'QA Lead với kinh nghiệm test automation. Chuyên Selenium, Cypress, Jest. Đã build test framework cho nhiều dự án lớn.',
      expertise: ['Testing & QA', 'Web Development', 'Software Architecture']
    },
    {
      email: 'mentor12@example.com',
      fullName: 'Trần Văn Sơn',
      phoneNumber: '+84922345678',
      school: 'Đại học FPT',
      degree: 'MBA + PMP Certified',
      yearsExp: 10,
      bio: 'Technical Project Manager. Quản lý các dự án Agile/Scrum. Giúp teams làm việc hiệu quả và deliver on time.',
      expertise: ['Project Management', 'Soft Skills', 'Career Development']
    },
    {
      email: 'mentor13@example.com',
      fullName: 'Lê Thị Tâm',
      phoneNumber: '+84923456789',
      school: 'Đại học Công nghệ TP.HCM',
      degree: 'Tiến sĩ Database Systems',
      yearsExp: 11,
      bio: 'Database Expert. Chuyên PostgreSQL, MongoDB, Redis. Performance tuning, indexing, sharding. Consultant cho nhiều enterprise.',
      expertise: ['Database', 'Software Architecture', 'Cloud Computing']
    },
    {
      email: 'mentor14@example.com',
      fullName: 'Phạm Văn Ưng',
      phoneNumber: '+84924567890',
      school: 'Đại học Quốc gia Singapore',
      degree: 'Thạc sĩ Computer Vision',
      yearsExp: 8,
      bio: 'AI/ML Engineer chuyên Computer Vision. Object detection, image segmentation. Published research papers.',
      expertise: ['Data Science', 'Software Architecture', 'Mobile Development']
    },
    {
      email: 'mentor15@example.com',
      fullName: 'Đỗ Thị Vân',
      phoneNumber: '+84925678901',
      school: 'Đại học Carnegie Mellon',
      degree: 'PhD Distributed Systems',
      yearsExp: 13,
      bio: 'Cloud Solutions Architect. AWS/Azure/GCP certified. Design scalable systems cho millions of users. Tech advisor cho startups.',
      expertise: ['Cloud Computing', 'Software Architecture', 'DevOps', 'Database']
    }
  ];

  const createdMentors = [];
  for (const mentor of mentors) {
    const user = await prisma.user.create({
      data: {
        email: mentor.email,
        password: hashedPassword,
        role: 'MENTOR',
        roleId: mentorRole.id,
        updatedAt: new Date(),
        mentorprofile: {
          create: {
            fullName: mentor.fullName,
            phoneNumber: mentor.phoneNumber,
            school: mentor.school,
            degree: mentor.degree,
            yearsExp: mentor.yearsExp,
            bio: mentor.bio,
            expertise: {
              create: mentor.expertise
                .map(topicName => topicMap.get(topicName))
                .filter(id => id !== undefined)
                .map(topicId => ({ topicId }))
            }
          }
        }
      }
    });
    createdMentors.push(user);
    console.log(`  ✓ ${mentor.fullName}`);
  }
  console.log(`✅ Created ${createdMentors.length} mentors\n`);

  // ============= POSTS =============
  console.log('📝 Creating posts...');
  
  const posts = [
    {
      authorId: createdMentors[0].id,
      title: 'Top 10 React Hooks bạn nên biết',
      content: `React Hooks đã thay đổi cách chúng ta viết React components. Dưới đây là 10 hooks quan trọng nhất:

1. useState - Quản lý state
2. useEffect - Side effects
3. useContext - Context API
4. useReducer - Complex state logic
5. useCallback - Memoize functions
6. useMemo - Memoize values
7. useRef - DOM references
8. useLayoutEffect - Sync effects
9. useImperativeHandle - Custom refs
10. useDebugValue - DevTools labels

Mỗi hook có use case riêng, hãy học cách sử dụng chúng đúng cách!`,
      isPublic: true
    },
    {
      authorId: createdMentors[0].id,
      title: 'TypeScript Best Practices 2025',
      content: `TypeScript giúp code JavaScript của bạn an toàn hơn. Một số best practices:

- Sử dụng strict mode
- Tránh any type
- Dùng interface cho object types
- Type guards cho type narrowing
- Generics cho reusable components
- Utility types như Partial, Pick, Omit

TypeScript không chỉ là "JavaScript with types" mà còn là tool mạnh mẽ cho code quality!`,
      isPublic: true
    },
    {
      authorId: createdMentors[1].id,
      title: 'Machine Learning cho người mới bắt đầu',
      content: `Bắt đầu học ML có thể overwhelming. Roadmap đơn giản:

**Nền tảng:**
- Python programming
- NumPy, Pandas
- Matplotlib, Seaborn
- Linear Algebra, Statistics

**ML Basics:**
- Supervised vs Unsupervised Learning
- Classification, Regression
- Scikit-learn library

**Deep Learning:**
- Neural Networks
- TensorFlow/PyTorch
- CNNs, RNNs, Transformers

Quan trọng nhất: thực hành với các dataset thực tế!`,
      isPublic: true
    },
    {
      authorId: createdMentors[2].id,
      title: 'Docker vs Kubernetes - Khi nào dùng cái nào?',
      content: `Docker và Kubernetes thường bị nhầm lẫn:

**Docker:**
- Container platform
- Đóng gói ứng dụng
- Development environment
- Đơn giản, dễ học

**Kubernetes:**
- Container orchestration
- Quản lý nhiều containers
- Auto-scaling, load balancing
- Production-ready

**Khi nào dùng?**
- Docker: Dev environment, small apps
- K8s: Production, microservices, large scale

Bắt đầu với Docker, sau đó học K8s khi cần scale!`,
      isPublic: true
    },
    {
      authorId: createdMentors[3].id,
      title: 'UI/UX Design Principles mọi developer nên biết',
      content: `Không phải ai cũng là designer, nhưng developer nên hiểu cơ bản:

**Visual Hierarchy:**
- Size, color, contrast
- Whitespace matters
- Typography choices

**User Flow:**
- Minimize clicks
- Clear navigation
- Consistent patterns

**Accessibility:**
- Color contrast
- Keyboard navigation
- Screen reader support

**Mobile First:**
- Responsive design
- Touch-friendly
- Performance

Good UX = Happy users = Successful product!`,
      isPublic: true
    },
    {
      authorId: createdMentors[4].id,
      title: 'Cybersecurity 101: Bảo vệ ứng dụng web của bạn',
      content: `Web security không phải optional. Top vulnerabilities:

**1. SQL Injection**
- Dùng parameterized queries
- ORM frameworks
- Input validation

**2. XSS (Cross-Site Scripting)**
- Sanitize user input
- Content Security Policy
- HttpOnly cookies

**3. Authentication Issues**
- Hash passwords (bcrypt)
- JWT best practices
- Multi-factor authentication

**4. CSRF**
- CSRF tokens
- SameSite cookies
- CORS properly

**5. Security Misconfiguration**
- Update dependencies
- Secure headers
- Environment variables

Bảo mật là quá trình liên tục, không phải một lần!`,
      isPublic: true
    },
    {
      authorId: createdMentors[5].id,
      title: 'Game Development với Unity - Từ đâu bắt đầu?',
      content: `Muốn làm game? Unity là lựa chọn tốt để bắt đầu:

**Cơ bản:**
- C# programming
- Unity Editor
- GameObjects và Components
- Scenes và Prefabs

**Core Concepts:**
- Physics Engine
- Animation System
- Audio Management
- UI System

**Advanced:**
- State Machines
- AI Behavior
- Multiplayer Networking
- Optimization

**Resources:**
- Unity Learn (miễn phí!)
- Brackeys YouTube
- Practice với small projects

Tip: Bắt đầu với game đơn giản như Pong, Flappy Bird clone!`,
      isPublic: true
    },
    {
      authorId: createdMentors[6].id,
      title: 'System Design Interview - Cách approach',
      content: `System design interview có thể intimidating. Framework để follow:

**1. Requirements (5 phút)**
- Functional requirements
- Non-functional requirements
- Constraints và assumptions

**2. High-level Design (10 phút)**
- Major components
- How they interact
- API endpoints

**3. Deep Dive (15 phút)**
- Database schema
- Caching strategy
- Load balancing
- Scaling approach

**4. Trade-offs (5 phút)**
- Discuss alternatives
- Why your choices
- What could go wrong

**Key Principles:**
- Think out loud
- Ask clarifying questions
- Consider scalability
- Know trade-offs

Practice với các bài như: Design Twitter, Design URL Shortener, Design Netflix!`,
      isPublic: true
    },
    {
      authorId: createdMentors[7].id,
      title: 'Career Path cho Software Developer',
      content: `Nhiều developers không rõ career path. Đây là overview:

**Junior (0-2 years)**
- Learn tech stack
- Code quality
- Git workflow
- Team collaboration

**Mid-level (2-5 years)**
- Feature ownership
- System design basics
- Mentoring juniors
- Technical decisions

**Senior (5-8 years)**
- Architecture decisions
- Cross-team collaboration
- Technical leadership
- Project planning

**Beyond Senior:**
- Staff/Principal: Deep technical expert
- Tech Lead: Technical + people management
- Engineering Manager: Focus on people
- Architect: System-wide design

Không có "đúng" path, chọn theo passion!`,
      isPublic: true
    },
    {
      authorId: createdMentors[8].id,
      title: 'Web3 và Blockchain - Hype hay Future?',
      content: `Blockchain và Web3 controversial, nhưng đáng tìm hiểu:

**Core Concepts:**
- Distributed ledger
- Smart contracts
- Consensus mechanisms
- Cryptography basics

**Popular Platforms:**
- Ethereum (Solidity)
- Solana (Rust)
- Polygon (Layer 2)
- BSC (EVM compatible)

**Applications:**
- DeFi (Decentralized Finance)
- NFTs (Digital ownership)
- DAOs (Governance)
- DApps (Decentralized Apps)

**Reality Check:**
- High gas fees
- Scalability issues
- Environmental concerns
- Regulation uncertainty

Learn nền tảng blockchain, nhưng realistic về challenges!`,
      isPublic: true
    },
    {
      authorId: createdMentors[9].id,
      title: 'React Native vs Flutter - Chọn gì cho Mobile App?',
      content: `Cross-platform mobile development: React Native hay Flutter?

**React Native:**
✅ JavaScript (web dev familiar)
✅ Large community
✅ Many libraries
✅ Hot reload
❌ Native modules tricky
❌ Performance issues

**Flutter:**
✅ Fast performance
✅ Beautiful UI out-of-box
✅ Hot reload
✅ Single codebase
❌ Dart language (learning curve)
❌ Larger app size

**Khi nào dùng?**
- RN: Team có web devs, many third-party integrations
- Flutter: Performance critical, custom UI, new project

Cả hai đều tốt, chọn theo team và project requirements!`,
      isPublic: true
    }
  ];

  const createdPosts = [];
  for (const post of posts) {
    const created = await prisma.post.create({
      data: {
        ...post,
        updatedAt: new Date(),
      }
    });
    createdPosts.push(created);
  }
  console.log(`✅ Created ${createdPosts.length} posts\n`);

  // ============= LIKES =============
  console.log('❤️ Creating likes...');
  
  // Mentees like mentor posts
  for (let i = 0; i < 5; i++) {
    await prisma.like.create({
      data: {
        postId: createdPosts[i].id,
        userId: createdMentees[i % createdMentees.length].id,
      }
    });
  }
  console.log('✅ Created likes\n');

  // ============= SCHEDULES =============
  console.log('📅 Creating schedules...');
  
  const now = new Date();
  const schedules = [];

  // Helper function to create date
  const createDate = (daysFromNow: number, hour: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  const scheduleData = [
    {
      mentorId: createdMentors[0].id,
      topic: 'React Hooks Deep Dive',
      description: 'Tìm hiểu chi tiết về các React Hooks: useState, useEffect, useContext, useReducer, useMemo, useCallback. Hands-on coding session.',
      startAt: createDate(2, 14),
      endAt: createDate(2, 16),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[0].id,
      topic: 'TypeScript for React Developers',
      description: 'Học cách sử dụng TypeScript với React. Type-safe components, props, hooks. Best practices và common patterns.',
      startAt: createDate(5, 10),
      endAt: createDate(5, 12),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[1].id,
      topic: 'Introduction to Neural Networks',
      description: 'Giới thiệu về Neural Networks: perceptrons, activation functions, backpropagation. Thực hành với TensorFlow.',
      startAt: createDate(3, 9),
      endAt: createDate(3, 12),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[1].id,
      topic: 'Computer Vision với OpenCV',
      description: 'Xử lý ảnh và video với OpenCV. Object detection, face recognition, image classification.',
      startAt: createDate(7, 14),
      endAt: createDate(7, 17),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[2].id,
      topic: 'Docker Fundamentals',
      description: 'Docker từ cơ bản đến nâng cao: Dockerfile, docker-compose, multi-stage builds, volumes, networks.',
      startAt: createDate(1, 13),
      endAt: createDate(1, 15),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[2].id,
      topic: 'Kubernetes for Beginners',
      description: 'Kubernetes basics: pods, services, deployments, configmaps, secrets. Deploy ứng dụng lên K8s cluster.',
      startAt: createDate(8, 10),
      endAt: createDate(8, 13),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[3].id,
      topic: 'UI/UX Design Workshop',
      description: 'Figma workshop: wireframes, prototypes, design systems. Học cách design responsive web app.',
      startAt: createDate(4, 14),
      endAt: createDate(4, 17),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[4].id,
      topic: 'Web Application Security',
      description: 'Tìm hiểu các lỗ hổng bảo mật phổ biến: SQL Injection, XSS, CSRF. Cách phòng tránh và test.',
      startAt: createDate(6, 15),
      endAt: createDate(6, 18),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[5].id,
      topic: 'Unity Game Development Basics',
      description: 'Tạo game 2D đơn giản với Unity. Physics, animations, UI, scripting with C#.',
      startAt: createDate(3, 13),
      endAt: createDate(3, 16),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[6].id,
      topic: 'System Design: Design Instagram',
      description: 'System design interview practice: Design Instagram. Requirements, high-level design, database schema, scaling strategy.',
      startAt: createDate(5, 14),
      endAt: createDate(5, 17),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[7].id,
      topic: 'Resume & Interview Preparation',
      description: 'Cách viết CV tech ấn tượng. Mock interview practice. Behavioral questions. Salary negotiation tips.',
      startAt: createDate(2, 18),
      endAt: createDate(2, 20),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[8].id,
      topic: 'Smart Contract Development',
      description: 'Viết smart contract với Solidity. Deploy lên testnet. Web3.js integration. Security best practices.',
      startAt: createDate(9, 10),
      endAt: createDate(9, 13),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[9].id,
      topic: 'React Native: Build Todo App',
      description: 'Hands-on: Build todo app với React Native. Navigation, AsyncStorage, styled-components.',
      startAt: createDate(4, 9),
      endAt: createDate(4, 12),
      capacity: 1, // 1-on-1 mentoring session
      status: 'AVAILABLE' as const
    },
    // New schedules from mentors 11-15
    {
      mentorId: createdMentors[10].id,
      topic: 'Test Automation with Cypress',
      description: 'E2E testing với Cypress. Setup, best practices, CI/CD integration. Viết tests cho real-world apps.',
      startAt: createDate(3, 10),
      endAt: createDate(3, 13),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[10].id,
      topic: 'Unit Testing Best Practices',
      description: 'Jest và React Testing Library. Test-driven development, mocking, coverage. Viết tests maintainable.',
      startAt: createDate(6, 9),
      endAt: createDate(6, 11),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[11].id,
      topic: 'Agile & Scrum Workshop',
      description: 'Scrum framework, sprint planning, daily standups, retrospectives. Làm việc hiệu quả trong team.',
      startAt: createDate(4, 13),
      endAt: createDate(4, 16),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[11].id,
      topic: 'Leadership Skills for Developers',
      description: 'Technical leadership, mentoring juniors, decision making. Communication skills cho tech leads.',
      startAt: createDate(7, 10),
      endAt: createDate(7, 12),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[12].id,
      topic: 'PostgreSQL Performance Tuning',
      description: 'Query optimization, indexing strategies, EXPLAIN ANALYZE. Giải quyết N+1 queries, slow queries.',
      startAt: createDate(2, 9),
      endAt: createDate(2, 12),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[12].id,
      topic: 'MongoDB & NoSQL Design',
      description: 'Document database design patterns. Sharding, replication, aggregation pipeline. Khi nào dùng NoSQL.',
      startAt: createDate(8, 14),
      endAt: createDate(8, 17),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[13].id,
      topic: 'Deep Learning with PyTorch',
      description: 'Neural networks với PyTorch. CNNs, transfer learning, training tips. Build image classifier.',
      startAt: createDate(5, 9),
      endAt: createDate(5, 13),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[13].id,
      topic: 'Natural Language Processing',
      description: 'NLP fundamentals, word embeddings, transformers, BERT. Build chatbot with Hugging Face.',
      startAt: createDate(9, 10),
      endAt: createDate(9, 14),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[14].id,
      topic: 'AWS Cloud Architecture',
      description: 'EC2, S3, RDS, Lambda, API Gateway. Serverless architecture, cost optimization. Deploy production apps.',
      startAt: createDate(3, 14),
      endAt: createDate(3, 17),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[14].id,
      topic: 'Microservices with Docker & K8s',
      description: 'Thiết kế microservices, service mesh, monitoring. Deploy lên Kubernetes cluster.',
      startAt: createDate(6, 13),
      endAt: createDate(6, 17),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[0].id,
      topic: 'GraphQL API Development',
      description: 'Build GraphQL API với Apollo Server. Schema design, resolvers, subscriptions, authentication.',
      startAt: createDate(7, 9),
      endAt: createDate(7, 12),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[1].id,
      topic: 'Data Visualization with D3.js',
      description: 'Interactive charts và dashboards. D3.js fundamentals, real-time data visualization.',
      startAt: createDate(9, 14),
      endAt: createDate(9, 17),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[2].id,
      topic: 'CI/CD Pipeline Setup',
      description: 'GitHub Actions, GitLab CI, Jenkins. Automated testing, deployment. Infrastructure as code.',
      startAt: createDate(4, 10),
      endAt: createDate(4, 13),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[3].id,
      topic: 'Design System Creation',
      description: 'Xây dựng design system scalable. Component library, design tokens, documentation.',
      startAt: createDate(8, 9),
      endAt: createDate(8, 12),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[4].id,
      topic: 'OAuth 2.0 & Authentication',
      description: 'JWT, OAuth flows, security best practices. Implement social login, SSO.',
      startAt: createDate(5, 13),
      endAt: createDate(5, 16),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    // Additional schedules for more test data
    {
      mentorId: createdMentors[5].id,
      topic: 'Unity 3D Game Development',
      description: '3D game development basics. Camera controls, lighting, particle systems.',
      startAt: createDate(10, 14),
      endAt: createDate(10, 17),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[6].id,
      topic: 'Microservices Architecture',
      description: 'Design microservices, API gateway, service discovery, event-driven architecture.',
      startAt: createDate(11, 9),
      endAt: createDate(11, 13),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[7].id,
      topic: 'Negotiation Skills Workshop',
      description: 'Salary negotiation, project scope negotiation, conflict resolution.',
      startAt: createDate(12, 15),
      endAt: createDate(12, 17),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[8].id,
      topic: 'DeFi Protocol Development',
      description: 'Build DeFi protocol: lending, staking, yield farming. Smart contract security.',
      startAt: createDate(13, 10),
      endAt: createDate(13, 14),
      capacity: 1,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[9].id,
      topic: 'Flutter Advanced Topics',
      description: 'State management (Riverpod), animations, performance optimization.',
      startAt: createDate(14, 13),
      endAt: createDate(14, 16),
      capacity: 1,
      status: 'AVAILABLE' as const
    }
  ];

  for (const schedule of scheduleData) {
    const created = await prisma.schedule.create({
      data: schedule
    });
    schedules.push(created);
  }
  console.log(`✅ Created ${schedules.length} schedules\n`);

  // ============= BOOKINGS =============
  console.log('📋 Creating bookings...');
  
  const bookings = [
    // Confirmed bookings - có sessions
    {
      scheduleId: schedules[0].id,
      menteeId: createdMentees[0].id,
      status: 'CONFIRMED' as const,
      notes: 'Muốn học về custom hooks và performance optimization'
    },
    {
      scheduleId: schedules[2].id,
      menteeId: createdMentees[1].id,
      status: 'CONFIRMED' as const,
      notes: 'Quan tâm đến CNN và image classification'
    },
    {
      scheduleId: schedules[4].id,
      menteeId: createdMentees[2].id,
      status: 'CONFIRMED' as const,
      notes: 'Cần học Docker cho dự án công ty'
    },
    {
      scheduleId: schedules[6].id,
      menteeId: createdMentees[3].id,
      status: 'CONFIRMED' as const,
      notes: 'Portfolio cần improve UI/UX'
    },
    {
      scheduleId: schedules[8].id,
      menteeId: createdMentees[4].id,
      status: 'CONFIRMED' as const,
      notes: 'Chuẩn bị cho phỏng vấn security engineer'
    },
    {
      scheduleId: schedules[13].id,
      menteeId: createdMentees[5].id,
      status: 'CONFIRMED' as const,
      notes: 'Làm indie game đầu tiên'
    },
    {
      scheduleId: schedules[15].id,
      menteeId: createdMentees[6].id,
      status: 'CONFIRMED' as const,
      notes: 'Học Cypress cho automation testing'
    },
    {
      scheduleId: schedules[17].id,
      menteeId: createdMentees[7].id,
      status: 'CONFIRMED' as const,
      notes: 'Team đang áp dụng Scrum'
    },
    {
      scheduleId: schedules[19].id,
      menteeId: createdMentees[8].id,
      status: 'CONFIRMED' as const,
      notes: 'Database đang slow, cần optimize'
    },
    {
      scheduleId: schedules[21].id,
      menteeId: createdMentees[9].id,
      status: 'CONFIRMED' as const,
      notes: 'Build ML model cho dự án tốt nghiệp'
    },
    // Pending bookings - chờ mentor xác nhận
    {
      scheduleId: schedules[1].id,
      menteeId: createdMentees[10].id,
      status: 'PENDING' as const,
      notes: 'TypeScript beginner, cần guidance'
    },
    {
      scheduleId: schedules[3].id,
      menteeId: createdMentees[11].id,
      status: 'PENDING' as const,
      notes: 'Quan tâm computer vision applications'
    },
    {
      scheduleId: schedules[5].id,
      menteeId: createdMentees[12].id,
      status: 'PENDING' as const,
      notes: 'Muốn deploy app lên K8s'
    },
    {
      scheduleId: schedules[7].id,
      menteeId: createdMentees[13].id,
      status: 'PENDING' as const,
      notes: 'Penetration testing cơ bản'
    },
    {
      scheduleId: schedules[9].id,
      menteeId: createdMentees[14].id,
      status: 'PENDING' as const,
      notes: 'Unity 2D game development'
    },
    {
      scheduleId: schedules[11].id,
      menteeId: createdMentees[0].id,
      status: 'PENDING' as const,
      notes: 'Chuẩn bị mock interview'
    },
    {
      scheduleId: schedules[14].id,
      menteeId: createdMentees[1].id,
      status: 'PENDING' as const,
      notes: 'Unit testing best practices'
    },
    {
      scheduleId: schedules[16].id,
      menteeId: createdMentees[2].id,
      status: 'PENDING' as const,
      notes: 'Leadership skills cho tech lead'
    },
    {
      scheduleId: schedules[18].id,
      menteeId: createdMentees[3].id,
      status: 'PENDING' as const,
      notes: 'MongoDB cho scalable app'
    },
    {
      scheduleId: schedules[20].id,
      menteeId: createdMentees[4].id,
      status: 'PENDING' as const,
      notes: 'NLP cho chatbot'
    },
    // Additional bookings
    {
      scheduleId: schedules[22].id,
      menteeId: createdMentees[5].id,
      status: 'PENDING' as const,
      notes: 'Muốn học CI/CD pipeline'
    },
    {
      scheduleId: schedules[23].id,
      menteeId: createdMentees[6].id,
      status: 'PENDING' as const,
      notes: 'Tìm hiểu design system'
    },
    {
      scheduleId: schedules[24].id,
      menteeId: createdMentees[7].id,
      status: 'PENDING' as const,
      notes: 'OAuth 2.0 implementation'
    },
    {
      scheduleId: schedules[25].id,
      menteeId: createdMentees[8].id,
      status: 'CONFIRMED' as const,
      notes: 'Unity 3D cho dự án game'
    },
    {
      scheduleId: schedules[26].id,
      menteeId: createdMentees[9].id,
      status: 'CONFIRMED' as const,
      notes: 'Microservices architecture cho startup'
    },
    {
      scheduleId: schedules[27].id,
      menteeId: createdMentees[10].id,
      status: 'CONFIRMED' as const,
      notes: 'Chuẩn bị cho negotiation với client'
    },
    {
      scheduleId: schedules[28].id,
      menteeId: createdMentees[11].id,
      status: 'CONFIRMED' as const,
      notes: 'DeFi protocol research'
    },
    {
      scheduleId: schedules[29].id,
      menteeId: createdMentees[12].id,
      status: 'CONFIRMED' as const,
      notes: 'Flutter state management'
    },
    // Cancelled bookings
    {
      scheduleId: schedules[10].id,
      menteeId: createdMentees[13].id,
      status: 'CANCELLED' as const,
      notes: 'System design session - cancelled due to schedule conflict'
    }
  ];

  const createdBookings = [];
  for (const booking of bookings) {
    const created = await prisma.booking.create({
      data: booking
    });
    createdBookings.push(created);
  }
  console.log(`✅ Created ${createdBookings.length} bookings\n`);

  // Update schedule status based on bookings
  // For confirmed bookings that will have sessions
  const confirmedScheduleIndices = [0, 2, 4, 6, 8, 13, 15, 17, 19, 21, 25, 26, 27, 28, 29];
  for (const idx of confirmedScheduleIndices) {
    await prisma.schedule.update({
      where: { id: schedules[idx].id },
      data: { status: 'BOOKED' }
    });
  }

  // ============= SESSIONS =============
  console.log('🎓 Creating sessions...');
  
  const sessionNow = new Date();
  const yesterday = new Date(sessionNow.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(sessionNow.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(sessionNow.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(sessionNow.getTime() - 4 * 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(sessionNow.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(sessionNow.getTime() - 2 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(sessionNow.getTime() - 3 * 60 * 60 * 1000);
  
  const sessions = [
    // Completed sessions với feedback
    {
      bookingId: createdBookings[0].id,
      mentorId: createdMentors[0].id,
      menteeId: createdMentees[0].id,
      startedAt: fourDaysAgo,
      endedAt: new Date(fourDaysAgo.getTime() + 2 * 60 * 60 * 1000),
      status: 'COMPLETED' as const,
      autoStarted: false,
      autoEnded: false,
      notes: 'Excellent session! Student grasped React Hooks concepts well. We covered useState, useEffect, useContext, and custom hooks. Practice assignments given.'
    },
    {
      bookingId: createdBookings[1].id,
      mentorId: createdMentors[1].id,
      menteeId: createdMentees[1].id,
      startedAt: threeDaysAgo,
      endedAt: new Date(threeDaysAgo.getTime() + 3 * 60 * 60 * 1000),
      status: 'COMPLETED' as const,
      autoStarted: true,
      autoEnded: true,
      notes: 'Covered neural network basics: perceptrons, activation functions, backpropagation. Implemented simple network in TensorFlow. Student needs more practice with calculus.'
    },
    {
      bookingId: createdBookings[2].id,
      mentorId: createdMentors[2].id,
      menteeId: createdMentees[2].id,
      startedAt: twoDaysAgo,
      endedAt: new Date(twoDaysAgo.getTime() + 2 * 60 * 60 * 1000),
      status: 'COMPLETED' as const,
      autoStarted: false,
      autoEnded: false,
      notes: 'Docker fundamentals covered. Created Dockerfile, docker-compose for multi-container app. Student successfully containerized their project.'
    },
    {
      bookingId: createdBookings[3].id,
      mentorId: createdMentors[3].id,
      menteeId: createdMentees[3].id,
      startedAt: yesterday,
      endedAt: new Date(yesterday.getTime() + 3 * 60 * 60 * 1000),
      status: 'COMPLETED' as const,
      autoStarted: false,
      autoEnded: false,
      notes: 'UI/UX workshop was productive. Designed wireframes and prototypes in Figma. Learned design system principles and component organization.'
    },
    {
      bookingId: createdBookings[4].id,
      mentorId: createdMentors[4].id,
      menteeId: createdMentees[4].id,
      startedAt: fourDaysAgo,
      endedAt: new Date(fourDaysAgo.getTime() + 3 * 60 * 60 * 1000),
      status: 'COMPLETED' as const,
      autoStarted: true,
      autoEnded: true,
      notes: 'Security session covered SQL Injection, XSS, CSRF. Demonstrated attacks and prevention. Student tested their app and found 3 vulnerabilities!'
    },
    // In-progress sessions - CAN TEST END BUTTON
    {
      bookingId: createdBookings[5].id,
      mentorId: createdMentors[5].id,
      menteeId: createdMentees[5].id,
      startedAt: twoHoursAgo,
      status: 'IN_PROGRESS' as const,
      autoStarted: false,
      autoEnded: false,
      notes: 'Currently working on Unity 2D game. Implementing player movement and basic physics.'
    },
    {
      bookingId: createdBookings[6].id,
      mentorId: createdMentors[10].id,
      menteeId: createdMentees[6].id,
      startedAt: oneHourAgo,
      status: 'IN_PROGRESS' as const,
      autoStarted: false,
      autoEnded: false,
      notes: 'Cypress E2E testing in progress. Writing tests for authentication flow.'
    },
    // Completed sessions without feedback yet
    {
      bookingId: createdBookings[7].id,
      mentorId: createdMentors[11].id,
      menteeId: createdMentees[7].id,
      startedAt: yesterday,
      endedAt: new Date(yesterday.getTime() + 3 * 60 * 60 * 1000),
      status: 'COMPLETED' as const,
      autoStarted: false,
      autoEnded: false,
      notes: 'Agile & Scrum workshop. Practiced sprint planning, daily standups, retrospectives. Team collaboration exercises.'
    },
    {
      bookingId: createdBookings[8].id,
      mentorId: createdMentors[12].id,
      menteeId: createdMentees[8].id,
      startedAt: twoDaysAgo,
      endedAt: new Date(twoDaysAgo.getTime() + 3 * 60 * 60 * 1000),
      status: 'COMPLETED' as const,
      autoStarted: true,
      autoEnded: true,
      notes: 'PostgreSQL performance tuning. Analyzed slow queries with EXPLAIN ANALYZE. Created indexes, optimized JOIN operations. 10x performance improvement!'
    },
    {
      bookingId: createdBookings[9].id,
      mentorId: createdMentors[13].id,
      menteeId: createdMentees[9].id,
      startedAt: threeDaysAgo,
      endedAt: new Date(threeDaysAgo.getTime() + 4 * 60 * 60 * 1000),
      status: 'COMPLETED' as const,
      autoStarted: false,
      autoEnded: false,
      notes: 'Deep Learning with PyTorch. Built CNN for image classification. Transfer learning with ResNet. Achieved 92% accuracy on validation set!'
    }
  ];

  const createdSessions = [];
  for (const session of sessions) {
    const created = await prisma.session.create({
      data: session
    });
    createdSessions.push(created);
    
    // If session is COMPLETED, update booking and schedule status to COMPLETED
    if (session.status === 'COMPLETED' && session.endedAt) {
      const booking = await prisma.booking.findUnique({
        where: { id: session.bookingId },
        include: { schedule: true }
      });
      
      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' }
        });
        
        // Schedule keeps its status as BOOKED (no COMPLETED status for schedule)
        // Only booking and session have COMPLETED status
      }
    }
  }
  console.log(`✅ Created ${createdSessions.length} sessions (${sessions.filter(s => s.status === 'COMPLETED').length} completed, ${sessions.filter(s => s.status === 'IN_PROGRESS').length} in-progress)\n`);

  // ============= FEEDBACKS =============
  console.log('⭐ Creating feedbacks...');
  
  const feedbacks = [
    // Feedback for first completed session
    {
      sessionId: createdSessions[0].id,
      mentorId: createdMentors[0].id,
      menteeId: createdMentees[0].id,
      rating: 5,
      comment: 'Mentor rất nhiệt tình và giải thích rất dễ hiểu. Học được rất nhiều về React Hooks. Highly recommended!'
    },
    // Feedback for second completed session
    {
      sessionId: createdSessions[1].id,
      mentorId: createdMentors[1].id,
      menteeId: createdMentees[1].id,
      rating: 4,
      comment: 'Session rất bổ ích! Mentor có kinh nghiệm và kiến thức sâu về AI. Tuy nhiên có một số phần giải thích hơi nhanh.'
    },
    // Feedback for third completed session
    {
      sessionId: createdSessions[2].id,
      mentorId: createdMentors[2].id,
      menteeId: createdMentees[2].id,
      rating: 5,
      comment: 'Docker workshop thực sự xuất sắc! Mentor giải thích từng bước rất chi tiết. Đã containerize được app của mình thành công!'
    },
    // Feedback for fourth completed session
    {
      sessionId: createdSessions[3].id,
      mentorId: createdMentors[3].id,
      menteeId: createdMentees[3].id,
      rating: 5,
      comment: 'UI/UX design session vượt mong đợi. Mentor có tư duy design rất tốt. Học được nhiều về Figma và design systems.'
    },
    // Feedback for fifth completed session
    {
      sessionId: createdSessions[4].id,
      mentorId: createdMentors[4].id,
      menteeId: createdMentees[4].id,
      rating: 5,
      comment: 'Security session cực kỳ hữu ích! Mentor demonstrated các loại attack và cách prevent rất thực tế. Tìm được 3 lỗ hổng trong app của mình!'
    },
    // Feedback for eighth completed session
    {
      sessionId: createdSessions[7].id,
      mentorId: createdMentors[11].id,
      menteeId: createdMentees[7].id,
      rating: 4,
      comment: 'Agile workshop rất practical. Thích phần sprint planning và retrospective nhất. Sẽ áp dụng vào team ngay!'
    },
    // Feedback for ninth completed session
    {
      sessionId: createdSessions[8].id,
      mentorId: createdMentors[12].id,
      menteeId: createdMentees[8].id,
      rating: 5,
      comment: 'PostgreSQL tuning session vô cùng giá trị! Mentor chỉ cách analyze queries và tạo indexes hiệu quả. Performance cải thiện 10x!'
    },
    // Feedback for tenth completed session
    {
      sessionId: createdSessions[9].id,
      mentorId: createdMentors[13].id,
      menteeId: createdMentees[9].id,
      rating: 5,
      comment: 'Deep Learning với PyTorch - best session ever! Mentor giảng dạy rất có tâm, code examples rất clear. Model đạt 92% accuracy!'
    }
  ];

  for (const feedback of feedbacks) {
    await prisma.feedback.create({
      data: feedback
    });
  }
  console.log(`✅ Created ${feedbacks.length} feedbacks\n`);

  // ============= NOTIFICATIONS =============
  console.log('🔔 Creating notifications...');
  
  const notifications = [
    {
      userId: createdMentees[0].id,
      type: 'SUCCESS',
      title: 'Booking được xác nhận!',
      content: 'Booking của bạn cho session "React Hooks Deep Dive" đã được mentor xác nhận.',
      isRead: false
    },
    {
      userId: createdMentees[2].id,
      type: 'INFO',
      title: 'Booking đang chờ xác nhận',
      content: 'Booking của bạn đang được mentor xem xét. Bạn sẽ nhận được thông báo khi có kết quả.',
      isRead: false
    },
    {
      userId: createdMentors[0].id,
      type: 'INFO',
      title: 'Booking mới!',
      content: 'Bạn có booking mới từ Nguyễn Văn An cho session "TypeScript for React Developers".',
      isRead: false
    },
    {
      userId: createdMentors[1].id,
      type: 'INFO',
      title: 'Lịch dạy được tạo',
      content: 'Lịch "Introduction to Neural Networks" của bạn đã được tạo thành công.',
      isRead: true
    }
  ];

  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification
    });
  }
  console.log(`✅ Created ${notifications.length} notifications\n`);

  // ============= SUMMARY =============
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 FULL SEED COMPLETED SUCCESSFULLY!\n');
  console.log('📊 Summary:');
  console.log(`  👤 ${createdMentees.length} Mentees (password: 123456)`);
  console.log(`  👨‍🏫 ${createdMentors.length} Mentors (password: 123456)`);
  console.log(`  📝 ${createdPosts.length} Posts (Mentor only - mentees cannot create posts)`);
  console.log(`  📅 ${schedules.length} Schedules (All capacity = 1 for 1-on-1 mentoring)`);
  console.log(`  📋 ${createdBookings.length} Bookings (15 confirmed + 14 pending + 1 cancelled)`);
  console.log(`  🎓 ${createdSessions.length} Sessions (8 completed + 2 in-progress)`);
  console.log(`  ⭐ ${feedbacks.length} Feedbacks`);
  console.log(`  🔔 ${notifications.length} Notifications`);
  console.log(`\n  Status breakdown:`);
  console.log(`    📅 Schedules: ${schedules.filter((s: any) => s.status === 'AVAILABLE').length} available, ${schedules.filter((s: any) => s.status === 'BOOKED').length} booked (will be updated to COMPLETED for completed sessions)`);
  console.log(`    📋 Bookings: 15 confirmed, 14 pending, 1 cancelled (8 will be COMPLETED after sessions)`);
  console.log('\n📧 Login với email bất kỳ ở trên, password: 123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
