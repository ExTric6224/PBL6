import prisma from '../db/client';
import { CreateScheduleDto, UpdateScheduleDto, ScheduleQueryDto } from '../schemas/schedules.schema';

// Helper function to include mentor profile with topics
const includeMentorProfileWithTopics = () => ({
  include: {
    expertise: {
      include: {
        topic: true,
      },
    },
  },
});

// Helper function to transform expertise to topics array
const transformExpertise = (expertise: any[]) => {
  return expertise.map(e => e.topic);
};

export class SchedulesService {
  async createSchedule(mentorUserId: number, data: CreateScheduleDto) {
    // Check if user is mentor and has mentor profile
    const user = await prisma.user.findUnique({
      where: { id: mentorUserId },
      include: { mentorprofile: true },
    });

    if (!user || user.role !== 'MENTOR') {
      throw new Error('User is not a mentor');
    }

    if (!user.mentorprofile) {
      throw new Error('Mentor profile not found');
    }

    // Validate schedule times
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    const now = new Date();

    // 1. Check startAt is in the future
    if (startAt <= now) {
      throw new Error('Schedule start time must be in the future');
    }

    // 2. Check endAt > startAt (already validated in schema, but double-check)
    if (endAt <= startAt) {
      throw new Error('Schedule end time must be after start time');
    }

    // 3. Check reasonable duration (at least 30 minutes, max 8 hours)
    const durationMs = endAt.getTime() - startAt.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    const durationHours = durationMinutes / 60;

    if (durationMinutes < 30) {
      throw new Error('Schedule duration must be at least 30 minutes');
    }

    if (durationHours > 8) {
      throw new Error('Schedule duration cannot exceed 8 hours');
    }

    // 4. Check for overlapping schedules
    const overlappingSchedules = await prisma.schedule.findMany({
      where: {
        mentorId: mentorUserId,
        status: 'AVAILABLE',
        OR: [
          // New schedule starts during existing schedule
          {
            AND: [
              { startAt: { lte: startAt } },
              { endAt: { gt: startAt } },
            ],
          },
          // New schedule ends during existing schedule
          {
            AND: [
              { startAt: { lt: endAt } },
              { endAt: { gte: endAt } },
            ],
          },
          // New schedule completely contains existing schedule
          {
            AND: [
              { startAt: { gte: startAt } },
              { endAt: { lte: endAt } },
            ],
          },
        ],
      },
    });

    if (overlappingSchedules.length > 0) {
      throw new Error('Schedule overlaps with existing schedule(s)');
    }

    return await prisma.schedule.create({
      data: {
        mentorId: mentorUserId,
        topic: data.topic,
        description: data.description,
        startAt: startAt,
        endAt: endAt,
        capacity: 1, // Always set to 1 - one mentor can only meet one mentee at a time
      },
      include: {
        user: {
          include: {
            mentorprofile: includeMentorProfileWithTopics(),
          },
        },
      },
    });
  }

  async getSchedules(query: ScheduleQueryDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.mentorId) {
      where.mentorId = query.mentorId; // Now directly User.id
    }

