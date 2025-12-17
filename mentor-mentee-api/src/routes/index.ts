import { Router } from 'express';
import authRoutes from './auth.routes';
import registrationOtpRoutes from './registration-otp.routes';
import forgotPasswordRoutes from './forgot-password.routes';
import profilesRoutes from './profiles.routes';
import schedulesRoutes from './schedules.routes';
import bookingsRoutes from './bookings.routes';
import sessionsRoutes from './sessions.routes';
import feedbacksRoutes from './feedbacks.routes';
import notificationsRoutes from './notifications.routes';
import postsRoutes from './posts.routes';
import adminPermissionsRoutes from './admin-permissions.routes';
import permissionRoutes from './permission.routes';
import adminRoutes from './admin.routes';
import debugRoutes from './debug.routes';
import topicsRoutes from './topics.routes';
import mentorRecommendationRoutes from './mentor-recommendation.routes';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/auth/register', registrationOtpRoutes);
router.use('/auth/forgot-password', forgotPasswordRoutes);
router.use('/profiles', profilesRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/feedbacks', feedbacksRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/posts', postsRoutes);
router.use('/admin/permissions', adminPermissionsRoutes);
router.use('/permissions', permissionRoutes);
router.use('/admin', adminRoutes);
router.use('/debug', debugRoutes);
router.use('/topics', topicsRoutes);
router.use('/mentors', mentorRecommendationRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

export default router;
