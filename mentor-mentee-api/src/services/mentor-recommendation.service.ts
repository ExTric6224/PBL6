import prisma from '../db/client';

interface RecommendationFilters {
  page: number;
  limit: number;
  sortBy: string;
  topicId?: number;
}

export class MentorRecommendationService {
  async getRecommendedMentors(filters: RecommendationFilters) {
    const { page, limit, sortBy, topicId } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      user: {
        role: 'MENTOR',
      },
    };

    if (topicId) {
      whereClause.expertise = {
        some: {
          topicId: topicId,
        },
      };
    }

    // Get total count
    const total = await prisma.mentorprofile.count({
      where: whereClause,
    });

    // Get mentors with stats
    const mentors = await prisma.mentorprofile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        expertise: {
          include: {
            topic: true,
          },
        },
      },
      skip,
      take: limit,
    });

    // Enhance with additional stats
    const mentorsWithStats = await Promise.all(
      mentors.map(async (mentor) => {
        const stats = await this.getMentorStats(mentor.userId);
        return {
          ...mentor,
          expertise: mentor.expertise.map((e: any) => e.topic),
          stats,
        };
      })
    );

    // Sort based on sortBy parameter
    let sortedMentors = mentorsWithStats;
    switch (sortBy) {
      case 'sessions':
        sortedMentors = mentorsWithStats.sort((a, b) => b.stats.totalSessions - a.stats.totalSessions);
        break;
      case 'rating':
        sortedMentors = mentorsWithStats.sort((a, b) => b.stats.averageRating - a.stats.averageRating);
        break;
      case 'experience':
        sortedMentors = mentorsWithStats.sort((a, b) => (b.yearsExp || 0) - (a.yearsExp || 0));
        break;
      case 'feedbacks':
        sortedMentors = mentorsWithStats.sort((a, b) => b.stats.averageRating - a.stats.averageRating);
        break;
      default:
        // Default sort by sessions
        sortedMentors = mentorsWithStats.sort((a, b) => b.stats.totalSessions - a.stats.totalSessions);
    }

    return {
      data: sortedMentors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMentorStats(mentorId: number) {
    // Get completed sessions count
    const completedSessions = await prisma.session.count({
      where: {
        mentorId,
        status: 'COMPLETED',
      },
    });

    // Get total feedbacks
    const totalFeedbacks = await prisma.feedback.count({
      where: {
        session: {
          mentorId,
        },
      },
    });

    // Get average rating from feedbacks
    const feedbacks = await prisma.feedback.findMany({
      where: {
        session: {
          mentorId,
        },
      },
      select: {
        rating: true,
      },
    });

    const averageRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

    // Get upcoming schedules count
    const upcomingSchedules = await prisma.schedule.count({
      where: {
        mentorId,
        status: 'AVAILABLE',
        startAt: {
          gte: new Date(),
        },
      },
    });

    // Get total mentees (unique mentees from completed sessions)
    const uniqueMentees = await prisma.session.findMany({
      where: {
        mentorId,
        status: 'COMPLETED',
      },
      select: {
        menteeId: true,
      },
      distinct: ['menteeId'],
    });

    return {
      totalSessions: completedSessions,
      totalFeedbacks,
      averageRating: Math.round(averageRating * 10) / 10,
      upcomingSchedules,
      totalMentees: uniqueMentees.length,
    };
  }
}
