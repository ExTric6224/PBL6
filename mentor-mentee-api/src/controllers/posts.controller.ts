import { Request, Response } from 'express';
import { PostsService } from '../services/posts.service';
import { createPostSchema, updatePostSchema, postQuerySchema } from '../schemas/posts.schema';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const postsService = new PostsService();

export class PostsController {
  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = createPostSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.errors,
        });
      }

      const post = await postsService.createPost(userId, result.data);

      res.status(201).json({
        success: true,
        data: post,
        message: 'Post created successfully',
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create post',
      });
    }
  }

  async getPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.sub;
      
      const result = postQuerySchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: result.error.errors,
        });
      }

      const response = await postsService.getPosts(result.data, userId);

      res.json({
        success: true,
        data: response.posts,
        pagination: response.pagination,
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch posts',
      });
    }
  }

  async getPostById(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.sub;

      if (isNaN(postId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid post ID',
        });
      }

      const post = await postsService.getPostById(postId, userId);

      res.json({
        success: true,
        data: post,
      });
    } catch (error: any) {
      console.error('Error fetching post:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
        });
      }
      
      if (error.message === 'Access denied') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch post',
      });
    }
  }

  async updatePost(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (isNaN(postId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid post ID',
        });
      }

      const result = updatePostSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.errors,
        });
      }

      const post = await postsService.updatePost(postId, userId, result.data);

      res.json({
        success: true,
        data: post,
        message: 'Post updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating post:', error);
      
      if (error.message === 'Post not found or access denied') {
        return res.status(404).json({
          success: false,
          error: 'Post not found or access denied',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update post',
      });
    }
  }

  async deletePost(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (isNaN(postId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid post ID',
        });
      }

      await postsService.deletePost(postId, userId);

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      
      if (error.message === 'Post not found or access denied') {
        return res.status(404).json({
          success: false,
          error: 'Post not found or access denied',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete post',
      });
    }
  }

  async toggleLike(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (isNaN(postId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid post ID',
        });
      }

      const result = await postsService.toggleLike(postId, userId);

      res.json({
        success: true,
        data: result,
        message: `Post ${result.action} successfully`,
      });
    } catch (error: any) {
      console.error('Error toggling like:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
        });
      }
      
      if (error.message === 'Cannot like private post') {
        return res.status(403).json({
          success: false,
          error: 'Cannot like private post',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to toggle like',
      });
    }
  }

  async getPostLikes(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = parseInt(req.params.id);

      if (isNaN(postId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid post ID',
        });
      }

      const likes = await postsService.getPostLikes(postId);

      res.json({
        success: true,
        data: likes,
      });
    } catch (error: any) {
      console.error('Error fetching post likes:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch post likes',
      });
    }
  }

  async uploadPostImages(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (isNaN(postId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid post ID',
        });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No images provided',
        });
      }

      const images = await postsService.uploadPostImages(postId, userId, req.files);

      res.json({
        success: true,
        data: images,
        message: 'Images uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading post images:', error);
      
      if (error.message === 'Post not found or access denied') {
        return res.status(404).json({
          success: false,
          error: 'Post not found or access denied',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to upload images',
      });
    }
  }

  async deletePostImage(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = parseInt(req.params.id);
      const imageId = parseInt(req.params.imageId);
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (isNaN(postId) || isNaN(imageId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid post ID or image ID',
        });
      }

      await postsService.deletePostImage(postId, imageId, userId);

      res.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting post image:', error);
      
      if (error.message === 'Post not found or access denied') {
        return res.status(404).json({
          success: false,
          error: 'Post not found or access denied',
        });
      }

      if (error.message === 'Image not found') {
        return res.status(404).json({
          success: false,
          error: 'Image not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete image',
      });
    }
  }
}

