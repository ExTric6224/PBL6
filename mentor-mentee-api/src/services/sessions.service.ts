import prisma from '../db/client';
import { StartSessionDto, EndSessionDto } from '../schemas/sessions.schema';

export class SessionsService {
  // Tự động start session khi đến giờ
  async autoStartSessions() {
    const now = new Date();
    
    // Tìm các booking đã confirmed và đến giờ nhưng chưa có session
    const bookingsToStart = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        session: null,
        schedule: {
          startAt: {
            lte: now,
          },
          endAt: {
            gte: now,
          },
        },
      },
      include: {
        schedule: true,
      },
    });

    const startedSessions = [];
    for (const booking of bookingsToStart) {
      try {
        const session = await prisma.session.create({
          data: {
            bookingId: booking.id,
            mentorId: booking.schedule.mentorId,
            menteeId: booking.menteeId,
            startedAt: now,
            status: 'IN_PROGRESS',
            autoStarted: true,
          },
          include: {
            booking: {
              include: {
                schedule: true,
              },
            },
          },
        });
        startedSessions.push(session);
      } catch (error) {
        console.error(`Failed to auto-start session for booking ${booking.id}:`, error);
      }
    }

    return startedSessions;
  }

  // Tự động end session khi hết giờ
  async autoEndSessions() {
    const now = new Date();
    
    // Tìm các session đang IN_PROGRESS và đã quá giờ kết thúc
    const sessionsToEnd = await prisma.session.findMany({
      where: {
        status: 'IN_PROGRESS',
        endedAt: null,
        booking: {
          schedule: {
            endAt: {
              lte: now,
            },
          },
        },
      },
      include: {
        booking: {
          include: {
            schedule: true,
          },
        },
      },
    });

    const endedSessions = [];
    for (const session of sessionsToEnd) {
      try {
        const updated = await prisma.session.update({
          where: { id: session.id },
          data: {
            endedAt: now,
            status: 'COMPLETED',
            autoEnded: true,
          },
          include: {
            booking: {
              include: {
                schedule: true,
              },
            },
          },
        });
        endedSessions.push(updated);
      } catch (error) {
        console.error(`Failed to auto-end session ${session.id}:`, error);
      }
    }

    return endedSessions;
  }

  async startSession(mentorUserId: number, data: StartSessionDto) {
    // Check if booking exists and is confirmed
    const booking = await prisma.booking.findFirst({
      where: {
        id: data.bookingId,
        status: 'CONFIRMED',
        schedule: {
          mentorId: mentorUserId,
        },
      },
      include: {
        schedule: true,
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
      // Nếu session đã tồn tại nhưng chưa start, cho phép mentor start
      if (!existingSession.startedAt) {
        return await prisma.session.update({
          where: { id: existingSession.id },
          data: {
            startedAt: new Date(),
            status: 'IN_PROGRESS',
          },
          include: {
            booking: {
              include: {
                schedule: true,
              },
            },
          },
        });
      }
      throw new Error('Session already started');
    }

    return await prisma.session.create({
      data: {
        bookingId: data.bookingId,
        mentorId: mentorUserId,
        menteeId: booking.menteeId,
        startedAt: new Date(),
        status: 'IN_PROGRESS',
        autoStarted: false,
      },
      include: {
        booking: {
          include: {
            schedule: true,
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
        status: 'COMPLETED',
        notes: data.notes,
        autoEnded: false,
      },
      include: {
        booking: {
          include: {
            schedule: true,
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
            schedule: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    mentorprofile: {
                      select: {
                        fullName: true,
                        avatar: true,
                        bio: true,
                      },
                    },
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                menteeprofile: {
                  select: {
                    fullName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        feedback: {
          include: {
            user_feedback_menteeIdTouser: {
              select: {
                id: true,
                email: true,
                menteeprofile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { startedAt: 'desc' },
      ],
    });
  }

  async getSessionsByMentee(menteeId: number) {
    return await prisma.session.findMany({
      where: { menteeId },
      include: {
        booking: {
          include: {
            schedule: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    mentorprofile: {
                      select: {
                        fullName: true,
                        avatar: true,
                        bio: true,
                      },
                    },
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                menteeprofile: {
                  select: {
                    fullName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        feedback: {
          include: {
            user_feedback_menteeIdTouser: {
              select: {
                id: true,
                email: true,
                menteeprofile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { startedAt: 'desc' },
      ],
    });
  }

  async getAllSessions() {
    return await prisma.session.findMany({
      include: {
        user_session_mentorIdTouser: {
          select: {
            id: true,
            email: true,
            mentorprofile: {
              select: {
                fullName: true,
                avatar: true,
                bio: true,
              },
            },
          },
        },
        user_session_menteeIdTouser: {
          select: {
            id: true,
            email: true,
            menteeprofile: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        booking: {
          include: {
            schedule: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    mentorprofile: {
                      select: {
                        fullName: true,
                        avatar: true,
                        bio: true,
                      },
                    },
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                menteeprofile: {
                  select: {
                    fullName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        feedback: {
          include: {
            user_feedback_menteeIdTouser: {
              select: {
                id: true,
                email: true,
                menteeprofile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { startedAt: 'desc' },
      ],
    });
  }

  // Hard delete session (Admin only) - deletes session and feedback
  async deleteSession(sessionId: number) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        feedback: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Delete in transaction: feedback -> session
    await prisma.$transaction(async (tx) => {
      // Delete feedback if exists
      if (session.feedback) {
        await tx.feedback.delete({
          where: { id: session.feedback.id },
        });
      }

      // Delete session
      await tx.session.delete({
        where: { id: sessionId },
      });
    });
  }
}
