import { Response } from 'express';
import 'express-async-errors';
import { ProfilesService } from '../services/profiles.service';
import { success, authError, notFoundError } from '../utils/responses';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { deleteAvatarFile } from '../middleware/upload.middleware';

const profilesService = new ProfilesService();

export class ProfilesController {
  async createOrUpdateMentorProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'MENTOR') {
        return authError(res, 'Only mentors can create mentor profiles');
      }

      // Handle file upload - get path relative to project root
      let avatarPath = req.body.avatar;
      if (req.file) {
        avatarPath = `/uploads/avatars/${req.file.filename}`;
        
        // Delete old avatar if exists
        const existingProfile = await profilesService.getMentorProfile(req.user!.sub).catch(() => null);
        if (existingProfile?.avatar) {
          deleteAvatarFile(existingProfile.avatar);
        }
      }

      const profile = await profilesService.createOrUpdateMentorProfile(req.user!.sub, {
        ...req.body,
        avatar: avatarPath
      });
      return success(res, profile);
    } catch (error: any) {
      throw error;
    }
  }

  async getMentorProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const profile = await profilesService.getMentorProfile(userId);
      return success(res, profile);
    } catch (error: any) {
      if (error.message === 'Mentor profile not found') {
        return notFoundError(res, 'Mentor profile not found');
      }
      throw error;
    }
  }

  async createOrUpdateMenteeProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'MENTEE') {
        return authError(res, 'Only mentees can create mentee profiles');
      }

      // Handle file upload - get path relative to project root
      let avatarPath = req.body.avatar;
      if (req.file) {
        avatarPath = `/uploads/avatars/${req.file.filename}`;
        
        // Delete old avatar if exists
        const existingProfile = await profilesService.getMenteeProfile(req.user!.sub).catch(() => null);
        if (existingProfile?.avatar) {
          deleteAvatarFile(existingProfile.avatar);
        }
      }

      const profile = await profilesService.createOrUpdateMenteeProfile(req.user!.sub, {
        ...req.body,
        avatar: avatarPath
      });
      return success(res, profile);
    } catch (error: any) {
      throw error;
    }
  }

  async getMenteeProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const profile = await profilesService.getMenteeProfile(userId);
      return success(res, profile);
    } catch (error: any) {
      if (error.message === 'Mentee profile not found') {
        return notFoundError(res, 'Mentee profile not found');
      }
      throw error;
    }
  }

  // Get profile by userId (auto-detect mentor or mentee)
  async getProfileByUserId(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const profile = await profilesService.getProfileByUserId(userId);
      return success(res, profile);
    } catch (error: any) {
      if (error.message === 'Profile not found') {
        return notFoundError(res, 'Profile not found');
      }
      throw error;
    }
  }
}
