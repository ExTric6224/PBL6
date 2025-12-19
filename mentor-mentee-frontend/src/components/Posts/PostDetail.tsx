import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postApi } from '../../services/postApi';
import { Post } from '../../types/post';
import { useAuth } from '../../context/AuthContext';
import './PostDetail.css';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000/api').replace('/api', '');

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await postApi.getPostById(parseInt(id));
      setPost(response);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!post) return;

    try {
      await postApi.toggleLike(post.id);
      loadPost();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể thích bài viết');
    }
  };

  const handleDeletePost = async () => {
    if (!post || !window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

    try {
      await postApi.deletePost(post.id);
      setSuccess('Xóa bài viết thành công!');
      setTimeout(() => navigate('/posts'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể xóa bài viết');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!post || !window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;

    try {
      await postApi.deletePostImage(post.id, imageId);
      setSuccess('Xóa ảnh thành công! 🖼️');
      loadPost();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể xóa ảnh');
    }
  };

  const formatDate = (date: string) => {
    const postDate = new Date(date);
    return postDate.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseMarkdown = (text: string) => {
    // Parse **bold** text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="post-detail-container">
        <div className="loading-message">
          Loading...
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="post-detail-container">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h2>Có lỗi xảy ra</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/posts')}>
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-container">
        <div className="error-state">
          <span className="error-icon">📭</span>
          <h2>Không tìm thấy bài viết</h2>
          <button className="btn btn-primary" onClick={() => navigate('/posts')}>
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      {/* Back Button */}
      <div className="back-button-wrapper">
        <button className="back-btn" onClick={() => navigate('/posts')}>
          ← Quay lại
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="notification error-notification">
          <span className="icon">⚠️</span>
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError(null)}>✖</button>
        </div>
      )}
      {success && (
        <div className="notification success-notification">
          <span className="icon">✓</span>
          <span>{success}</span>
          <button className="close-btn" onClick={() => setSuccess(null)}>✖</button>
        </div>
      )}

      {/* Post Detail */}
      <article className="post-detail-card">
        {/* Post Header */}
        <div className="post-detail-header">
          <div className="author-info">
            <div 
              className="avatar-large clickable"
              onClick={() => navigate(`/profile/${post.authorId}`)}
              style={{ cursor: 'pointer' }}
              title="Xem profile"
            >
              {(post.user?.mentorprofile?.avatar || post.user?.menteeprofile?.avatar) ? (
                <img 
                  src={`${API_BASE_URL}${post.user?.mentorprofile?.avatar || post.user?.menteeprofile?.avatar}`}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.textContent = post.user?.email?.charAt(0).toUpperCase() || 'U';
                  }}
                />
              ) : (
                post.user?.email?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="author-details">
              <h3 
                className="author-name clickable"
                onClick={() => navigate(`/profile/${post.authorId}`)}
                style={{ cursor: 'pointer' }}
                title="Xem profile"
              >
                {post.user?.mentorprofile?.fullName || 
                 post.user?.menteeprofile?.fullName || 
                 post.user?.email || 
                 'Unknown'}
              </h3>
              <div className="post-meta">
                <span className="role-badge">{post.user?.role || 'USER'}</span>
                <span className="separator">•</span>
                <time className="post-time">{formatDate(post.createdAt)}</time>
              </div>
            </div>
          </div>
          
          {post.authorId === user?.id && (
            <div className="post-actions-menu">
              <button
                className="action-btn edit-btn"
                onClick={() => navigate(`/posts/${post.id}/edit`)}
                title="Chỉnh sửa"
              >
                ✏️ Chỉnh sửa
              </button>
              <button
                className="action-btn delete-btn"
                onClick={handleDeletePost}
                title="Xóa"
              >
                🗑️ Xóa
              </button>
            </div>
          )}
        </div>

        {/* Post Title */}
        <h1 className="post-detail-title">{post.title}</h1>

        {/* Post Content */}
        <div className="post-detail-content">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index}>{parseMarkdown(paragraph)}</p>
          ))}
        </div>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className="post-detail-images">
            <div className={`images-grid ${post.images.length === 1 ? 'single' : post.images.length === 2 ? 'double' : 'multi'}`}>
              {post.images.map((image) => {
                const imageUrl = `${API_BASE_URL}${image.imageUrl}`;
                return (
                  <div key={image.id} className="image-container">
                    <img
                      src={imageUrl}
                      alt={`Ảnh ${image.order + 1}`}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="16">Không tải được ảnh</text></svg>';
                      }}
                    />
                    {post.authorId === user?.id && (
                      <button
                        className="delete-image-btn"
                        onClick={() => handleDeleteImage(image.id)}
                        title="Xóa ảnh"
                      >
                        ✖
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Post Stats */}
        <div className="post-detail-stats">
          <div className="stat-item">
            <span className="stat-icon">❤️</span>
            <span className="stat-count">{post.likesCount || post._count?.likes || 0}</span>
            <span className="stat-label">Lượt thích</span>
          </div>
        </div>

        {/* Like Button */}
        <div className="post-detail-actions">
          <button
            className={`like-btn-large ${post.isLikedByCurrentUser ? 'liked' : ''}`}
            onClick={handleToggleLike}
          >
            <span className="icon">{post.isLikedByCurrentUser ? '❤️' : '🤍'}</span>
            <span className="text">{post.isLikedByCurrentUser ? 'Đã thích' : 'Thích'}</span>
          </button>
        </div>
      </article>
    </div>
  );
};

export default PostDetail;
