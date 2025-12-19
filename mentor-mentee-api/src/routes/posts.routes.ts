import { Router, Request } from 'express';
import { PostsController } from '../controllers/posts.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';
import { uploadPostImages } from '../middleware/upload.middleware';

import prisma from '../db/client';

const router = Router();
const postsController = new PostsController();

// Tất cả routes đều cần authentication
router.use(authenticate);

// GET /api/posts - Lấy danh sách posts
router.get('/', authorizePermissions('post:view_any', 'post:view_own'), postsController.getPosts);

// GET /api/posts/:id - Lấy chi tiết một post
router.get('/:id', authorizePermissions('post:view_any', 'post:view_own'), postsController.getPostById);

// POST /api/posts - Tạo post mới
router.post('/', authorizePermissions('post:create'), postsController.createPost);

// PUT /api/posts/:id - Cập nhật post (chỉ author)
router.put('/:id', 
  authorizePermissions('post:update', {
    scope: 'own',
    getResourceOwnerId: async (req: Request) => {
      const post = await prisma.post.findUnique({ 
        where: { id: Number(req.params.id) } 
      });
      return post?.authorId ?? null;
    }
  }), 
  postsController.updatePost
);

// DELETE /api/posts/:id - Xóa post (author có thể xóa post của mình, admin có thể xóa bất kỳ post nào)
router.delete('/:id', 
  async (req, res, next) => {
    // Check if user has delete_any permission (admin)
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Import checkPermission dynamically to avoid circular dependency
    const { checkPermission } = await import('../middleware/permission.middleware');
    const hasDeleteAny = await checkPermission(user.sub, 'post:delete_any');

    if (hasDeleteAny) {
      // Admin can delete any post
      return next();
    }

    // Regular users need post:delete_own and ownership check
    return authorizePermissions('post:delete', {
      scope: 'own',
      getResourceOwnerId: async (req: Request) => {
        const post = await prisma.post.findUnique({ 
          where: { id: Number(req.params.id) } 
        });
        return post?.authorId ?? null;
      }
    })(req, res, next);
  },
  postsController.deletePost
);

// POST /api/posts/:id/images - Upload images to post
router.post('/:id/images',
  authorizePermissions('post:update', {
    scope: 'own',
    getResourceOwnerId: async (req: Request) => {
      const post = await prisma.post.findUnique({ 
        where: { id: Number(req.params.id) } 
      });
      return post?.authorId ?? null;
    }
  }),
  uploadPostImages.array('images', 10),
  postsController.uploadPostImages
);

// DELETE /api/posts/:id/images/:imageId - Delete a specific image from post
router.delete('/:id/images/:imageId',
  authorizePermissions('post:update', {
    scope: 'own',
    getResourceOwnerId: async (req: Request) => {
      const post = await prisma.post.findUnique({ 
        where: { id: Number(req.params.id) } 
      });
      return post?.authorId ?? null;
    }
  }),
  postsController.deletePostImage
);

// POST /api/posts/:id/like - Like/Unlike post
router.post('/:id/like', authorizePermissions('post:like'), postsController.toggleLike);

// GET /api/posts/:id/likes - Lấy danh sách likes của post (no permission needed)
router.get('/:id/likes', postsController.getPostLikes);

export default router;
