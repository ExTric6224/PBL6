import prisma from '../db/client';
import { CreateFeedbackDto, FeedbackQueryDto } from '../schemas/feedbacks.schema';

export class FeedbacksService {
  async createFeedback(menteeId: number, data: CreateFeedbackDto) {
    // Check if session exists and belongs to mentee
    const session = await prisma.session.findFirst({
      where: {
        id: data.sessionId,
        menteeId: menteeId,
      },
      include: {
        booking: {
          include: {
            schedule: {
              include: {
                mentor: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found or access denied');
    }

    if (!session.endedAt) {
      throw new Error('Cannot provide feedback for ongoing session');
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { sessionId: data.sessionId },
    });

    if (existingFeedback) {
      throw new Error('Feedback already provided for this session');
    }

    return await prisma.feedback.create({
      data: {
        sessionId: data.sessionId,
        mentorId: session.booking.schedule.mentor.userId,
        menteeId: menteeId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        session: {
          include: {
            booking: {
              include: {
                schedule: true,
              },
            },
          },
        },
        mentor: {
          select: {
            id: true,
            email: true,
          },
        },
        mentee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async getFeedbacksByMentor(mentorId: number, query: FeedbackQueryDto) {
    const where: any = { mentorId };

    if (query.ratingMin !== undefined || query.ratingMax !== undefined) {
      where.rating = {};
      if (query.ratingMin !== undefined) {
        where.rating.gte = query.ratingMin;
      }
      if (query.ratingMax !== undefined) {
        where.rating.lte = query.ratingMax;
      }
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        session: {
          include: {
            booking: {
              include: {
                schedule: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate average rating
    const totalRating = feedbacks.reduce((sum: any, feedback: { rating: any; }) => sum + feedback.rating, 0);
    const averageRating = feedbacks.length > 0 ? totalRating / feedbacks.length : 0;

    return {
      feedbacks,
      stats: {
        totalFeedbacks: feedbacks.length,
        averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      },
    };
  }

  async getFeedbacksByMentee(menteeId: number) {
    return await prisma.feedback.findMany({
      where: { menteeId },
      include: {
        session: {
          include: {
            booking: {
              include: {
                schedule: true,
              },
            },
          },
        },
        mentor: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
