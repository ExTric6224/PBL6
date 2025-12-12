import { Router, Request } from 'express';
import { BookingsController } from '../controllers/bookings.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';
import { createBookingSchema } from '../schemas/bookings.schema';
import prisma from '../db/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();
const bookingsController = new BookingsController();

// All routes require authentication
router.post('/', authenticate, authorizePermissions('booking:create'), validate(createBookingSchema), bookingsController.createBooking.bind(bookingsController));
router.patch('/:id/confirm', authenticate, authorizePermissions('booking:approve'), bookingsController.confirmBooking.bind(bookingsController));
router.patch('/:id/cancel', authenticate, authorizePermissions('booking:cancel', {
  scope: 'own',
  getResourceOwnerId: async (req: AuthenticatedRequest) => {
    const booking = await prisma.booking.findUnique({ 
      where: { id: Number(req.params.id) },
      include: { schedule: true }
    });
    if (!booking) return null;
    
    // Allow both mentee and mentor to cancel
    const userId = Number(req.user!.sub);
    if (booking.menteeId === userId || booking.schedule.mentorId === userId) {
      return userId; // Return user's own ID if they have permission
    }
    return null;
  }
}), bookingsController.cancelBooking.bind(bookingsController));
router.get('/my', authenticate, authorizePermissions('booking:view_own'), bookingsController.getMyBookings.bind(bookingsController));
router.delete('/:id', authenticate, authorizePermissions('booking:delete'), bookingsController.deleteBooking.bind(bookingsController));

export default router;
