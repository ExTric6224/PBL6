import { Router } from 'express';
import { BookingsController } from '../controllers/bookings.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';
import { createBookingSchema } from '../schemas/bookings.schema';
import prisma from '../db/client';

const router = Router();
const bookingsController = new BookingsController();

// All routes require authentication
router.post('/', authenticate, authorizePermissions('booking:create'), validate(createBookingSchema), bookingsController.createBooking.bind(bookingsController));
router.patch('/:id/confirm', authenticate, authorizePermissions('booking:approve'), bookingsController.confirmBooking.bind(bookingsController));
router.patch('/:id/cancel', authenticate, authorizePermissions('booking:cancel', {
  scope: 'own',
  getResourceOwnerId: async (req) => {
    const booking = await prisma.booking.findUnique({ where: { id: Number(req.params.id) } });
    return booking?.menteeId ?? null;
  }
}), bookingsController.cancelBooking.bind(bookingsController));
router.get('/my', authenticate, authorizePermissions('booking:view_own'), bookingsController.getMyBookings.bind(bookingsController));

export default router;
