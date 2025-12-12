import { Response } from 'express';
import 'express-async-errors';
import { BookingsService } from '../services/bookings.service';
import { success, authError, notFoundError, conflictError } from '../utils/responses';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const bookingsService = new BookingsService();

export class BookingsController {
  async createBooking(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'MENTEE') {
        return authError(res, 'Only mentees can create bookings');
      }

      const booking = await bookingsService.createBooking(req.user!.sub, req.body);
      return success(res, booking, 201);
    } catch (error: any) {
      if (error.message === 'Schedule not found') {
        return notFoundError(res, 'Schedule not found');
      }
      if (error.message === 'Schedule is not available' || 
          error.message === 'Schedule is fully booked' ||
          error.message === 'You have already booked this schedule') {
        return conflictError(res, error.message);
      }
      throw error;
    }
  }

  async confirmBooking(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user!.role !== 'MENTOR') {
        return authError(res, 'Only mentors can confirm bookings');
      }

      const bookingId = parseInt(req.params.id, 10);
      const booking = await bookingsService.confirmBooking(bookingId, req.user!.sub);
      return success(res, booking);
    } catch (error: any) {
      if (error.message === 'Booking not found or access denied') {
        return notFoundError(res, 'Booking not found or you do not have permission to confirm it');
      }
      if (error.message === 'Booking is not in pending status') {
        return conflictError(res, error.message);
      }
      if (error.message === 'Mentor profile not found') {
        return notFoundError(res, 'Mentor profile not found');
      }
      throw error;
    }
  }

  async cancelBooking(req: AuthenticatedRequest, res: Response) {
    try {
      const bookingId = parseInt(req.params.id, 10);
      const booking = await bookingsService.cancelBooking(bookingId, req.user!.sub);
      return success(res, booking);
    } catch (error: any) {
      if (error.message === 'Booking not found') {
        return notFoundError(res, 'Booking not found');
      }
      if (error.message === 'Access denied') {
        return authError(res, 'You do not have permission to cancel this booking');
      }
      if (error.message === 'Booking is already cancelled') {
        return conflictError(res, error.message);
      }
      throw error;
    }
  }

  async getMyBookings(req: AuthenticatedRequest, res: Response) {
    try {
      let bookings;
      
      if (req.user!.role === 'ADMIN') {
        // Admin can see all bookings
        bookings = await bookingsService.getAllBookings();
      } else if (req.user!.role === 'MENTEE') {
        bookings = await bookingsService.getBookingsByMentee(req.user!.sub);
      } else if (req.user!.role === 'MENTOR') {
        bookings = await bookingsService.getBookingsByMentor(req.user!.sub);
      } else {
        return authError(res, 'Invalid user role');
      }

      return success(res, bookings);
    } catch (error: any) {
      if (error.message === 'Mentor profile not found') {
        return notFoundError(res, 'Mentor profile not found');
      }
      throw error;
    }
  }

  async deleteBooking(req: AuthenticatedRequest, res: Response) {
    try {
      const bookingId = parseInt(req.params.id, 10);
      await bookingsService.deleteBooking(bookingId);
      return success(res, { message: 'Booking deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Booking not found') {
        return notFoundError(res, 'Booking not found');
      }
      throw error;
    }
  }
}
