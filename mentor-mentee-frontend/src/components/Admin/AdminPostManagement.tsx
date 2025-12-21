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
        message: 'Xóa bài viết thành công',
        type: 'success',
      });
      fetchPosts(); // Refresh list
      setShowDetailModal(false); // Close detail modal if open
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setToast({
        show: true,
        message: err.response?.data?.error || 'Xóa bài viết thất bại',
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
        message: 'Cập nhật bài viết thành công',
        type: 'success',
      });
      fetchPosts();
      handleCloseEditModal();
    } catch (err: any) {
      console.error('Error updating post:', err);
      setToast({
        show: true,
        message: err.response?.data?.error || 'Cập nhật bài viết thất bại',
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
    return <div className="admin-loading">Đang tải bài viết...</div>;
  }

  return (
    <div className="admin-post-management">
      <div className="admin-header">
        <h1>Quản lý bài viết</h1>
        <p>Quản lý tất cả bài viết trong hệ thống</p>
      </div>

      <div className="admin-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm bài viết theo tiêu đề hoặc nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Tìm kiếm
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
              Xóa
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
              <th>Tiêu đề</th>
              <th>Tác giả</th>
              <th>Vai trò</th>
              <th>Lượt thích</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  Không tìm thấy bài viết
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
                      title="Xem chi tiết"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => handleEditPost(post)}
                      className="action-button edit-button"
                      title="Sửa bài viết"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="action-button delete-button"
                      title="Xóa bài viết"
                    >
                      Xóa
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
            Trước
          </button>
          <span className="pagination-info">
            Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.total} bài viết)
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            Sau
          </button>
        </div>
      )}

      {showDetailModal && selectedPost && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết bài viết</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>{selectedPost.title}</h3>
                <div className="post-meta">
                  <span>
                    <strong>Tác giả:</strong> {getUserFullName(selectedPost.user)} ({selectedPost.user.email})
                  </span>
                  <span>
                    <strong>Vai trò:</strong>{' '}
                    <span className={`role-badge role-${selectedPost.user.role.toLowerCase()}`}>
                      {selectedPost.user.role}
                    </span>
                  </span>
                  <span>
                    <strong>Lượt thích:</strong> {selectedPost.likesCount}
                  </span>
                  <span>
                    <strong>Ngày tạo:</strong> {new Date(selectedPost.createdAt).toLocaleString()}
                  </span>
                  <span>
                    <strong>Cập nhật:</strong> {new Date(selectedPost.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="detail-section">
                <h4>Nội dung:</h4>
                <div className="post-content">{parseMarkdown(selectedPost.content)}</div>
              </div>
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="detail-section">
                  <h4>Hình ảnh:</h4>
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
                Đóng
              </button>
              <button
                onClick={() => handleEditPost(selectedPost)}
                className="button button-primary"
              >
                Sửa bài viết
              </button>
              <button
                onClick={() => handleDeletePost(selectedPost.id)}
                className="button button-danger"
              >
                Xóa bài viết
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
              <h2>Sửa bài viết</h2>
              <button onClick={handleCloseEditModal} className="close-button">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="edit-title">Tiêu đề *</label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Nhập tiêu đề bài viết"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-content">Nội dung *</label>
                  <textarea
                    id="edit-content"
                    value={editFormData.content}
                    onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                    required
                    rows={10}
                    className="form-textarea"
                    placeholder="Nhập nội dung bài viết"
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editFormData.isPublic}
                      onChange={(e) => setEditFormData({ ...editFormData, isPublic: e.target.checked })}
                    />
                    <span>Bài viết công khai</span>
                  </label>
                </div>
                <div className="post-meta-info">
                  <p><strong>Tác giả:</strong> {getUserFullName(postToEdit.user)}</p>
                  <p><strong>Ngày tạo:</strong> {new Date(postToEdit.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={handleCloseEditModal} className="button button-secondary">
                  Hủy
                </button>
                <button type="submit" className="button button-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
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
