import { Response } from 'express';
import 'express-async-errors';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { success, authError, notFoundError } from '../utils/responses';
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

  // Get system statistics
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
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'MENTOR' } }),
        prisma.user.count({ where: { role: 'MENTEE' } }),
        prisma.session.count(),
        prisma.session.count({ where: { status: 'COMPLETED' } }),
        prisma.post.count(),
        prisma.feedback.count(),
      ]);

      // Calculate average rating
      const feedbacks = await prisma.feedback.findMany({
        select: { rating: true },
      });
      const averageRating =
        feedbacks.length > 0
          ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
          : 0;

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

      return success(res, {
        totalUsers,
        totalMentors,
        totalMentees,
        totalSessions,
        completedSessions,
        totalPosts,
        totalFeedbacks,
        averageRating: Math.round(averageRating * 100) / 100,
        recentUsers,
      });
    } catch (error: any) {
      throw error;
    }
  }
}
