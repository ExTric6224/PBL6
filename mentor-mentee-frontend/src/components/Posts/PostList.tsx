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
              <p className="post-content">{post.content}</p>
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
