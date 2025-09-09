import prisma from '../db/client';
import { CreateBookingDto } from '../schemas/bookings.schema';

export class BookingsService {
  async createBooking(menteeId: number, data: CreateBookingDto) {
    // Check if schedule exists and is available
    const schedule = await prisma.schedule.findUnique({
      where: { id: data.scheduleId },
      include: {
        bookings: true,
      },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (schedule.status !== 'AVAILABLE') {
      throw new Error('Schedule is not available');
    }

    // Check capacity
    const confirmedBookings = schedule.bookings.filter(
      (booking: any) => booking.status === 'CONFIRMED' || booking.status === 'PENDING'
    );

    if (confirmedBookings.length >= schedule.capacity) {
      throw new Error('Schedule is fully booked');
    }

    // Check if mentee already booked this schedule
    const existingBooking = await prisma.booking.findUnique({
      where: {
        scheduleId_menteeId: {
          scheduleId: data.scheduleId,
          menteeId: menteeId,
        },
      },
    });

    if (existingBooking) {
      throw new Error('You have already booked this schedule');
    }

    return await prisma.booking.create({
      data: {
        scheduleId: data.scheduleId,
        menteeId: menteeId,
      },
      include: {
        schedule: {
          include: {
            mentor: {
              select: {
                id: true,
                email: true,
                mentorProfile: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            email: true,
            menteeProfile: true,
          },
        },
      },
    });
  }

  async confirmBooking(bookingId: number, mentorUserId: number) {
    // Check if booking exists and belongs to mentor's schedule
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        schedule: {
          mentorId: mentorUserId,
        },
      },
      include: {
        schedule: true,
        mentee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found or access denied');
    }

    if (booking.status !== 'PENDING') {
      throw new Error('Booking is not in pending status');
    }

    return await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
      include: {
        schedule: {
          include: {
            mentor: {
              select: {
                id: true,
                email: true,
                mentorProfile: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            email: true,
            menteeProfile: true,
          },
        },
      },
    });
  }

  async cancelBooking(bookingId: number, userId: number) {
    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        schedule: {
          include: {
            mentor: {
              select: {
                id: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if user is the mentee who made the booking or the mentor who owns the schedule
    const isBookingOwner = booking.menteeId === userId;
    const isScheduleOwner = booking.schedule.mentor.id === userId;

    if (!isBookingOwner && !isScheduleOwner) {
      throw new Error('Access denied');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking is already cancelled');
    }

    return await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
      include: {
        schedule: {
          include: {
            mentor: {
              select: {
                id: true,
                email: true,
                mentorProfile: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            email: true,
            menteeProfile: true,
          },
        },
      },
    });
  }

  async getBookingsByMentee(menteeId: number) {
    return await prisma.booking.findMany({
      where: { menteeId },
      include: {
        schedule: {
          include: {
            mentor: {
              select: {
                id: true,
                email: true,
                mentorProfile: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getBookingsByMentor(mentorUserId: number) {
    return await prisma.booking.findMany({
      where: {
        schedule: {
          mentorId: mentorUserId,
        },
      },
      include: {
        schedule: true,
        mentee: {
          select: {
            id: true,
            email: true,
            menteeProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
