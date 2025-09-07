import prisma from '../db/client';
import { CreateScheduleDto, UpdateScheduleDto, ScheduleQueryDto } from '../schemas/schedules.schema';

export class SchedulesService {
  async createSchedule(mentorUserId: number, data: CreateScheduleDto) {
    // Check if user is mentor and has mentor profile
    const user = await prisma.user.findUnique({
      where: { id: mentorUserId },
      include: { mentorProfile: true },
    });

    if (!user || user.role !== 'MENTOR') {
      throw new Error('User is not a mentor');
    }

    if (!user.mentorProfile) {
      throw new Error('Mentor profile not found');
    }

    return await prisma.schedule.create({
      data: {
        mentorId: mentorUserId, // Now using User.id directly
        topic: data.topic,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        capacity: data.capacity,
      },
      include: {
        mentor: {
          select: {
            id: true,
            email: true,
            mentorProfile: {
              select: {
                id: true,
                fullName: true,
                school: true,
                expertise: true,
                degree: true,
                yearsExp: true,
                bio: true,
              },
            },
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
        mentor: {
          select: {
            id: true,
            email: true,
            mentorProfile: {
              select: {
                id: true,
                fullName: true,
                school: true,
                expertise: true,
                degree: true,
                yearsExp: true,
                bio: true,
              },
            },
          },
        },
        bookings: {
          include: {
            mentee: {
              select: {
                id: true,
                email: true,
              },
            },
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
        ...schedule.mentor,
        mentorProfile: schedule.mentor.mentorProfile ? {
          ...schedule.mentor.mentorProfile,
          expertise: JSON.parse(schedule.mentor.mentorProfile.expertise as string),
        } : null,
      },
    }));
  }

  async updateSchedule(scheduleId: number, mentorUserId: number, data: UpdateScheduleDto) {
    // Check if user is mentor and has mentor profile
    const user = await prisma.user.findUnique({
      where: { id: mentorUserId },
      include: { mentorProfile: true },
    });

    if (!user || user.role !== 'MENTOR') {
      throw new Error('User is not a mentor');
    }

    if (!user.mentorProfile) {
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

    const updateData: any = { ...data };
    if (data.startAt) {
      updateData.startAt = new Date(data.startAt);
    }
    if (data.endAt) {
      updateData.endAt = new Date(data.endAt);
    }

    return await prisma.schedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        mentor: {
          select: {
            id: true,
            email: true,
            mentorProfile: {
              select: {
                id: true,
                fullName: true,
                school: true,
                expertise: true,
                degree: true,
                yearsExp: true,
                bio: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteSchedule(scheduleId: number, mentorUserId: number) {
    // Check if user is mentor and has mentor profile
    const user = await prisma.user.findUnique({
      where: { id: mentorUserId },
      include: { mentorProfile: true },
    });

    if (!user || user.role !== 'MENTOR') {
      throw new Error('User is not a mentor');
    }

    if (!user.mentorProfile) {
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

    // Set status to CANCELLED instead of deleting
    return await prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: 'CANCELLED' },
    });
  }

  async getMentorSchedules(mentorUserId: number, query: ScheduleQueryDto) {
    // Check if user is mentor and has mentor profile
    const user = await prisma.user.findUnique({
      where: { id: mentorUserId },
      include: { mentorProfile: true },
    });

    if (!user || user.role !== 'MENTOR') {
      throw new Error('User is not a mentor');
    }

    if (!user.mentorProfile) {
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
        mentor: {
          select: {
            id: true,
            email: true,
            mentorProfile: {
              select: {
                id: true,
                fullName: true,
                school: true,
                expertise: true,
                degree: true,
                yearsExp: true,
                bio: true,
              },
            },
          },
        },
        bookings: {
          include: {
            mentee: {
              select: {
                id: true,
                email: true,
              },
            },
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
        ...schedule.mentor,
        mentorProfile: schedule.mentor.mentorProfile ? {
          ...schedule.mentor.mentorProfile,
          expertise: JSON.parse(schedule.mentor.mentorProfile.expertise as string),
        } : null,
      },
    }));
  }

  async getScheduleById(scheduleId: number) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        mentor: {
          select: {
            id: true,
            email: true,
            mentorProfile: {
              select: {
                id: true,
                fullName: true,
                school: true,
                expertise: true,
                degree: true,
                yearsExp: true,
                bio: true,
              },
            },
          },
        },
        bookings: {
          include: {
            mentee: {
              select: {
                id: true,
                email: true,
              },
            },
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
        ...schedule.mentor,
        mentorProfile: schedule.mentor.mentorProfile ? {
          ...schedule.mentor.mentorProfile,
          expertise: JSON.parse(schedule.mentor.mentorProfile.expertise as string),
        } : null,
      },
    };
  }
}  