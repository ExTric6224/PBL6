import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmDialog from '../Toast/ConfirmDialog';
import Toast, { ToastType } from '../Toast/Toast';
import './AdminPostManagement.css';

interface User {
  id: number;
  email: string;
  role: string;
  mentorprofile?: {
    fullName: string;
    avatar?: string;
  };
  menteeprofile?: {
    fullName: string;
    avatar?: string;
  };
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  likesCount: number;
  images?: Array<{
    id: number;
    imageUrl: string;
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminPostManagement: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    isPublic: true,
  });
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchPosts();
  }, [pagination.page, searchTerm]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await axios.get(`${API_URL}/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      if (response.data.success) {
        setPosts(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.error || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (postId: number) => {
    setPostToDelete(postId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/posts/${postToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setToast({
        show: true,
        message: 'Post deleted successfully',
        type: 'success',
      });
      fetchPosts(); // Refresh list
      setShowDetailModal(false); // Close detail modal if open
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setToast({
        show: true,
        message: err.response?.data?.error || 'Failed to delete post',
        type: 'error',
      });
    } finally {
      setShowConfirmDialog(false);
      setPostToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setPostToDelete(null);
  };

  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedPost(null);
  };

  const handleEditPost = (post: Post) => {
    setPostToEdit(post);
    setEditFormData({
      title: post.title,
      content: post.content,
      isPublic: post.isPublic,
    });
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setPostToEdit(null);
    setEditFormData({
      title: '',
      content: '',
      isPublic: true,
    });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postToEdit) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `${API_URL}/posts/${postToEdit.id}`,
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setToast({
        show: true,
        message: 'Post updated successfully',
        type: 'success',
      });
      fetchPosts();
      handleCloseEditModal();
    } catch (err: any) {
      console.error('Error updating post:', err);
      setToast({
        show: true,
        message: err.response?.data?.error || 'Failed to update post',
        type: 'error',
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchPosts();
  };

  const getUserFullName = (user: User) => {
    if (user.mentorprofile?.fullName) {
      return user.mentorprofile.fullName;
    }
    if (user.menteeprofile?.fullName) {
      return user.menteeprofile.fullName;
    }
    return user.email;
  };

  const parseMarkdown = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading && posts.length === 0) {
    return <div className="admin-loading">Loading posts...</div>;
  }

  return (
    <div className="admin-post-management">
      <div className="admin-header">
        <h1>Post Management</h1>
        <p>Manage all posts in the system</p>
      </div>

      <div className="admin-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search posts by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPagination({ ...pagination, page: 1 });
              }}
              className="clear-button"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="posts-table-container">
        <table className="posts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Role</th>
              <th>Likes</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  No posts found
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.id}</td>
                  <td className="post-title">{post.title}</td>
                  <td>{getUserFullName(post.user)}</td>
                  <td>
                    <span className={`role-badge role-${post.user.role.toLowerCase()}`}>
                      {post.user.role}
                    </span>
                  </td>
                  <td>{post.likesCount}</td>
                  <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleViewPost(post)}
                      className="action-button view-button"
                      title="View Details"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditPost(post)}
                      className="action-button edit-button"
                      title="Edit Post"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="action-button delete-button"
                      title="Delete Post"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total} posts)
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {showDetailModal && selectedPost && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Post Details</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>{selectedPost.title}</h3>
                <div className="post-meta">
                  <span>
                    <strong>Author:</strong> {getUserFullName(selectedPost.user)} ({selectedPost.user.email})
                  </span>
                  <span>
                    <strong>Role:</strong>{' '}
                    <span className={`role-badge role-${selectedPost.user.role.toLowerCase()}`}>
                      {selectedPost.user.role}
                    </span>
                  </span>
                  <span>
                    <strong>Likes:</strong> {selectedPost.likesCount}
                  </span>
                  <span>
                    <strong>Created:</strong> {new Date(selectedPost.createdAt).toLocaleString()}
                  </span>
                  <span>
                    <strong>Updated:</strong> {new Date(selectedPost.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="detail-section">
                <h4>Content:</h4>
                <div className="post-content">{parseMarkdown(selectedPost.content)}</div>
              </div>
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="detail-section">
                  <h4>Images:</h4>
                  <div className="post-images">
                    {selectedPost.images.map((image) => (
                      <img
                        key={image.id}
                        src={`http://localhost:3000${image.imageUrl}`}
                        alt="Post"
                        className="post-image"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseModal} className="button button-secondary">
                Close
              </button>
              <button
                onClick={() => handleEditPost(selectedPost)}
                className="button button-primary"
              >
                Edit Post
              </button>
              <button
                onClick={() => handleDeletePost(selectedPost.id)}
                className="button button-danger"
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && postToEdit && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Post</h2>
              <button onClick={handleCloseEditModal} className="close-button">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="edit-title">Title *</label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Enter post title"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-content">Content *</label>
                  <textarea
                    id="edit-content"
                    value={editFormData.content}
                    onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                    required
                    rows={10}
                    className="form-textarea"
                    placeholder="Enter post content"
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editFormData.isPublic}
                      onChange={(e) => setEditFormData({ ...editFormData, isPublic: e.target.checked })}
                    />
                    <span>Public Post</span>
                  </label>
                </div>
                <div className="post-meta-info">
                  <p><strong>Author:</strong> {getUserFullName(postToEdit.user)}</p>
                  <p><strong>Created:</strong> {new Date(postToEdit.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={handleCloseEditModal} className="button button-secondary">
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default AdminPostManagement;
