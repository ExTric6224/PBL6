import prisma from '../db/client';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from '../schemas/posts.schema';

export class PostsService {
  async createPost(authorId: number, data: CreatePostDto) {
    return await (prisma as any).post.create({
      data: {
        authorId,
        title: data.title,
        content: data.content,
        isPublic: data.isPublic,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            mentorProfile: {
              select: {
                fullName: true,
                school: true,
              },
            },
            menteeProfile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });
  }

  async getPosts(query: PostQueryDto, currentUserId?: number) {
    const { page, limit, authorId, isPublic, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Chỉ hiển thị public posts, trừ khi user xem posts của chính mình
    if (currentUserId && authorId && authorId === currentUserId) {
      // User xem posts của chính mình - hiển thị tất cả
      where.authorId = authorId;
    } else {
      // Xem posts của người khác hoặc feed chung - chỉ hiển thị public
      where.isPublic = true;
      if (authorId) {
        where.authorId = authorId;
      }
    }

    // Search trong title và content
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      (prisma as any).post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              role: true,
              mentorProfile: {
                select: {
                  fullName: true,
                  school: true,
                },
              },
              menteeProfile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          likes: currentUserId ? {
            where: {
              userId: currentUserId,
            },
            select: {
              id: true,
              userId: true,
            },
          } : false,
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      (prisma as any).post.count({ where }),
    ]);

    return {
      posts: posts.map((post: any) => ({
        ...post,
        isLikedByCurrentUser: currentUserId ? post.likes.length > 0 : false,
        likesCount: post._count.likes,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPostById(postId: number, currentUserId?: number) {
    const post = await (prisma as any).post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            mentorProfile: {
              select: {
                fullName: true,
                school: true,
              },
            },
            menteeProfile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        likes: currentUserId ? {
          where: {
            userId: currentUserId,
          },
          select: {
            id: true,
            userId: true,
          },
        } : {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Kiểm tra quyền xem post
    if (!post.isPublic && currentUserId !== post.authorId) {
      throw new Error('Access denied');
    }

    return {
      ...post,
      isLikedByCurrentUser: currentUserId ? post.likes.some((like: any) => like.userId === currentUserId) : false,
      likesCount: post._count.likes,
    };
  }

  async updatePost(postId: number, authorId: number, data: UpdatePostDto) {
    // Kiểm tra quyền sở hữu
    const post = await (prisma as any).post.findFirst({
      where: {
        id: postId,
        authorId: authorId,
      },
    });

    if (!post) {
      throw new Error('Post not found or access denied');
    }

    return await (prisma as any).post.update({
      where: { id: postId },
      data,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            mentorProfile: {
              select: {
                fullName: true,
                school: true,
              },
            },
            menteeProfile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });
  }

  async deletePost(postId: number, authorId: number) {
    // Kiểm tra quyền sở hữu
    const post = await (prisma as any).post.findFirst({
      where: {
        id: postId,
        authorId: authorId,
      },
    });

    if (!post) {
      throw new Error('Post not found or access denied');
    }

    return await (prisma as any).post.delete({
      where: { id: postId },
    });
  }

  async toggleLike(postId: number, userId: number) {
    // Kiểm tra post có tồn tại và public không
    const post = await (prisma as any).post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (!post.isPublic && post.authorId !== userId) {
      throw new Error('Cannot like private post');
    }

    // Kiểm tra đã like chưa
    const existingLike = await (prisma as any).like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await (prisma as any).like.delete({
        where: { id: existingLike.id },
      });
      return { action: 'unliked' };
    } else {
      // Like
      await (prisma as any).like.create({
        data: {
          postId,
          userId,
        },
      });
      return { action: 'liked' };
    }
  }

  async getPostLikes(postId: number) {
    const post = await (prisma as any).post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const likes = await (prisma as any).like.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            mentorProfile: {
              select: {
                fullName: true,
              },
            },
            menteeProfile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      likesCount: likes.length,
      likes,
    };
  }
}
