import { Router } from 'express';
import { ProfilesController } from '../controllers/profiles.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { createMentorProfileSchema, createMenteeProfileSchema } from '../schemas/profiles.schema';

const router = Router();
const profilesController = new ProfilesController();

// Mentor profile routes
router.post('/mentor', authenticate, validate(createMentorProfileSchema), profilesController.createOrUpdateMentorProfile.bind(profilesController));
router.get('/mentor/:userId', authenticate, profilesController.getMentorProfile.bind(profilesController));

// Mentee profile routes
router.post('/mentee', authenticate, validate(createMenteeProfileSchema), profilesController.createOrUpdateMenteeProfile.bind(profilesController));
router.get('/mentee/:userId', authenticate, profilesController.getMenteeProfile.bind(profilesController));

export default router;
