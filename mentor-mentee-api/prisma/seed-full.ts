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
      goals: 'Muốn trở thành Full-stack Developer trong 2 năm tới',
      interests: ['Web Development', 'Mobile Development']
    },
    {
      email: 'mentee2@example.com',
      fullName: 'Trần Thị Bình',
      goals: 'Học AI để làm nghiên cứu khoa học',
      interests: ['Data Science', 'Software Architecture']
    },
    {
      email: 'mentee3@example.com',
      fullName: 'Lê Văn Cường',
      goals: 'Chuyển sang làm DevOps Engineer',
      interests: ['DevOps', 'Cloud Computing']
    },
    {
      email: 'mentee4@example.com',
      fullName: 'Phạm Thị Diễm',
      goals: 'Trở thành UI/UX Designer chuyên nghiệp',
      interests: ['UI/UX Design', 'Web Development']
    },
    {
      email: 'mentee5@example.com',
      fullName: 'Hoàng Văn Em',
      goals: 'Học security để bảo vệ hệ thống',
      interests: ['Cybersecurity', 'Database']
    },
    {
      email: 'mentee6@example.com',
      fullName: 'Vũ Thị Phương',
      goals: 'Phát triển game indie',
      interests: ['Game Development', 'Software Architecture']
    },
    {
      email: 'mentee7@example.com',
      fullName: 'Đỗ Văn Giang',
      goals: 'Chuẩn bị cho phỏng vấn Senior Developer',
      interests: ['Career Development', 'Software Architecture']
    },
    {
      email: 'mentee8@example.com',
      fullName: 'Ngô Thị Hà',
      goals: 'Tìm hiểu về Blockchain và Web3',
      interests: ['Blockchain', 'Web Development']
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
      school: 'Đại học Bách Khoa Hà Nội',
      degree: 'Thạc sĩ Khoa học Máy tính',
      yearsExp: 7,
      bio: 'Full-stack Developer với 7 năm kinh nghiệm. Chuyên về React, Node.js, và PostgreSQL. Đã làm việc tại nhiều công ty startup và tập đoàn lớn.',
      expertise: ['Web Development', 'Database', 'Software Architecture']
    },
    {
      email: 'mentor2@example.com',
      fullName: 'Lê Thị Mai',
      school: 'Đại học Công nghệ - ĐHQGHN',
      degree: 'Tiến sĩ Trí tuệ Nhân tạo',
      yearsExp: 10,
      bio: 'AI Researcher và Data Scientist. Chuyên về Machine Learning, Deep Learning. Có nhiều bài báo khoa học quốc tế.',
      expertise: ['Data Science', 'Software Architecture', 'Testing & QA']
    },
    {
      email: 'mentor3@example.com',
      fullName: 'Nguyễn Hoàng Nam',
      school: 'Đại học FPT',
      degree: 'Cử nhân CNTT',
      yearsExp: 6,
      bio: 'DevOps Engineer tại công ty đa quốc gia. Chuyên về CI/CD, Docker, Kubernetes, AWS. Đam mê automation và infrastructure as code.',
      expertise: ['DevOps', 'Cloud Computing', 'Database']
    },
    {
      email: 'mentor4@example.com',
      fullName: 'Phạm Thanh Hà',
      school: 'Đại học Mỹ thuật Công nghiệp',
      degree: 'Thạc sĩ Thiết kế Đồ họa',
      yearsExp: 8,
      bio: 'Senior UI/UX Designer với 8 năm kinh nghiệm. Đã thiết kế cho nhiều ứng dụng có hàng triệu người dùng. Giảng viên kiêm nhiệm tại các trung tâm đào tạo.',
      expertise: ['UI/UX Design', 'Web Development', 'Mobile Development']
    },
    {
      email: 'mentor5@example.com',
      fullName: 'Vũ Đức Anh',
      school: 'Học viện Kỹ thuật Mật mã',
      degree: 'Thạc sĩ An toàn Thông tin',
      yearsExp: 9,
      bio: 'Cybersecurity Expert. Chuyên về penetration testing, security audit. CEH và OSCP certified. Đã phát hiện nhiều lỗ hổng bảo mật nghiêm trọng.',
      expertise: ['Cybersecurity', 'Database', 'Cloud Computing']
    },
    {
      email: 'mentor6@example.com',
      fullName: 'Đặng Thị Lan',
      school: 'Đại học RMIT',
      degree: 'Cử nhân Game Design',
      yearsExp: 5,
      bio: 'Game Developer với kinh nghiệm làm việc tại studio game nổi tiếng. Chuyên Unity và Unreal Engine. Đam mê storytelling và game mechanics.',
      expertise: ['Game Development', 'Software Architecture', 'Mobile Development']
    },
    {
      email: 'mentor7@example.com',
      fullName: 'Hoàng Quốc Việt',
      school: 'Đại học Bách Khoa TP.HCM',
      degree: 'Thạc sĩ Kỹ thuật Phần mềm',
      yearsExp: 12,
      bio: 'Tech Lead với 12 năm kinh nghiệm. Chuyên về system design, microservices, distributed systems. Mentor cho nhiều senior developers.',
      expertise: ['Software Architecture', 'Web Development', 'DevOps', 'Database']
    },
    {
      email: 'mentor8@example.com',
      fullName: 'Bùi Thị Ngọc',
      school: 'Đại học Ngoại thương',
      degree: 'MBA',
      yearsExp: 15,
      bio: 'Career Coach và Technical Recruiter. Đã phỏng vấn hơn 1000 ứng viên IT. Giúp developers chuẩn bị CV, phỏng vấn và career path.',
      expertise: ['Career Development', 'Soft Skills', 'Project Management']
    },
    {
      email: 'mentor9@example.com',
      fullName: 'Trịnh Văn Đức',
      school: 'Stanford University',
      degree: 'PhD Computer Science',
      yearsExp: 8,
      bio: 'Blockchain Developer và Web3 Expert. Founder của startup blockchain. Chuyên về smart contracts, DeFi, và NFT.',
      expertise: ['Blockchain', 'Web Development', 'Software Architecture']
    },
    {
      email: 'mentor10@example.com',
      fullName: 'Lương Thị Hương',
      school: 'Đại học Công nghệ',
      degree: 'Thạc sĩ Mobile Computing',
      yearsExp: 6,
      bio: 'Mobile Developer chuyên React Native và Flutter. Đã phát triển hơn 20 ứng dụng mobile thành công trên cả iOS và Android.',
      expertise: ['Mobile Development', 'Web Development', 'UI/UX Design']
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
    },
    {
      authorId: createdMentees[0].id,
      title: 'Hành trình 3 tháng học Web Development',
      content: `Xin chào mọi người! Mình muốn chia sẻ kinh nghiệm 3 tháng học web development:

**Tháng 1: HTML/CSS/JavaScript**
- FreeCodeCamp
- Build 5 static websites
- Responsive design

**Tháng 2: React**
- Official React docs
- Todo app, Weather app
- React Router, Context API

**Tháng 3: Backend & Database**
- Node.js + Express
- MongoDB basics
- Full-stack MERN app

**Challenges:**
- JavaScript async khó hiểu
- State management confusing
- Debugging takes time

**Tips:**
- Code mỗi ngày
- Build projects, not just tutorials
- Join communities

Vẫn còn nhiều thứ phải học nhưng đã confident hơn rất nhiều!`,
      isPublic: true
    },
    {
      authorId: createdMentees[1].id,
      title: 'Resources học AI/ML miễn phí',
      content: `Tổng hợp resources học AI/ML mình thấy hay:

**Courses:**
- Andrew Ng's ML Course (Coursera)
- Fast.ai (Practical Deep Learning)
- Stanford CS229

**Books:**
- "Hands-On Machine Learning" - Aurélien Géron
- "Deep Learning" - Ian Goodfellow
- "Pattern Recognition" - Christopher Bishop

**Practice:**
- Kaggle competitions
- Google Colab (free GPU!)
- TensorFlow tutorials

**Communities:**
- r/MachineLearning
- Papers with Code
- AI Discord servers

Tất cả đều miễn phí! Không có lý do gì để không bắt đầu!`,
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
      capacity: 3,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[0].id,
      topic: 'TypeScript for React Developers',
      description: 'Học cách sử dụng TypeScript với React. Type-safe components, props, hooks. Best practices và common patterns.',
      startAt: createDate(5, 10),
      endAt: createDate(5, 12),
      capacity: 4,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[1].id,
      topic: 'Introduction to Neural Networks',
      description: 'Giới thiệu về Neural Networks: perceptrons, activation functions, backpropagation. Thực hành với TensorFlow.',
      startAt: createDate(3, 9),
      endAt: createDate(3, 12),
      capacity: 2,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[1].id,
      topic: 'Computer Vision với OpenCV',
      description: 'Xử lý ảnh và video với OpenCV. Object detection, face recognition, image classification.',
      startAt: createDate(7, 14),
      endAt: createDate(7, 17),
      capacity: 3,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[2].id,
      topic: 'Docker Fundamentals',
      description: 'Docker từ cơ bản đến nâng cao: Dockerfile, docker-compose, multi-stage builds, volumes, networks.',
      startAt: createDate(1, 13),
      endAt: createDate(1, 15),
      capacity: 5,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[2].id,
      topic: 'Kubernetes for Beginners',
      description: 'Kubernetes basics: pods, services, deployments, configmaps, secrets. Deploy ứng dụng lên K8s cluster.',
      startAt: createDate(8, 10),
      endAt: createDate(8, 13),
      capacity: 4,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[3].id,
      topic: 'UI/UX Design Workshop',
      description: 'Figma workshop: wireframes, prototypes, design systems. Học cách design responsive web app.',
      startAt: createDate(4, 14),
      endAt: createDate(4, 17),
      capacity: 6,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[4].id,
      topic: 'Web Application Security',
      description: 'Tìm hiểu các lỗ hổng bảo mật phổ biến: SQL Injection, XSS, CSRF. Cách phòng tránh và test.',
      startAt: createDate(6, 15),
      endAt: createDate(6, 18),
      capacity: 3,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[5].id,
      topic: 'Unity Game Development Basics',
      description: 'Tạo game 2D đơn giản với Unity. Physics, animations, UI, scripting with C#.',
      startAt: createDate(3, 13),
      endAt: createDate(3, 16),
      capacity: 4,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[6].id,
      topic: 'System Design: Design Instagram',
      description: 'System design interview practice: Design Instagram. Requirements, high-level design, database schema, scaling strategy.',
      startAt: createDate(5, 14),
      endAt: createDate(5, 17),
      capacity: 2,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[7].id,
      topic: 'Resume & Interview Preparation',
      description: 'Cách viết CV tech ấn tượng. Mock interview practice. Behavioral questions. Salary negotiation tips.',
      startAt: createDate(2, 18),
      endAt: createDate(2, 20),
      capacity: 5,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[8].id,
      topic: 'Smart Contract Development',
      description: 'Viết smart contract với Solidity. Deploy lên testnet. Web3.js integration. Security best practices.',
      startAt: createDate(9, 10),
      endAt: createDate(9, 13),
      capacity: 3,
      status: 'AVAILABLE' as const
    },
    {
      mentorId: createdMentors[9].id,
      topic: 'React Native: Build Todo App',
      description: 'Hands-on: Build todo app với React Native. Navigation, AsyncStorage, styled-components.',
      startAt: createDate(4, 9),
      endAt: createDate(4, 12),
      capacity: 4,
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
    // Confirmed bookings
    {
      scheduleId: schedules[0].id,
      menteeId: createdMentees[0].id,
      status: 'CONFIRMED' as const
    },
    {
      scheduleId: schedules[2].id,
      menteeId: createdMentees[1].id,
      status: 'CONFIRMED' as const
    },
    // Pending bookings
    {
      scheduleId: schedules[1].id,
      menteeId: createdMentees[2].id,
      status: 'PENDING' as const
    },
    {
      scheduleId: schedules[3].id,
      menteeId: createdMentees[3].id,
      status: 'PENDING' as const
    },
  ];

  const createdBookings = [];
  for (const booking of bookings) {
    const created = await prisma.booking.create({
      data: booking
    });
    createdBookings.push(created);
  }
  console.log(`✅ Created ${createdBookings.length} bookings\n`);

  // Update schedule status for confirmed bookings
  await prisma.schedule.update({
    where: { id: schedules[0].id },
    data: { status: 'BOOKED' }
  });
  await prisma.schedule.update({
    where: { id: schedules[2].id },
    data: { status: 'BOOKED' }
  });

  // ============= SESSIONS =============
  console.log('🎓 Creating sessions...');
  
  const sessionNow = new Date();
  const yesterday = new Date(sessionNow.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(sessionNow.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(sessionNow.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(sessionNow.getTime() - 2 * 60 * 60 * 1000);
  
  const sessions = [
    // Completed session with feedback
    {
      bookingId: createdBookings[0].id,
      mentorId: createdMentors[0].id,
      menteeId: createdMentees[0].id,
      startedAt: twoDaysAgo,
      endedAt: new Date(twoDaysAgo.getTime() + 60 * 60 * 1000), // 1 hour later
      status: 'COMPLETED' as const,
      autoStarted: false,
      autoEnded: false,
      notes: 'Session went great! Student grasped React Hooks concepts well. We covered useState, useEffect, and custom hooks.'
    },
    // Completed session yesterday (no feedback yet)
    {
      bookingId: createdBookings[1].id,
      mentorId: createdMentors[1].id,
      menteeId: createdMentees[1].id,
      startedAt: yesterday,
      endedAt: new Date(yesterday.getTime() + 90 * 60 * 1000), // 1.5 hours later
      status: 'COMPLETED' as const,
      autoStarted: true,
      autoEnded: true,
      notes: 'Covered basics of neural networks and backpropagation. Student needs more practice with calculus.'
    },
    // In-progress session (started but not ended) - CAN TEST END BUTTON
    {
      bookingId: createdBookings[2].id,
      mentorId: createdMentors[2].id,
      menteeId: createdMentees[2].id,
      startedAt: oneHourAgo,
      status: 'IN_PROGRESS' as const,
      autoStarted: false,
      autoEnded: false,
      notes: null
    },
    // Another completed session with auto start/end
    {
      bookingId: createdBookings[3].id,
      mentorId: createdMentors[0].id,
      menteeId: createdMentees[2].id,
      startedAt: twoHoursAgo,
      endedAt: oneHourAgo,
      status: 'COMPLETED' as const,
      autoStarted: true,
      autoEnded: true,
      notes: 'Great discussion about TypeScript generics and advanced types.'
    }
  ];

  const createdSessions = [];
  for (const session of sessions) {
    const created = await prisma.session.create({
      data: session
    });
    createdSessions.push(created);
  }
  console.log(`✅ Created ${createdSessions.length} sessions (${sessions.filter(s => s.status === 'COMPLETED').length} completed, ${sessions.filter(s => s.status === 'IN_PROGRESS').length} in-progress)\n`);

  // ============= FEEDBACKS =============
  console.log('⭐ Creating feedbacks...');
  
  const feedbacks = [
    {
      sessionId: createdSessions[0].id, // Completed session
      mentorId: createdMentors[0].id,
      menteeId: createdMentees[0].id,
      rating: 5,
      comment: 'Mentor rất nhiệt tình và giải thích rất dễ hiểu. Học được rất nhiều về React Hooks. Highly recommended!'
    },
    {
      sessionId: createdSessions[1].id, // Completed session yesterday
      mentorId: createdMentors[1].id,
      menteeId: createdMentees[1].id,
      rating: 4,
      comment: 'Session rất bổ ích! Mentor có kinh nghiệm và kiến thức sâu về AI. Tuy nhiên có một số phần giải thích hơi nhanh.'
    },
    {
      sessionId: createdSessions[3].id, // Another completed session
      mentorId: createdMentors[0].id,
      menteeId: createdMentees[2].id,
      rating: 5,
      comment: 'Excellent session! Mentor explained TypeScript generics with clear examples. Will definitely book again!'
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
  console.log(`  📝 ${createdPosts.length} Posts`);
  console.log(`  📅 ${schedules.length} Schedules`);
  console.log(`  📋 ${createdBookings.length} Bookings`);
  console.log(`  🎓 ${createdSessions.length} Sessions`);
  console.log(`  ⭐ 1 Feedback`);
  console.log(`  🔔 ${notifications.length} Notifications`);
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
