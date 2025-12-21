import prisma from '../db/client';
import { CreateBookingDto } from '../schemas/bookings.schema';
import { NotificationsService } from './notifications.service';

export class BookingsService {
  async createBooking(menteeId: number, data: CreateBookingDto) {
    // Check if schedule exists and is available
    const schedule = await prisma.schedule.findUnique({
      where: { id: data.scheduleId },
      include: {
        booking: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          }
        },
      },
    });

    if (!schedule) {
      throw new Error('Không tìm thấy lịch học');
    }

    if (schedule.status !== 'AVAILABLE') {
      throw new Error('Lịch học không khả dụng');
    }

    // For 1-1 booking: Check if there's already a confirmed or pending booking
    // Since capacity is always 1, we only need to check if any active booking exists
    if (schedule.booking.length > 0) {
      throw new Error('Lịch học này đã được đặt');
    }

    // Check if this mentee already booked this schedule (redundant check, but good for clarity)
    const existingBooking = await prisma.booking.findUnique({
      where: {
        scheduleId_menteeId: {
          scheduleId: data.scheduleId,
          menteeId: menteeId,
        },
      },
    });

    if (existingBooking) {
      // If previous booking was cancelled, show specific rejection message
      if (existingBooking.status === 'CANCELLED') {
        throw new Error('Bạn đã đặt 1 lần và bị từ chối, không thể đặt nữa');
      }
      throw new Error('Bạn đã đặt lịch học này rồi');
    }

    // Create booking - this is a 1-1 booking (one mentor, one mentee)
    const booking = await prisma.booking.create({
      data: {
        scheduleId: data.scheduleId,
        menteeId: menteeId,
        notes: data.notes,
      },
      include: {
        schedule: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                mentorprofile: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            menteeprofile: true,
          },
        },
      },
    });

    // Update schedule status to BOOKED
    await prisma.schedule.update({
      where: { id: data.scheduleId },
      data: { status: 'BOOKED' },
    });

    // Send notification to mentor about new booking request
    const notificationsService = new NotificationsService();
    const bookingTime = new Date(booking.schedule.startAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    await notificationsService.createNotification(
      booking.schedule.user.id,
      'booking_request',
      'Yêu cầu đặt lịch mới',
      `${booking.user.email} đã yêu cầu đặt buổi học của bạn vào ${bookingTime}.`
    );

    return booking;
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
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Không tìm thấy lượt đặt lịch hoặc không có quyền truy cập');
    }

    if (booking.status !== 'PENDING') {
      throw new Error('Lượt đặt lịch không ở trạng thái chờ xác nhận');
    }

    // For 1-1 booking: Confirm the booking and mark schedule as BOOKED
    // This ensures no other mentee can book this schedule
    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
        include: {
          schedule: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  mentorprofile: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              menteeprofile: true,
            },
          },
        },
      }),
      // Update schedule status to BOOKED (1-1 booking is now complete)
      prisma.schedule.update({
        where: { id: booking.scheduleId },
        data: { status: 'BOOKED' },
      }),
    ]);

    // Send notification to mentee about booking confirmation
    const notificationsService = new NotificationsService();
    const confirmedTime = new Date(updatedBooking.schedule.startAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    await notificationsService.createNotification(
      updatedBooking.user.id,
      'booking_confirmed',
      'Đặt lịch đã được xác nhận',
      `Lượt đặt lịch của bạn với ${updatedBooking.schedule.user.email} vào ${confirmedTime} đã được xác nhận.`
    );

    return updatedBooking;
  }

  async cancelBooking(bookingId: number, userId: number) {
    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        schedule: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
        user: {
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
    const isScheduleOwner = booking.schedule.user.id === userId;

    if (!isBookingOwner && !isScheduleOwner) {
      throw new Error('Không có quyền truy cập');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Lượt đặt lịch đã bị hủy');
    }

    // For 1-1 booking: Cancel the booking and free up the schedule if it was confirmed
    const wasConfirmed = booking.status === 'CONFIRMED';
    
    if (wasConfirmed && booking.schedule.status === 'BOOKED') {
      // Cancel the 1-1 booking and make schedule available again
      const [updatedBooking] = await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' },
          include: {
            schedule: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    mentorprofile: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                menteeprofile: true,
              },
            },
          },
        }),
        // Free up the schedule so another mentee can book
        prisma.schedule.update({
          where: { id: booking.scheduleId },
          data: { status: 'AVAILABLE' },
        }),
      ]);
      return updatedBooking;
    } else {
      // If booking was only pending, cancel it and free up the schedule
      const [updatedBooking] = await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' },
          include: {
            schedule: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    mentorprofile: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                menteeprofile: true,
              },
            },
          },
        }),
        // Free up the schedule for new bookings
        prisma.schedule.update({
          where: { id: booking.scheduleId },
          data: { status: 'AVAILABLE' },
        }),
      ]);
      return updatedBooking;
    }
  }

  async getBookingsByMentee(menteeId: number) {
    const bookings = await prisma.booking.findMany({
      where: { menteeId },
      include: {
        session: true,
        schedule: {
          include: {
            user: {
              include: {
                mentorprofile: {
                  include: {
                    expertise: {
                      include: {
                        topic: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match frontend expectations
    return bookings.map(booking => ({
      ...booking,
      schedule: booking.schedule ? {
        ...booking.schedule,
        mentor: {
          ...booking.schedule.user,
          mentorProfile: booking.schedule.user.mentorprofile ? {
            ...booking.schedule.user.mentorprofile,
            expertise: booking.schedule.user.mentorprofile.expertise?.map(e => e.topic) || [],
          } : null,
        },
      } : null,
    }));
  }

  async getBookingsByMentor(mentorUserId: number) {
    const bookings = await prisma.booking.findMany({
      where: {
        schedule: {
          mentorId: mentorUserId,
        },
      },
      include: {
        session: true,
        schedule: {
          include: {
            user: {
              include: {
                mentorprofile: {
                  include: {
                    expertise: {
                      include: {
                        topic: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        user: {
          include: {
            menteeprofile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match frontend expectations
    return bookings.map(booking => ({
      ...booking,
      mentee: booking.user,
      schedule: booking.schedule ? {
        ...booking.schedule,
        mentor: {
          ...booking.schedule.user,
          mentorProfile: booking.schedule.user.mentorprofile ? {
            ...booking.schedule.user.mentorprofile,
            expertise: booking.schedule.user.mentorprofile.expertise?.map(e => e.topic) || [],
          } : null,
        },
      } : null,
    }));
  }

  async getAllBookings() {
    const bookings = await prisma.booking.findMany({
      include: {
        schedule: {
          include: {
            user: {
              include: {
                mentorprofile: {
                  include: {
                    expertise: {
                      include: {
                        topic: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        user: {
          include: {
            menteeprofile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match frontend expectations
    return bookings.map(booking => ({
      ...booking,
      mentee: booking.user,
      schedule: booking.schedule ? {
        ...booking.schedule,
        mentor: {
          ...booking.schedule.user,
          mentorProfile: booking.schedule.user.mentorprofile ? {
            ...booking.schedule.user.mentorprofile,
            expertise: booking.schedule.user.mentorprofile.expertise?.map(e => e.topic) || [],
          } : null,
        },
      } : null,
    }));
  }

  async deleteBooking(bookingId: number) {
    // Find booking first to check if it exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        schedule: true,
        session: true, // Include session to check if it exists
      },
    });

    if (!booking) {
      throw new Error('Không tìm thấy lượt đặt lịch');
    }

    // If booking was CONFIRMED and schedule is BOOKED, set schedule back to AVAILABLE
    const shouldUpdateSchedule = booking.status === 'CONFIRMED' && booking.schedule.status === 'BOOKED';

    // Use transaction to delete session (if exists), booking, and update schedule
    await prisma.$transaction(async (tx) => {
      // Delete session first if it exists (due to foreign key constraint)
      if (booking.session) {
        // Also delete feedback if session has feedback
        await tx.feedback.deleteMany({
          where: { sessionId: booking.session.id },
        });
        await tx.session.delete({
          where: { id: booking.session.id },
        });
      }

      // Delete the booking
      await tx.booking.delete({
        where: { id: bookingId },
      });

      // Update schedule status if needed
      if (shouldUpdateSchedule) {
        await tx.schedule.update({
          where: { id: booking.scheduleId },
          data: { status: 'AVAILABLE' },
        });
      }
    });
  }

  async updateBooking(bookingId: number, data: any, userRole?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        schedule: true,
        session: true,
      },
    });

    if (!booking) {
      throw new Error('Không tìm thấy lượt đặt lịch');
    }

    // Validate status if provided
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error('Trạng thái không hợp lệ. Phải là một trong: ' + validStatuses.join(', '));
    }

    // KHÔNG cho edit nếu đã có session IN_PROGRESS hoặc COMPLETED
    if (booking.session && ['IN_PROGRESS', 'COMPLETED'].includes(booking.session.status)) {
      throw new Error('Không thể chỉnh sửa lượt đặt lịch có buổi học đang diễn ra hoặc đã hoàn thành');
    }

    // KHÔNG cho edit nếu đã quá thời gian
    const now = new Date();
    if (booking.schedule.endAt < now) {
      throw new Error('Không thể chỉnh sửa lượt đặt lịch cho lịch học đã qua');
    }

    // CHỈ mentor hoặc admin mới đổi được status (mentee không được tự confirm)
    if (data.status && data.status !== booking.status) {
      if (userRole && userRole !== 'MENTOR' && userRole !== 'ADMIN') {
        throw new Error('Chỉ mentor hoặc admin mới có thể thay đổi trạng thái đặt lịch');
      }
      
      // KHÔNG cho đổi thủ công sang COMPLETED (chỉ tự động khi session kết thúc)
      if (data.status === 'COMPLETED') {
        throw new Error('Không thể đặt thủ công trạng thái đặt lịch thành HOÀN THÀNH. Đặt lịch sẽ tự động hoàn thành khi buổi học kết thúc.');
      }
    }

    // Update booking
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
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
              },
            },
          },
        },
      },
    });
  }
}
