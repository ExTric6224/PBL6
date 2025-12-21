import prisma from '../db/client';
import { CreateMentorProfileDto, UpdateMentorProfileDto, CreateMenteeProfileDto, UpdateMenteeProfileDto } from '../schemas/profiles.schema';
import { error } from '../utils/responses';

export class ProfilesService {
  async createOrUpdateMentorProfile(userId: number, data: CreateMentorProfileDto | UpdateMentorProfileDto) {
    const existingProfile = await prisma.mentorprofile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await prisma.mentorprofile.update({
        where: { userId },
        data: {
          fullName: data.fullName,
          avatar: data.avatar,
          phoneNumber: data.phoneNumber,
          school: data.school,
          degree: data.degree,
          yearsExp: data.yearsExp,
          bio: data.bio,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          expertise: {
            include: {
              topic: true,
            },
          },
        },
      });

      // Update expertise topics if provided
      if (data.expertise && Array.isArray(data.expertise)) {
        // Delete existing expertise
        await prisma.mentorTopicExpertise.deleteMany({
          where: { mentorProfileId: existingProfile.id },
        });

        // Create new expertise
        if (data.expertise.length > 0) {
          await prisma.mentorTopicExpertise.createMany({
            data: data.expertise.map(topicId => ({
              mentorProfileId: existingProfile.id,
              topicId: Number(topicId),
            })),
          });
        }

        // Fetch updated profile with new expertise
        const profileWithExpertise = await prisma.mentorprofile.findUnique({
          where: { id: existingProfile.id },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
            expertise: {
              include: {
                topic: true,
              },
            },
          },
        });

        // Transform expertise to array of topics
        return {
          ...profileWithExpertise,
          expertise: profileWithExpertise!.expertise.map(e => e.topic),
        };
      }

      // Transform expertise to array of topics
      return {
        ...updatedProfile,
        expertise: updatedProfile.expertise.map(e => e.topic),
      };
    } else {
      // Create new profile - ensure required fields are present
      if (!data.fullName) {
        throw new Error('Họ tên là bắt buộc khi tạo hồ sơ mentor');
      }
      
      const newProfile = await prisma.mentorprofile.create({
        data: {
          userId,
          fullName: data.fullName,
          avatar: data.avatar,
          phoneNumber: data.phoneNumber,
          school: data.school,
          degree: data.degree,
          yearsExp: data.yearsExp,
          bio: data.bio,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Add expertise topics if provided
      if (data.expertise && Array.isArray(data.expertise) && data.expertise.length > 0) {
        await prisma.mentorTopicExpertise.createMany({
          data: data.expertise.map(topicId => ({
            mentorProfileId: newProfile.id,
            topicId: Number(topicId),
          })),
        });

        // Fetch profile with expertise
        const profileWithExpertise = await prisma.mentorprofile.findUnique({
          where: { id: newProfile.id },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
            expertise: {
              include: {
                topic: true,
              },
            },
          },
        });

        // Transform expertise to array of topics
        return {
          ...profileWithExpertise,
          expertise: profileWithExpertise!.expertise.map(e => e.topic),
        };
      }

      return {
        ...newProfile,
        expertise: [],
      };
    }
  }

  async getMentorProfile(userId: number) {
    const profile = await prisma.mentorprofile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        expertise: {
          include: {
            topic: true,
          },
        },
      },
    });

    if (!profile) {
      throw new Error('Không tìm thấy hồ sơ mentor');
    }

    // Transform expertise to array of topics
    return {
      ...profile,
      expertise: profile.expertise.map(e => e.topic),
    };
  }

  async createOrUpdateMenteeProfile(userId: number, data: CreateMenteeProfileDto | UpdateMenteeProfileDto) {
    const existingProfile = await prisma.menteeprofile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      // Update existing profile
      console.log('[DEBUG] Update mentee profile:', {
        userId,
        data,
        interests: data.interests,
      });
      
      const updatedProfile = await prisma.menteeprofile.update({
        where: { userId },
        data: {
          fullName: data.fullName,
          avatar: data.avatar,
          phoneNumber: data.phoneNumber,
          goals: data.goals,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          interests: {
            include: {
              topic: true,
            },
          },
        },
      });

      // Update interest topics if provided
      if (data.interests && Array.isArray(data.interests)) {
        // Delete existing interests
        await prisma.menteeTopicInterest.deleteMany({
          where: { menteeProfileId: existingProfile.id },
        });

        // Create new interests
        if (data.interests.length > 0) {
          await prisma.menteeTopicInterest.createMany({
            data: data.interests.map(topicId => ({
              menteeProfileId: existingProfile.id,
              topicId: Number(topicId),
            })),
          });
        }

        // Fetch updated profile with new interests
        const profileWithInterests = await prisma.menteeprofile.findUnique({
          where: { id: existingProfile.id },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
            interests: {
              include: {
                topic: true,
              },
            },
          },
        });

        // Transform interests to array of topics
        return {
          ...profileWithInterests,
          interests: profileWithInterests!.interests.map(i => i.topic),
        };
      }

      // Transform interests to array of topics
      return {
        ...updatedProfile,
        interests: updatedProfile.interests.map(i => i.topic),
      };
    } else {
      // Create new profile - ensure required fields are present
      if (!data.fullName) {
        throw new Error('Họ tên là bắt buộc khi tạo hồ sơ mentee');
      }
      
      const newProfile = await prisma.menteeprofile.create({
        data: {
          userId,
          fullName: data.fullName,
          avatar: data.avatar,
          phoneNumber: data.phoneNumber,
          goals: data.goals,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Add interest topics if provided
      if (data.interests && Array.isArray(data.interests) && data.interests.length > 0) {
        await prisma.menteeTopicInterest.createMany({
          data: data.interests.map(topicId => ({
            menteeProfileId: newProfile.id,
            topicId: Number(topicId),
          })),
        });

        // Fetch profile with interests
        const profileWithInterests = await prisma.menteeprofile.findUnique({
          where: { id: newProfile.id },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
            interests: {
              include: {
                topic: true,
              },
            },
          },
        });

        // Transform interests to array of topics
        return {
          ...profileWithInterests,
          interests: profileWithInterests!.interests.map(i => i.topic),
        };
      }

      return {
        ...newProfile,
        interests: [],
      };
    }
  }

  async getMenteeProfile(userId: number) {
    const profile = await prisma.menteeprofile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        interests: {
          include: {
            topic: true,
          },
        },
      },
    });

    if (!profile) {
      throw new Error('Không tìm thấy hồ sơ mentee');
    }

    // Transform interests to array of topics
    return {
      ...profile,
      interests: profile.interests.map(i => i.topic),
    };
  }

  // Get profile by userId (auto-detect mentor or mentee)
  async getProfileByUserId(userId: number) {
    // First, get the user to check their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Based on role, get the appropriate profile
    if (user.role === 'MENTOR') {
      try {
        return await this.getMentorProfile(userId);
      } catch (error) {
        throw new Error('Không tìm thấy hồ sơ');
      }
    } else if (user.role === 'MENTEE') {
      try {
        return await this.getMenteeProfile(userId);
      } catch (error) {
        throw new Error('Không tìm thấy hồ sơ');
      }
    } else {
      throw new Error('Không tìm thấy hồ sơ');
    }
  }
}
