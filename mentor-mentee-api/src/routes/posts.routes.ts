import { Router } from 'express';
import { PostsController } from '../controllers/posts.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermissions } from '../middleware/permission.middleware';
import { uploadPostImages } from '../middleware/upload.middleware';
import prisma from '../db/client';

const router = Router();
const postsController = new PostsController();

// Tất cả routes đều cần authentication
router.use(authenticate);

// GET /api/posts - Lấy danh sách posts (public hoặc của user)
router.get('/', authorizePermissions('post:view_any'), postsController.getPosts);

// GET /api/posts/:id - Lấy chi tiết một post
router.get('/:id', authorizePermissions('post:view_any'), postsController.getPostById);

// POST /api/posts - Tạo post mới
router.post('/', authorizePermissions('post:create'), postsController.createPost);

// PUT /api/posts/:id - Cập nhật post (chỉ author)
router.put('/:id', 
  authorizePermissions('post:update', {
    scope: 'own',
    getResourceOwnerId: async (req) => {
      const post = await prisma.post.findUnique({ 
        where: { id: Number(req.params.id) } 
      });
      return post?.authorId ?? null;
    }
  }), 
  postsController.updatePost
);

// DELETE /api/posts/:id - Xóa post (chỉ author)
router.delete('/:id', 
  authorizePermissions('post:delete', {
    scope: 'own',
    getResourceOwnerId: async (req) => {
      const post = await prisma.post.findUnique({ 
        where: { id: Number(req.params.id) } 
      });
      return post?.authorId ?? null;
    }
  }), 
  postsController.deletePost
);

// POST /api/posts/:id/images - Upload images to post
router.post('/:id/images',
  authorizePermissions('post:update', {
    scope: 'own',
    getResourceOwnerId: async (req) => {
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
    getResourceOwnerId: async (req) => {
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

// GET /api/posts/:id/likes - Lấy danh sách likes của post
router.get('/:id/likes', authorizePermissions('post:view_any'), postsController.getPostLikes);

export default router;
