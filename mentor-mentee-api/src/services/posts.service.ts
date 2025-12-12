import prisma from '../db/client';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from '../schemas/posts.schema';
import { deletePostImageFile } from '../middleware/upload.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import path from 'path';

export class PostsService {
  async createPost(authorId: number, data: CreatePostDto) {
    return await prisma.post.create({
      data: {
        authorId,
        title: data.title,
        content: data.content,
        isPublic: data.isPublic,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            mentorprofile: {
              select: {
                fullName: true,
                avatar: true,
                school: true,
              },
            },
            menteeprofile: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        like: {
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
            like: true,
          },
        },
      },
    });
  }

  async getPosts(query: PostQueryDto, currentUserId?: number) {
    const { page, limit, authorId, isPublic, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Check user's permissions to filter posts
    if (currentUserId) {
      const hasViewOwn = await checkPermission(currentUserId, 'post:view_own');
      const hasViewAny = await checkPermission(currentUserId, 'post:view_any');

      // Filter based on permissions
      if (hasViewOwn && !hasViewAny) {
        // Only own posts
        where.authorId = currentUserId;
      } else if (!hasViewOwn && hasViewAny) {
        // Only other users' posts
        where.authorId = { not: currentUserId };
      } else if (!hasViewOwn && !hasViewAny) {
        // No permission to view any posts
        where.id = -1; // No results
      }
      // If both hasViewOwn and hasViewAny, no filter (can view all)
    }

    // Additional filter by authorId from query
    if (authorId) {
      if (where.authorId && typeof where.authorId === 'object') {
        // Merge with existing authorId filter
        where.AND = [{ authorId: where.authorId }, { authorId }];
        delete where.authorId;
      } else {
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
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              mentorprofile: {
                select: {
                  fullName: true,
                  avatar: true,
                  school: true,
                },
              },
              menteeprofile: {
                select: {
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
          images: {
            orderBy: {
              order: 'asc',
            },
          },
          like: currentUserId ? {
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
              like: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((post: any) => ({
        ...post,
        isLikedByCurrentUser: currentUserId ? post.like.length > 0 : false,
        likesCount: post._count.like,
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
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            mentorprofile: {
              select: {
                fullName: true,
                avatar: true,
                school: true,
              },
            },
            menteeprofile: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        like: currentUserId ? {
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
            like: true,
          },
        },
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Check permission to view this specific post
    if (currentUserId) {
      const isOwnPost = post.authorId === currentUserId;
      const hasViewOwn = await checkPermission(currentUserId, 'post:view_own');
      const hasViewAny = await checkPermission(currentUserId, 'post:view_any');

      // Check if user has permission to view this post
      const canView = 
        (isOwnPost && hasViewOwn) ||  // Own post and has view_own
        (!isOwnPost && hasViewAny);   // Others' post and has view_any

      if (!canView) {
        throw new Error('You do not have permission to view this post');
      }
    }

    return {
      ...post,
      isLikedByCurrentUser: currentUserId ? post.like.some((like: any) => like.userId === currentUserId) : false,
      likesCount: post._count.like,
    };
  }

  async updatePost(postId: number, authorId: number, data: UpdatePostDto) {
    // Kiểm tra quyền sở hữu
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        authorId: authorId,
      },
    });

    if (!post) {
      throw new Error('Post not found or access denied');
    }

    return await prisma.post.update({
      where: { id: postId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            mentorprofile: {
              select: {
                fullName: true,
                school: true,
              },
            },
            menteeprofile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            like: true,
          },
        },
      },
    });
  }

  async deletePost(postId: number, userId: number) {
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user has permission to delete this post
    const hasDeleteAny = await checkPermission(userId, 'post:delete_any');
    const isAuthor = post.authorId === userId;

    if (!hasDeleteAny && !isAuthor) {
      throw new Error('Post not found or access denied');
    }

    return await prisma.post.delete({
      where: { id: postId },
    });
  }

  async toggleLike(postId: number, userId: number) {
    // Kiểm tra post có tồn tại không
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Tất cả authenticated users có thể like bất kỳ post nào

    // Kiểm tra đã like chưa
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return { action: 'unliked' };
    } else {
      // Like
      await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      return { action: 'liked' };
    }
  }

  async getPostLikes(postId: number) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const likes = await prisma.like.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            mentorprofile: {
              select: {
                fullName: true,
              },
            },
            menteeprofile: {
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

  async uploadPostImages(postId: number, userId: number, files: Express.Multer.File[]) {
    // Verify post exists and user is the author
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.authorId !== userId) {
      // Delete uploaded files if not authorized
      files.forEach(file => {
        deletePostImageFile(path.join('storage', 'posts', file.filename));
      });
      throw new Error('Post not found or access denied');
    }

    // Get current max order for this post
    const maxOrderImage = await prisma.postimage.findFirst({
      where: { postId },
      orderBy: { order: 'desc' },
    });

    const startOrder = maxOrderImage ? maxOrderImage.order + 1 : 0;

    // Create image records
    const imagePromises = files.map((file, index) => {
      const imageUrl = `/storage/posts/${file.filename}`;
      return prisma.postimage.create({
        data: {
          postId,
          imageUrl,
          order: startOrder + index,
        },
      });
    });

    const images = await Promise.all(imagePromises);

    return images;
  }

  async deletePostImage(postId: number, imageId: number, userId: number) {
    // Verify post exists and user is the author
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.authorId !== userId) {
      throw new Error('Post not found or access denied');
    }

    // Get image
    const image = await prisma.postimage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.postId !== postId) {
      throw new Error('Image not found');
    }

    // Delete image file
    deletePostImageFile(image.imageUrl);

    // Delete image record
    await prisma.postimage.delete({
      where: { id: imageId },
    });
  }
}

