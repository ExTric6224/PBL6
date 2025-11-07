import React, { useState, useEffect, useCallback } from 'react';
import { postApi } from '../../services/postApi';
import { Post } from '../../types/post';
import { useAuth } from '../../context/AuthContext';
import './PostList.css';

const PostList: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState<number | null>(null);

  // Remove '/api' from URL for static files
  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000/api').replace('/api', '');

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await postApi.getAllPosts(page, 10);
      setPosts(response.data);
      setTotalPages(response.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.title.trim().length < 3) {
      alert('Title must be at least 3 characters long');
      return;
    }
    
    if (formData.content.trim().length < 10) {
      alert('Content must be at least 10 characters long');
      return;
    }
    
    try {
      await postApi.createPost(formData);
      setFormData({ title: '', content: '' });
      setShowCreateForm(false);
      loadPosts();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create post');
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      await postApi.updatePost(editingPost.id, formData);
      setFormData({ title: '', content: '' });
      setEditingPost(null);
      loadPosts();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update post');
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postApi.deletePost(id);
      loadPosts();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete post');
    }
  };

  const handleToggleLike = async (id: number) => {
    try {
      await postApi.toggleLike(id);
      loadPosts();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to toggle like');
    }
  };

  const startEditing = (post: Post) => {
    setEditingPost(post);
    setFormData({ title: post.title, content: post.content });
    setShowCreateForm(false);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setFormData({ title: '', content: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Validate file types
      const validFiles = files.filter(file => 
        ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
      );
      
      if (validFiles.length !== files.length) {
        alert('Some files were not added. Only JPEG, PNG, GIF, and WebP images are allowed.');
      }
      
      // Limit to 10 images
      if (validFiles.length > 10) {
        alert('Maximum 10 images allowed');
        setSelectedFiles(validFiles.slice(0, 10));
      } else {
        setSelectedFiles(validFiles);
      }
    }
  };

  const handleUploadImages = async (postId: number) => {
    if (selectedFiles.length === 0) return;

    try {
      setUploadingImages(postId);
      await postApi.uploadPostImages(postId, selectedFiles);
      setSelectedFiles([]);
      loadPosts();
      alert('Images uploaded successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload images');
    } finally {
      setUploadingImages(null);
    }
  };

  const handleDeleteImage = async (postId: number, imageId: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await postApi.deletePostImage(postId, imageId);
      loadPosts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete image');
    }
  };

  if (loading && posts.length === 0) {
    return <div className="loading">Loading posts...</div>;
  }

  return (
    <div className="posts-container">
      <div className="posts-header">
        <h1>📝 Community Posts</h1>
        {(user?.role === 'MENTOR' || user?.role === 'ADMIN') && !editingPost && (
          <button
            className="create-post-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '✖ Cancel' : '✚ Create Post'}
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {/* Create Form */}
      {showCreateForm && (
        <form className="create-post-form" onSubmit={handleCreatePost}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Enter post title..."
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              placeholder="Write your post content..."
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Post
            </button>
          </div>
        </form>
      )}

      {/* Edit Form */}
      {editingPost && (
        <form className="create-post-form" onSubmit={handleUpdatePost}>
          <h2>Edit Post</h2>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={cancelEditing}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Post
            </button>
          </div>
        </form>
      )}

      {/* Posts List */}
      {posts.length === 0 && !loading ? (
        <div className="empty-state">No posts yet. Be the first to create one!</div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div>
                  <h2 className="post-title">{post.title}</h2>
                  <div className="post-meta">
                    <span className="author-badge">{post.author?.email || 'Unknown'}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Post Images Gallery */}
              {post.images && post.images.length > 0 && (
                <div className="post-images-gallery">
                  {post.images.map((image) => {
                    const imageUrl = `${API_BASE_URL}${image.imageUrl}`;
                    console.log('Loading image:', imageUrl); // Debug log
                    return (
                      <div key={image.id} className="post-image-wrapper">
                        <img 
                          src={imageUrl}
                          alt={`Post image ${image.order + 1}`}
                          className="post-image"
                          onError={(e) => {
                            console.error('Failed to load image:', imageUrl);
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Image not found</text></svg>';
                          }}
                        />
                        {post.authorId === user?.id && (
                          <button
                            className="delete-image-btn"
                            onClick={() => handleDeleteImage(post.id, image.id)}
                            title="Delete image"
                          >
                            ✖
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="post-content">{post.content}</p>

              {/* Image Upload Section for Post Owner */}
              {post.authorId === user?.id && (
                <div className="image-upload-section">
                  <input
                    type="file"
                    id={`file-input-${post.id}`}
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor={`file-input-${post.id}`} className="upload-images-btn">
                    📷 Add Images ({selectedFiles.length}/10)
                  </label>
                  {selectedFiles.length > 0 && (
                    <button
                      className="btn-upload"
                      onClick={() => handleUploadImages(post.id)}
                      disabled={uploadingImages === post.id}
                    >
                      {uploadingImages === post.id ? 'Uploading...' : `Upload ${selectedFiles.length} image(s)`}
                    </button>
                  )}
                </div>
              )}

              <div className="post-actions">
                <button
                  className={`like-btn ${post.isLikedByCurrentUser ? 'liked' : ''}`}
                  onClick={() => handleToggleLike(post.id)}
                >
                  {post.isLikedByCurrentUser ? '❤️' : '🤍'} {post._count?.likes || 0}
                </button>
                {post.authorId === user?.id && (
                  <>
                    <button className="edit-btn" onClick={() => startEditing(post)}>
                      ✏️ Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDeletePost(post.id)}>
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            ← Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default PostList;
