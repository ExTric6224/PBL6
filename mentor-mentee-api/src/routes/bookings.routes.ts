import { Router } from 'express';
import { BookingsController } from '../controllers/bookings.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { createBookingSchema } from '../schemas/bookings.schema';

const router = Router();
const bookingsController = new BookingsController();

// All routes require authentication
router.post('/', authenticate, validate(createBookingSchema), bookingsController.createBooking.bind(bookingsController));
router.patch('/:id/confirm', authenticate, bookingsController.confirmBooking.bind(bookingsController));
router.patch('/:id/cancel', authenticate, bookingsController.cancelBooking.bind(bookingsController));
router.get('/my', authenticate, bookingsController.getMyBookings.bind(bookingsController));

export default router;
