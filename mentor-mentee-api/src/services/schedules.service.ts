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
      throw new Error('Người dùng không phải là mentor');
    }

    if (!user.mentorprofile) {
      throw new Error('Không tìm thấy hồ sơ mentor');
    }

    // Validate schedule times
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    const now = new Date();

    // 1. Check startAt is in the future
    if (startAt <= now) {
      throw new Error('Thời gian bắt đầu lịch học phải ở tương lai');
    }

    // 2. Check endAt > startAt (already validated in schema, but double-check)
    if (endAt <= startAt) {
      throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

    // 3. Check reasonable duration (at least 30 minutes, max 8 hours)
    const durationMs = endAt.getTime() - startAt.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    const durationHours = durationMinutes / 60;

    if (durationMinutes < 30) {
      throw new Error('Thời lượng lịch học phải ít nhất 30 phút');
    }

    if (durationHours > 8) {
      throw new Error('Thời lượng lịch học không được vượt quá 8 giờ');
    }

    // 4. Check for overlapping schedules
    // Hai khoảng thời gian overlap nếu:
    // - Khoảng mới bắt đầu trước khi khoảng cũ kết thúc VÀ
    // - Khoảng mới kết thúc sau khi khoảng cũ bắt đầu
    const overlappingSchedules = await prisma.schedule.findMany({
      where: {
        mentorId: mentorUserId,
        status: 'AVAILABLE',
        AND: [
          { startAt: { lt: endAt } },   // Khoảng cũ bắt đầu trước khi khoảng mới kết thúc
          { endAt: { gt: startAt } },   // Khoảng cũ kết thúc sau khi khoảng mới bắt đầu
        ],
      },
    });

    if (overlappingSchedules.length > 0) {
      throw new Error('Lịch học trùng với lịch học hiện có');
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
      throw new Error('Người dùng không phải là mentor');
    }

    if (!user.mentorprofile) {
      throw new Error('Không tìm thấy hồ sơ mentor');
    }

    // Check if schedule belongs to mentor
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        mentorId: mentorUserId, // Now using User.id directly
      },
    });

    if (!schedule) {
      throw new Error('Không tìm thấy lịch học hoặc không có quyền truy cập');
    }

    // KHÔNG cho edit nếu schedule đã bị cancelled
    if (schedule.status === 'CANCELLED') {
      throw new Error('Không thể chỉnh sửa lịch học đã hủy');
    }

    // KHÔNG cho edit nếu có booking đã confirmed
    const hasConfirmedBooking = await prisma.booking.findFirst({
      where: {
        scheduleId: scheduleId,
        status: 'CONFIRMED',
      },
    });

    if (hasConfirmedBooking) {
      throw new Error('Không thể chỉnh sửa lịch học đã có booking xác nhận. Vui lòng hủy booking trước.');
    }

    // KHÔNG cho edit thời gian nếu đã quá giờ bắt đầu
    const now = new Date();
    if ((data.startAt || data.endAt) && schedule.startAt <= now) {
      throw new Error('Không thể chỉnh sửa thời gian lịch học đã bắt đầu');
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
        throw new Error('Thời gian bắt đầu lịch học phải ở tương lai');
      }

      // 2. Check endAt > startAt
      if (endAt <= startAt) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      }

      // 3. Check reasonable duration (at least 30 minutes, max 8 hours)
      const durationMs = endAt.getTime() - startAt.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      const durationHours = durationMinutes / 60;

      if (durationMinutes < 30) {
        throw new Error('Thời lượng lịch học phải ít nhất 30 phút');
      }

      if (durationHours > 8) {
        throw new Error('Thời lượng lịch học không được vượt quá 8 giờ');
      }

      // 4. Check for overlapping schedules (excluding current schedule)
      const overlappingSchedules = await prisma.schedule.findMany({
        where: {
          mentorId: mentorUserId,
          status: 'AVAILABLE',
          id: { not: scheduleId }, // Exclude current schedule
          AND: [
            { startAt: { lt: endAt } },   // Khoảng cũ bắt đầu trước khi khoảng mới kết thúc
            { endAt: { gt: startAt } },   // Khoảng cũ kết thúc sau khi khoảng mới bắt đầu
          ],
        },
      });

      if (overlappingSchedules.length > 0) {
        throw new Error('Lịch học trùng với lịch học hiện có');
      }
    }

    // Add other fields to update
    if (data.topic !== undefined) {
      updateData.topic = data.topic;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    // Capacity is always 1, không cho edit
    // status chỉ cho đổi giữa AVAILABLE và CANCELLED (không cho đổi thủ công sang BOOKED)
    if (data.status !== undefined) {
      if (data.status === 'BOOKED') {
        throw new Error('Không thể đặt trạng thái lịch học thành BOOKED thủ công. Trạng thái sẽ tự động cập nhật khi booking được xác nhận.');
      }
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

  // Admin can update any schedule
  async adminUpdateSchedule(scheduleId: number, data: UpdateScheduleDto) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error('Không tìm thấy lịch học');
    }

    // KHÔNG cho edit nếu schedule đã bị cancelled
    if (schedule.status === 'CANCELLED') {
      throw new Error('Không thể chỉnh sửa lịch học đã hủy');
    }

    // KHÔNG cho edit nếu có booking đã confirmed
    const hasConfirmedBooking = await prisma.booking.findFirst({
      where: {
        scheduleId: scheduleId,
        status: 'CONFIRMED',
      },
    });

    if (hasConfirmedBooking) {
      throw new Error('Không thể chỉnh sửa lịch học đã có booking xác nhận. Vui lòng hủy booking trước.');
    }

    // KHÔNG cho edit thời gian nếu đã quá giờ bắt đầu
    const now = new Date();
    if ((data.startAt || data.endAt) && schedule.startAt <= now) {
      throw new Error('Không thể chỉnh sửa thời gian lịch học đã bắt đầu');
    }

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

    // Validate times if being changed
    if (data.startAt || data.endAt) {
      if (endAt <= startAt) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      }

      const durationMs = endAt.getTime() - startAt.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      const durationHours = durationMinutes / 60;

      if (durationMinutes < 30) {
        throw new Error('Thời lượng lịch học phải ít nhất 30 phút');
      }

      if (durationHours > 8) {
        throw new Error('Thời lượng lịch học không được vượt quá 8 giờ');
      }
    }

    // Add other fields
    if (data.topic !== undefined) {
      updateData.topic = data.topic;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    // Admin can change status freely (including to BOOKED if needed)
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
      throw new Error('Người dùng không phải là mentor');
    }

    if (!user.mentorprofile) {
      throw new Error('Không tìm thấy hồ sơ mentor');
    }

    // Check if schedule belongs to mentor
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        mentorId: mentorUserId, // Now using User.id directly
      },
    });

    if (!schedule) {
      throw new Error('Không tìm thấy lịch học hoặc không có quyền truy cập');
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
      throw new Error('Người dùng không phải là mentor');
    }

    if (!user.mentorprofile) {
      throw new Error('Không tìm thấy hồ sơ mentor');
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
      throw new Error('Không tìm thấy lịch học');
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
      throw new Error('Không tìm thấy lịch học');
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