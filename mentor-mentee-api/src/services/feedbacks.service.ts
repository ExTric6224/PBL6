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
                user: {
                  select: {
                    id: true,
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
        mentorId: session.booking.schedule.user.id,
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
      },
    });
  }

  async getFeedbacksByMentor(mentorId: number, query: FeedbackQueryDto) {
    console.log('[GET FEEDBACKS BY MENTOR] mentorId:', mentorId, 'query:', query);
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
        user_feedback_mentorIdTouser: {
          select: {
            id: true,
            email: true,
            mentorprofile: {
              select: {
                fullName: true,
                bio: true,
                expertise: {
                  select: {
                    topic: true,
                  },
                },
              },
            },
          },
        },
        user_feedback_menteeIdTouser: {
          select: {
            id: true,
            email: true,
            menteeprofile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        session: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[GET FEEDBACKS BY MENTOR] Found feedbacks:', feedbacks.length);

    // Calculate average rating
    const totalRating = feedbacks.reduce((sum: any, feedback: { rating: any; }) => sum + feedback.rating, 0);
    const averageRating = feedbacks.length > 0 ? totalRating / feedbacks.length : 0;

    // Transform relation names to be more frontend-friendly
    const transformedFeedbacks = feedbacks.map(feedback => ({
      ...feedback,
      mentor: feedback.user_feedback_mentorIdTouser,
      mentee: feedback.user_feedback_menteeIdTouser,
      // Remove the original long-named relations
      user_feedback_mentorIdTouser: undefined,
      user_feedback_menteeIdTouser: undefined,
    }));

    return {
      feedbacks: transformedFeedbacks,
      stats: {
        totalFeedbacks: feedbacks.length,
        averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      },
    };
  }

  async getFeedbacksByMentee(menteeId: number) {
    console.log('[GET FEEDBACKS BY MENTEE] menteeId:', menteeId);
    const feedbacks = await prisma.feedback.findMany({
      where: { menteeId },
      include: {
        user_feedback_mentorIdTouser: {
          select: {
            id: true,
            email: true,
            mentorprofile: {
              select: {
                fullName: true,
                bio: true,
                expertise: {
                  select: {
                    topic: true,
                  },
                },
              },
            },
          },
        },
        user_feedback_menteeIdTouser: {
          select: {
            id: true,
            email: true,
            menteeprofile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        session: {
          include: {
            booking: {
              include: {
                schedule: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform relation names to be more frontend-friendly
    return feedbacks.map(feedback => ({
      ...feedback,
      mentor: feedback.user_feedback_mentorIdTouser,
      mentee: feedback.user_feedback_menteeIdTouser,
      // Remove the original long-named relations
      user_feedback_mentorIdTouser: undefined,
      user_feedback_menteeIdTouser: undefined,
    }));
  }

  async getAllFeedbacks() {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user_feedback_mentorIdTouser: {
          select: {
            id: true,
            email: true,
            mentorprofile: {
              select: {
                fullName: true,
                bio: true,
                expertise: true,
              },
            },
          },
        },
        user_feedback_menteeIdTouser: {
          select: {
            id: true,
            email: true,
            menteeprofile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        session: {
          include: {
            booking: {
              include: {
                schedule: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform relation names to be more frontend-friendly
    return feedbacks.map(feedback => ({
      ...feedback,
      mentor: feedback.user_feedback_mentorIdTouser,
      mentee: feedback.user_feedback_menteeIdTouser,
      // Remove the original long-named relations
      user_feedback_mentorIdTouser: undefined,
      user_feedback_menteeIdTouser: undefined,
    }));
  }

  // Delete feedback (Admin only)
  async deleteFeedback(feedbackId: number) {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    await prisma.feedback.delete({
      where: { id: feedbackId },
    });
  }
}
