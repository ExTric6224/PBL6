import { Router } from 'express';
import authRoutes from './auth.routes';
import profilesRoutes from './profiles.routes';
import schedulesRoutes from './schedules.routes';
import bookingsRoutes from './bookings.routes';
import sessionsRoutes from './sessions.routes';
import feedbacksRoutes from './feedbacks.routes';
import notificationsRoutes from './notifications.routes';
import postsRoutes from './posts.routes';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/profiles', profilesRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/feedbacks', feedbacksRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/posts', postsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

export default router;
