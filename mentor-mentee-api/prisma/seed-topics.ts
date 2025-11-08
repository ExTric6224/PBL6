import prisma from '../src/db/client';

const topics = [
  {
    name: 'Web Development',
    description: 'Frontend, Backend, Full-stack development'
  },
  {
    name: 'Mobile Development',
    description: 'iOS, Android, React Native, Flutter'
  },
  {
    name: 'Data Science',
    description: 'Machine Learning, AI, Data Analysis'
  },
  {
    name: 'DevOps',
    description: 'CI/CD, Docker, Kubernetes, Cloud Services'
  },
  {
    name: 'Cybersecurity',
    description: 'Network Security, Ethical Hacking, Security Testing'
  },
  {
    name: 'UI/UX Design',
    description: 'User Interface, User Experience, Design Thinking'
  },
  {
    name: 'Database',
    description: 'SQL, NoSQL, Database Design, Optimization'
  },
  {
    name: 'Software Architecture',
    description: 'System Design, Microservices, Design Patterns'
  },
  {
    name: 'Career Development',
    description: 'Interview Preparation, Resume Building, Career Planning'
  },
  {
    name: 'Soft Skills',
    description: 'Communication, Leadership, Teamwork'
  },
  {
    name: 'Game Development',
    description: 'Unity, Unreal Engine, Game Design'
  },
  {
    name: 'Cloud Computing',
    description: 'AWS, Azure, Google Cloud Platform'
  },
  {
    name: 'Blockchain',
    description: 'Cryptocurrency, Smart Contracts, Web3'
  },
  {
    name: 'Testing & QA',
    description: 'Unit Testing, Integration Testing, Test Automation'
  },
  {
    name: 'Project Management',
    description: 'Agile, Scrum, Project Planning'
  }
];

async function seedTopics() {
  console.log('🌱 Starting topic seeding...');

  try {
    // Create topics
    for (const topic of topics) {
      const result = await prisma.topic.upsert({
        where: { name: topic.name },
        update: {
          description: topic.description,
          updatedAt: new Date(),
        },
        create: {
          name: topic.name,
          description: topic.description,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Created/Updated topic: ${result.name} (ID: ${result.id})`);
    }

    console.log('✨ Topic seeding completed successfully!');
    console.log(`📊 Total topics: ${topics.length}`);
  } catch (error) {
    console.error('❌ Error seeding topics:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTopics()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
