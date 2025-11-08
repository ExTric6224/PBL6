import prisma from '../db/client';

export class TopicsService {
  async getAllTopics() {
    return await prisma.topic.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getTopicById(id: number) {
    const topic = await prisma.topic.findUnique({
      where: { id },
    });

    if (!topic) {
      throw new Error('Topic not found');
    }

    return topic;
  }

  async createTopic(name: string, description?: string) {
    return await prisma.topic.create({
      data: {
        name,
        description,
        updatedAt: new Date(),
      },
    });
  }
}
