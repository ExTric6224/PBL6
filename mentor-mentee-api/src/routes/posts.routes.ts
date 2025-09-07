import { Router } from 'express';
import { PostsController } from '../controllers/posts.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const postsController = new PostsController();

// Tất cả routes đều cần authentication
router.use(authenticate);

// GET /api/posts - Lấy danh sách posts (public hoặc của user)
router.get('/', postsController.getPosts);

// GET /api/posts/:id - Lấy chi tiết một post
router.get('/:id', postsController.getPostById);

// POST /api/posts - Tạo post mới
router.post('/', postsController.createPost);

// PUT /api/posts/:id - Cập nhật post (chỉ author)
router.put('/:id', postsController.updatePost);

// DELETE /api/posts/:id - Xóa post (chỉ author)
router.delete('/:id', postsController.deletePost);

// POST /api/posts/:id/like - Like/Unlike post
router.post('/:id/like', postsController.toggleLike);

// GET /api/posts/:id/likes - Lấy danh sách likes của post
router.get('/:id/likes', postsController.getPostLikes);

export default router;
