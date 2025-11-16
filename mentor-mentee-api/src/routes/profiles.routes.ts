import { Router } from 'express';
import { ProfilesController } from '../controllers/profiles.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';
import { createMentorProfileSchema, createMenteeProfileSchema } from '../schemas/profiles.schema';
import { uploadAvatar } from '../middleware/upload.middleware';

const router = Router();
const profilesController = new ProfilesController();

// Mentor profile routes - add uploadAvatar.single('avatar') BEFORE validate
router.post('/mentor', 
  authenticate, 
  authorizePermissions('profile:update_own'), 
  uploadAvatar.single('avatar'), // Handle file upload first
  validate(createMentorProfileSchema), 
  profilesController.createOrUpdateMentorProfile.bind(profilesController)
);

router.get('/mentor/:userId', authenticate, authorizePermissions('profile:view', {
  scope: 'own',
  getResourceOwnerId: async (req) => Number(req.params.userId)
}), profilesController.getMentorProfile.bind(profilesController));

// Mentee profile routes
router.post('/mentee', 
  authenticate, 
  authorizePermissions('profile:update_own'), 
  uploadAvatar.single('avatar'), // Handle file upload first
  validate(createMenteeProfileSchema), 
  profilesController.createOrUpdateMenteeProfile.bind(profilesController)
);

router.get('/mentee/:userId', authenticate, authorizePermissions('profile:view', {
  scope: 'own',
  getResourceOwnerId: async (req) => Number(req.params.userId)
}), profilesController.getMenteeProfile.bind(profilesController));

// Get profile by userId (auto-detect mentor or mentee)
router.get('/:userId', authenticate, authorizePermissions('profile:view', {
  scope: 'own',
  getResourceOwnerId: async (req) => Number(req.params.userId)
}), profilesController.getProfileByUserId.bind(profilesController));

export default router;
