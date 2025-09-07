import prisma from '../db/client';
import { StartSessionDto, EndSessionDto } from '../schemas/sessions.schema';

export class SessionsService {
  async startSession(mentorUserId: number, data: StartSessionDto) {
    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
    });

    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }

    // Check if booking exists and is confirmed
    const booking = await prisma.booking.findFirst({
      where: {
        id: data.bookingId,
        status: 'CONFIRMED',
        schedule: {
          mentorId: mentorProfile.id,
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
      throw new Error('Booking not found, not confirmed, or access denied');
    }

    // Check if session already exists
    const existingSession = await prisma.session.findUnique({
      where: { bookingId: data.bookingId },
    });

    if (existingSession) {
      throw new Error('Session already exists for this booking');
    }

    return await prisma.session.create({
      data: {
        bookingId: data.bookingId,
        mentorId: mentorUserId,
        menteeId: booking.menteeId,
        startedAt: new Date(),
      },
      include: {
        booking: {
          include: {
            schedule: true,
          },
        },
        mentor: {
          select: {
            id: true,
            email: true,
          },
        },
        mentee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async endSession(mentorUserId: number, data: EndSessionDto) {
    // Find session
    const session = await prisma.session.findFirst({
      where: {
        id: data.sessionId,
        mentorId: mentorUserId,
      },
      include: {
        booking: {
          include: {
            schedule: true,
          },
        },
        mentor: {
          select: {
            id: true,
            email: true,
          },
        },
        mentee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found or access denied');
    }

    if (session.endedAt) {
      throw new Error('Session has already ended');
    }

    return await prisma.session.update({
      where: { id: data.sessionId },
      data: {
        endedAt: new Date(),
        notes: data.notes,
      },
      include: {
        booking: {
          include: {
            schedule: true,
          },
        },
        mentor: {
          select: {
            id: true,
            email: true,
          },
        },
        mentee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async getSessionsByMentor(mentorUserId: number) {
    return await prisma.session.findMany({
      where: { mentorId: mentorUserId },
      include: {
        booking: {
          include: {
            schedule: true,
          },
        },
        mentee: {
          select: {
            id: true,
            email: true,
          },
        },
        feedback: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async getSessionsByMentee(menteeId: number) {
    return await prisma.session.findMany({
      where: { menteeId },
      include: {
        booking: {
          include: {
            schedule: true,
          },
        },
        mentor: {
          select: {
            id: true,
            email: true,
          },
        },
        feedback: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }
}
