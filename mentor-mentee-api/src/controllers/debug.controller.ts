import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getEffectivePermissions } from '../services/permission.service';
import prisma from '../db/client';

export class DebugController {
  /**
   * Get current user's effective permissions for debugging
   */
  async getMyPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = Number(req.user?.sub);
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          roleId: true,
          roleRelation: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get effective permissions
      const effectivePermissions = await getEffectivePermissions(userId);

      // Get user permission overrides
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId },
        include: {
          permission: {
            select: {
              code: true,
              resource: true,
              action: true,
              description: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            roleName: user.roleRelation?.name || null
          },
          effectivePermissions: Array.from(effectivePermissions).sort(),
          overrides: userPermissions.map(up => ({
            permission: up.permission.code,
            isGranted: up.isGranted,
            description: up.permission.description
          }))
        }
      });
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get permissions'
      });
    }
  }
}
