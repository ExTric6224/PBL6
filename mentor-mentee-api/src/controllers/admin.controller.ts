import { Response } from 'express';
import 'express-async-errors';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { success, authError, notFoundError, internalError } from '../utils/responses';
import prisma from '../db/client';

export class AdminController {
  // Get all users
  async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'ADMIN') {
        return authError(res, 'Admin access required');
      }

      const users = await prisma.user.findMany({
        include: {
          mentorprofile: {
            select: {
              fullName: true,
              bio: true,
            },
          },
          menteeprofile: {
            select: {
              fullName: true,
              goals: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return success(res, users);
    } catch (error: any) {
      throw error;
    }
  }

  // Get user by ID
  async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'ADMIN') {
        return authError(res, 'Admin access required');
      }

      const userId = parseInt(req.params.id, 10);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          mentorprofile: true,
          menteeprofile: true,
          post: true,
          booking: true,
          schedule: true,
        },
      });

      if (!user) {
        return notFoundError(res, 'User not found');
      }

      return success(res, user);
    } catch (error: any) {
      throw error;
    }
  }

  // Delete user
  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'ADMIN') {
        return authError(res, 'Admin access required');
      }

      const userId = parseInt(req.params.id, 10);

      // Cannot delete yourself
      if (userId === req.user!.sub) {
        return authError(res, 'Cannot delete your own account');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return notFoundError(res, 'User not found');
      }

      // Delete user (cascade delete will handle related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      return success(res, { message: 'User deleted successfully' });
    } catch (error: any) {
      throw error;
    }
  }

  // Get system statistics with analytics
  async getStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'ADMIN') {
        return authError(res, 'Admin access required');
      }

      const [
        totalUsers,
        totalMentors,
        totalMentees,
        totalSessions,
        completedSessions,
        totalPosts,
        totalFeedbacks,
        totalBookings,
        totalSchedules,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'MENTOR' } }),
        prisma.user.count({ where: { role: 'MENTEE' } }),
        prisma.session.count(),
        prisma.session.count({ where: { status: 'COMPLETED' } }),
        prisma.post.count(),
        prisma.feedback.count(),
        prisma.booking.count(),
        prisma.schedule.count(),
      ]);

      // Calculate average rating and rating distribution
      const feedbacks = await prisma.feedback.findMany({
        select: { rating: true },
      });
      const averageRating =
        feedbacks.length > 0
          ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
          : 0;
      
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: feedbacks.filter(f => f.rating === rating).length,
      }));

      // Get recent users
      const recentUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Get top mentors by session count
      const topMentors = await prisma.user.findMany({
        where: { role: 'MENTOR' },
        take: 5,
        select: {
          id: true,
          email: true,
          mentorprofile: {
            select: {
              fullName: true,
            },
          },
          session_session_mentorIdTouser: {
            select: { id: true },
          },
          feedback_feedback_mentorIdTouser: {
            select: { rating: true },
          },
        },
      });

      const topMentorsData = topMentors.map(mentor => ({
        id: mentor.id,
        name: mentor.mentorprofile?.fullName || mentor.email,
        sessionCount: mentor.session_session_mentorIdTouser.length,
        averageRating: mentor.feedback_feedback_mentorIdTouser.length > 0
          ? Math.round((mentor.feedback_feedback_mentorIdTouser.reduce((sum, f) => sum + f.rating, 0) / 
            mentor.feedback_feedback_mentorIdTouser.length) * 100) / 100
          : 0,
      })).sort((a, b) => b.sessionCount - a.sessionCount);

      // Get user growth data (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const userGrowth = await Promise.all(
        Array.from({ length: 7 }, async (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          date.setHours(0, 0, 0, 0);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);
          
          const count = await prisma.user.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate,
              },
            },
          });
          
          return {
            date: date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
            count,
          };
        })
      );

      // Get session status distribution
      const sessionStatusCounts = await prisma.session.groupBy({
        by: ['status'],
        _count: true,
      });

      const sessionStats = {
        SCHEDULED: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      };

      sessionStatusCounts.forEach(stat => {
        if (stat.status in sessionStats) {
          sessionStats[stat.status as keyof typeof sessionStats] = stat._count;
        }
      });

      // Get booking status distribution
      const bookingStatusCounts = await prisma.booking.groupBy({
        by: ['status'],
        _count: true,
      });

      const bookingStats = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        CANCELLED: 0,
      };

      bookingStatusCounts.forEach(stat => {
        if (stat.status in bookingStats) {
          bookingStats[stat.status as keyof typeof bookingStats] = stat._count;
        }
      });

      // Get recent activities
      const recentActivities = await prisma.session.findMany({
        take: 10,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          status: true,
          startedAt: true,
          user_session_mentorIdTouser: {
            select: {
              email: true,
              mentorprofile: {
                select: { fullName: true },
              },
            },
          },
          user_session_menteeIdTouser: {
            select: {
              email: true,
              menteeprofile: {
                select: { fullName: true },
              },
            },
          },
        },
      });

      const activities = recentActivities.map(activity => ({
        type: 'session',
        status: activity.status,
        mentor: activity.user_session_mentorIdTouser?.mentorprofile?.fullName || 
                activity.user_session_mentorIdTouser?.email || 'Unknown',
        mentee: activity.user_session_menteeIdTouser?.menteeprofile?.fullName || 
                activity.user_session_menteeIdTouser?.email || 'Unknown',
        createdAt: activity.startedAt || new Date(),
      }));

      return success(res, {
        // Basic stats
        totalUsers,
        totalMentors,
        totalMentees,
        totalSessions,
        completedSessions,
        totalPosts,
        totalFeedbacks,
        totalBookings,
        totalSchedules,
        averageRating: Math.round(averageRating * 100) / 100,
        
        // Analytics data
        ratingDistribution,
        topMentors: topMentorsData,
        userGrowth,
        sessionStats,
        bookingStats,
        recentUsers,
        recentActivities: activities,
      });
    } catch (error: any) {
      console.error('Error in getStatistics:', error);
      return internalError(res, error.message || 'Failed to get statistics');
    }
  }
}
