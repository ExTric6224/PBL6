import api from './api';
import { Post, CreatePostData, UpdatePostData, PostLike, PostImage } from '../types/post';
import { ApiResponse, PaginatedResponse } from '../types/common';

export const postApi = {
  // Get all posts
  getAllPosts: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<PaginatedResponse<Post>>(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get post by ID
  getPostById: async (id: number): Promise<Post> => {
    const response = await api.get<ApiResponse<Post>>(`/posts/${id}`);
    return response.data.data;
  },

  // Create post
  createPost: async (data: CreatePostData): Promise<Post> => {
    const response = await api.post<ApiResponse<Post>>('/posts', data);
    return response.data.data;
  },

  // Update post
  updatePost: async (id: number, data: UpdatePostData): Promise<Post> => {
    const response = await api.put<ApiResponse<Post>>(`/posts/${id}`, data);
    return response.data.data;
  },

  // Delete post
  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  // Toggle like
  toggleLike: async (id: number): Promise<{ liked: boolean }> => {
    const response = await api.post<ApiResponse<{ liked: boolean }>>(`/posts/${id}/like`);
    return response.data.data;
  },

  // Get post likes
  getPostLikes: async (id: number): Promise<PostLike[]> => {
    const response = await api.get<ApiResponse<PostLike[]>>(`/posts/${id}/likes`);
    return response.data.data;
  },

  // Upload images to post
  uploadPostImages: async (postId: number, files: File[]): Promise<PostImage[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await api.post<ApiResponse<PostImage[]>>(
      `/posts/${postId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Delete post image
  deletePostImage: async (postId: number, imageId: number): Promise<void> => {
    await api.delete(`/posts/${postId}/images/${imageId}`);
  },
};