    if (query.from || query.to) {
      where.startAt = {};
      if (query.from) {
        where.startAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.startAt.lte = new Date(query.to);
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        user: {
          include: {
            mentorprofile: includeMentorProfileWithTopics(),
          },
        },
        booking: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return schedules.map((schedule) => ({
      ...schedule,
      mentor: {
        ...schedule.user,
        mentorProfile: schedule.user.mentorprofile ? {
          ...schedule.user.mentorprofile,
          expertise: transformExpertise(schedule.user.mentorprofile.expertise),
        } : null,
      },
    }));
  }

  async updateSchedule(scheduleId: number, mentorUserId: number, data: UpdateScheduleDto) {
    // Check if user is mentor and has mentor profile
    const user = await prisma.user.findUnique({
      where: { id: mentorUserId },
      include: { mentorprofile: true },
    });

    if (!user || user.role !== 'MENTOR') {
      throw new Error('User is not a mentor');
    }

    if (!user.mentorprofile) {
      throw new Error('Mentor profile not found');
    }

    // Check if schedule belongs to mentor
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        mentorId: mentorUserId, // Now using User.id directly
      },
    });

    if (!schedule) {
      throw new Error('Schedule not found or access denied');
    }

    // Validate schedule times if being updated
    const updateData: any = {};
    let startAt = schedule.startAt;
    let endAt = schedule.endAt;

    if (data.startAt) {
      startAt = new Date(data.startAt);
      updateData.startAt = startAt;
    }
    if (data.endAt) {
      endAt = new Date(data.endAt);
      updateData.endAt = endAt;
    }

    // Only validate times if they're being changed
    if (data.startAt || data.endAt) {
      const now = new Date();

      // 1. Check startAt is in the future
      if (startAt <= now) {
        throw new Error('Schedule start time must be in the future');
      }

      // 2. Check endAt > startAt
      if (endAt <= startAt) {
        throw new Error('Schedule end time must be after start time');
      }

      // 3. Check reasonable duration (at least 30 minutes, max 8 hours)
      const durationMs = endAt.getTime() - startAt.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      const durationHours = durationMinutes / 60;

      if (durationMinutes < 30) {
        throw new Error('Schedule duration must be at least 30 minutes');
      }

      if (durationHours > 8) {
        throw new Error('Schedule duration cannot exceed 8 hours');
      }

      // 4. Check for overlapping schedules (excluding current schedule)
      const overlappingSchedules = await prisma.schedule.findMany({
        where: {
          mentorId: mentorUserId,
          status: 'AVAILABLE',
          id: { not: scheduleId }, // Exclude current schedule
          OR: [
            {
              AND: [
                { startAt: { lte: startAt } },
                { endAt: { gt: startAt } },
              ],
            },
            {
              AND: [
                { startAt: { lt: endAt } },
                { endAt: { gte: endAt } },
              ],
            },
            {
              AND: [
                { startAt: { gte: startAt } },
                { endAt: { lte: endAt } },
              ],
            },
          ],
        },
      });

      if (overlappingSchedules.length > 0) {
        throw new Error('Schedule overlaps with existing schedule(s)');
      }
    }

    // Add other fields to update
    if (data.topic !== undefined) {
      updateData.topic = data.topic;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    // Capacity is always 1, ignore any update attempts
    // if (data.capacity !== undefined) {
    //   updateData.capacity = data.capacity;
    // }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    return await prisma.schedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        user: {
          include: {
            mentorprofile: includeMentorProfileWithTopics(),
          },
        },
      },
    });
  }

  async deleteSchedule(scheduleId: number, mentorUserId: number) {
    // Check if user is mentor and has mentor profile
    const user = await prisma.user.findUnique({
      where: { id: mentorUserId },
      include: { mentorprofile: true },
    });

    if (!user || user.role !== 'MENTOR') {
      throw new Error('User is not a mentor');
    }

    if (!user.mentorprofile) {
      throw new Error('Mentor profile not found');
    }

    // Check if schedule belongs to mentor
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        mentorId: mentorUserId, // Now using User.id directly
      },
    });

    if (!schedule) {
      throw new Error('Schedule not found or access denied');
    }

    // Cancel schedule and all related bookings in a transaction
    const [updatedSchedule] = await prisma.$transaction([
      // Set schedule status to CANCELLED
      prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: 'CANCELLED' },
      }),
      // Cancel all PENDING and CONFIRMED bookings for this schedule
      prisma.booking.updateMany({
        where: {
          scheduleId: scheduleId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        data: { status: 'CANCELLED' },
      }),
    ]);

    return updatedSchedule;
  }

  async getMentorSchedules(mentorUserId: number, query: ScheduleQueryDto) {
    // Check if user is mentor and has mentor profile
    const user = await prisma.user.findUnique({
      where: { id: mentorUserId },
      include: { mentorprofile: true },
    });

    if (!user || user.role !== 'MENTOR') {
      throw new Error('User is not a mentor');
    }

    if (!user.mentorprofile) {
      throw new Error('Mentor profile not found');
    }

    const where: any = {
      mentorId: mentorUserId, // Now using User.id directly
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.from || query.to) {
      where.startAt = {};
      if (query.from) {
        where.startAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.startAt.lte = new Date(query.to);
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        user: {
          include: {
            mentorprofile: includeMentorProfileWithTopics(),
          },
        },
        booking: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return schedules.map((schedule) => ({
      ...schedule,
      mentor: {
        ...schedule.user,
        mentorProfile: schedule.user.mentorprofile ? {
          ...schedule.user.mentorprofile,
          expertise: transformExpertise(schedule.user.mentorprofile.expertise),
        } : null,
      },
    }));
  }

  async getScheduleById(scheduleId: number) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        user: {
          include: {
            mentorprofile: includeMentorProfileWithTopics(),
          },
        },
        booking: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    return {
      ...schedule,
      mentor: {
        ...schedule.user,
        mentorProfile: schedule.user.mentorprofile ? {
          ...schedule.user.mentorprofile,
          expertise: transformExpertise(schedule.user.mentorprofile.expertise),
        } : null,
      },
    };
  }

  // Hard delete schedule (Admin only) - deletes schedule and all related data
  async hardDeleteSchedule(scheduleId: number) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        booking: {
          include: {
            session: {
              include: {
                feedback: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Delete in transaction with proper order:
    // feedback -> session -> booking -> schedule
    await prisma.$transaction(async (tx) => {
      // Delete all feedback for sessions related to bookings of this schedule
      for (const booking of schedule.booking) {
        if (booking.session?.feedback) {
          await tx.feedback.delete({
            where: { id: booking.session.feedback.id },
          });
        }
        if (booking.session) {
          await tx.session.delete({
            where: { id: booking.session.id },
          });
        }
      }

      // Delete all bookings
      await tx.booking.deleteMany({
        where: { scheduleId },
      });

      // Finally delete the schedule
      await tx.schedule.delete({
        where: { id: scheduleId },
      });
    });
  }
}  