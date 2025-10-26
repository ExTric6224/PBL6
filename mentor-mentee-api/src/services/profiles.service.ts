import prisma from '../db/client';
import { CreateMentorProfileDto, UpdateMentorProfileDto, CreateMenteeProfileDto, UpdateMenteeProfileDto } from '../schemas/profiles.schema';

export class ProfilesService {
  async createOrUpdateMentorProfile(userId: number, data: CreateMentorProfileDto | UpdateMentorProfileDto) {
    const existingProfile = await prisma.mentorprofile.findUnique({
      where: { userId },
    });

    const profileData = {
      ...data,
      expertise: JSON.stringify(data.expertise || []),
    };

    if (existingProfile) {
      // Update existing profile
      return await prisma.mentorprofile.update({
        where: { userId },
        data: profileData,
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
    } else {
      // Create new profile - ensure required fields are present
      if (!data.fullName) {
        throw new Error('Full name is required for new mentor profile');
      }
      
      return await prisma.mentorprofile.create({
        data: {
          userId,
          fullName: data.fullName,
          school: data.school,
          expertise: JSON.stringify(data.expertise || []),
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
      },
    });

    if (!profile) {
      throw new Error('Mentor profile not found');
    }

    // Parse expertise from JSON
    return {
      ...profile,
      expertise: JSON.parse(profile.expertise as string),
    };
  }

  async createOrUpdateMenteeProfile(userId: number, data: CreateMenteeProfileDto | UpdateMenteeProfileDto) {
    const existingProfile = await prisma.menteeprofile.findUnique({
      where: { userId },
    });

    const profileData = {
      ...data,
      interests: JSON.stringify(data.interests || []),
    };

    if (existingProfile) {
      // Update existing profile
      return await prisma.menteeprofile.update({
        where: { userId },
        data: profileData,
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
    } else {
      // Create new profile - ensure required fields are present
      if (!data.fullName) {
        throw new Error('Full name is required for new mentee profile');
      }
      
      return await prisma.menteeprofile.create({
        data: {
          userId,
          fullName: data.fullName,
          goals: data.goals,
          interests: JSON.stringify(data.interests || []),
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
      },
    });

    if (!profile) {
      throw new Error('Mentee profile not found');
    }

    // Parse interests from JSON
    return {
      ...profile,
      interests: JSON.parse(profile.interests as string),
    };
  }
}
