import React, { useState, useEffect, useCallback, useRef } from 'react';
import { postApi } from '../../services/postApi';
import { Post } from '../../types/post';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './PostList.css';

interface PostFormData {
  title: string;
  content: string;
}

interface ImageUploadState {
  [postId: number]: {
    files: File[];
    uploading: boolean;
  };
}

const PostList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState<PostFormData>({ title: '', content: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [imageUploadState, setImageUploadState] = useState<ImageUploadState>({});
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000/api').replace('/api', '');

  // Auto clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await postApi.getAllPosts(page, 10);
      setPosts(response.data);
      setTotalPages(response.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  // Reset page when switching tabs or search
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, sortBy]);

  // Parse markdown for bold text
  const parseMarkdown = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Filter and sort posts
  const getFilteredAndSortedPosts = () => {
    let filtered = activeTab === 'my' 
      ? posts.filter(post => post.authorId === user?.id)
      : posts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.content.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'popular':
          return (b.likesCount || 0) - (a.likesCount || 0);
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredPosts = getFilteredAndSortedPosts();

  const handleTabChange = (tab: 'all' | 'my') => {
    setActiveTab(tab);
    setShowCreateForm(false);
    setEditingPost(null);
  };

  const validateForm = (): boolean => {
    if (formData.title.trim().length < 3) {
      setError('Tiêu đề phải có ít nhất 3 ký tự');
      return false;
    }
    if (formData.content.trim().length < 10) {
      setError('Nội dung phải có ít nhất 10 ký tự');
      return false;
    }
    return true;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await postApi.createPost(formData);
      setFormData({ title: '', content: '' });
      setShowCreateForm(false);
      setSuccess('Tạo bài viết thành công! 🎉');
      loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể tạo bài viết');
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !validateForm()) return;

    try {
      await postApi.updatePost(editingPost.id, formData);
      setFormData({ title: '', content: '' });
      setEditingPost(null);
      setSuccess('Cập nhật bài viết thành công! ✨');
      loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể cập nhật bài viết');
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

    try {
      await postApi.deletePost(id);
      setSuccess('Xóa bài viết thành công! 🗑️');
      loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể xóa bài viết');
    }
  };

  const handleToggleLike = async (id: number) => {
    try {
      await postApi.toggleLike(id);
      loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể thích bài viết');
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

  const handleFileChange = (postId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const validFiles = files.filter(file =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
    );

    if (validFiles.length !== files.length) {
      setError('Chỉ chấp nhận file ảnh định dạng JPEG, PNG, GIF, và WebP');
    }

    const limitedFiles = validFiles.slice(0, 10);
    if (validFiles.length > 10) {
      setError('Tối đa 10 ảnh cho mỗi bài viết');
    }

    setImageUploadState(prev => ({
      ...prev,
      [postId]: {
        files: limitedFiles,
        uploading: false
      }
    }));
  };

  const handleUploadImages = async (postId: number) => {
    const uploadState = imageUploadState[postId];
    if (!uploadState || uploadState.files.length === 0) return;

    try {
      setImageUploadState(prev => ({
        ...prev,
        [postId]: { ...prev[postId], uploading: true }
      }));

      await postApi.uploadPostImages(postId, uploadState.files);
      
      setImageUploadState(prev => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });

      setSuccess(`Đã tải lên ${uploadState.files.length} ảnh thành công! 📷`);
      loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải lên ảnh');
      setImageUploadState(prev => ({
        ...prev,
        [postId]: { ...prev[postId], uploading: false }
      }));
    }
  };

  const handleDeleteImage = async (postId: number, imageId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;

    try {
      await postApi.deletePostImage(postId, imageId);
      setSuccess('Xóa ảnh thành công! 🖼️');
      loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể xóa ảnh');
    }
  };

  const formatDate = (date: string) => {
    const postDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return postDate.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canUserPost = () => {
    return user?.role === 'MENTOR';
  };

  if (loading && posts.length === 0) {
    return (
      <div className="posts-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="posts-container">
      {/* Header */}
      <div className="posts-header">
        <div className="header-content">
          <h1>📝 Bài Viết</h1>
          <p className="subtitle">Chia sẻ kiến thức và kết nối với cộng đồng</p>
        </div>
        {canUserPost() && !editingPost && (
          <button
            className="create-post-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <span className="btn-icon">{showCreateForm ? '✕' : '✚'}</span>
            {showCreateForm ? 'Hủy' : 'Bài Viết Mới'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <span className="tab-icon">🌐</span>
          <span className="tab-text">Tất Cả</span>
          <span className="tab-count">{posts.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => handleTabChange('my')}
        >
          <span className="tab-icon">👤</span>
          <span className="tab-text">Của Tôi</span>
          <span className="tab-count">{posts.filter(p => p.authorId === user?.id).length}</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              title="Xóa tìm kiếm"
            >
              ✖
            </button>
          )}
        </div>
        <div className="filter-controls" ref={filterDropdownRef}>
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="filter-icon">⚙️</span>
            <span className="filter-text">Lọc</span>
          </button>
          {showFilters && (
            <div className="filter-dropdown">
              <div className="filter-group">
                <h4 className="filter-label">Sắp xếp theo</h4>
                <div className="filter-options">
                  <button
                    className={`filter-option ${sortBy === 'newest' ? 'active' : ''}`}
                    onClick={() => setSortBy('newest')}
                  >
                    <span className="option-icon">🆕</span>
                    <span className="option-text">Mới nhất</span>
                  </button>
                  <button
                    className={`filter-option ${sortBy === 'oldest' ? 'active' : ''}`}
                    onClick={() => setSortBy('oldest')}
                  >
                    <span className="option-icon">📅</span>
                    <span className="option-text">Cũ nhất</span>
                  </button>
                  <button
                    className={`filter-option ${sortBy === 'popular' ? 'active' : ''}`}
                    onClick={() => setSortBy('popular')}
                  >
                    <span className="option-icon">🔥</span>
                    <span className="option-text">Phổ biến</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="search-results-info">
          <span className="results-text">
            Tìm thấy <strong>{filteredPosts.length}</strong> kết quả cho "<strong>{searchQuery}</strong>"
          </span>
          {filteredPosts.length === 0 && (
            <button 
              className="reset-search-btn"
              onClick={() => setSearchQuery('')}
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="notification error">
          <span className="notification-icon">⚠️</span>
          <span className="notification-message">{error}</span>
          <button className="notification-close" onClick={() => setError(null)}>✖</button>
        </div>
      )}
      {success && (
        <div className="notification success">
          <span className="notification-icon">✅</span>
          <span className="notification-message">{success}</span>
          <button className="notification-close" onClick={() => setSuccess(null)}>✖</button>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="post-form-container">
          <form className="post-form" onSubmit={handleCreatePost}>
            <div className="form-header">
              <h2>✨ Tạo Bài Viết Mới</h2>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label htmlFor="title">Tiêu đề bài viết</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề hấp dẫn..."
                  maxLength={200}
                />
                <div className="char-count">{formData.title.length}/200</div>
              </div>
              <div className="form-group">
                <label htmlFor="content">Nội dung</label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Chia sẻ suy nghĩ của bạn..."
                  rows={6}
                  maxLength={5000}
                />
                <div className="char-count">{formData.content.length}/5000</div>
              </div>
            </div>
            <div className="form-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                Đăng bài
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      {filteredPosts.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>{activeTab === 'my' ? 'Chưa có bài viết nào' : 'Chưa có bài viết nào'}</h3>
          <p>{activeTab === 'my' ? 'Hãy tạo bài viết đầu tiên của bạn!' : 'Hãy là người đầu tiên chia sẻ!'}</p>
        </div>
      ) : (
        <div className="posts-grid">
          {filteredPosts.map((post) => {
            const isEditing = editingPost?.id === post.id;
            const displayContent = post.content.length > 300 
              ? post.content.substring(0, 300) + '...' 
              : post.content;

            return (
              <article key={post.id} className="post-card">
                {isEditing ? (
                  // Edit Form
                  <div className="post-edit-form">
                    <form onSubmit={handleUpdatePost}>
                      <div className="form-header">
                        <h2>✏️ Chỉnh Sửa Bài Viết</h2>
                      </div>
                      <div className="form-body">
                        <div className="form-group">
                          <label>Tiêu đề</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            maxLength={200}
                          />
                          <div className="char-count">{formData.title.length}/200</div>
                        </div>
                        <div className="form-group">
                          <label>Nội dung</label>
                          <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={6}
                            maxLength={5000}
                          />
                          <div className="char-count">{formData.content.length}/5000</div>
                        </div>
                      </div>
                      <div className="form-footer">
                        <button type="button" className="btn btn-secondary" onClick={cancelEditing}>
                          Hủy
                        </button>
                        <button type="submit" className="btn btn-primary">
                          Cập nhật
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  // Post Display
                  <>
                    <div className="post-header">
                      <div 
                        className="author-info"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (post.authorId) {
                            navigate(`/profile/${post.authorId}`);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Xem profile"
                      >
                        <div className="author-avatar">
                          {(post.user?.mentorprofile?.avatar || post.user?.menteeprofile?.avatar) ? (
                            <img 
                              src={`${API_BASE_URL}${post.user?.mentorprofile?.avatar || post.user?.menteeprofile?.avatar}`}
                              alt="Avatar"
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
                          <h3 className="author-name">
                            {post.user?.mentorprofile?.fullName || 
                             post.user?.menteeprofile?.fullName || 
                             post.user?.email}
                          </h3>
                          <span className="post-time">{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                      {post.authorId === user?.id || user?.role === 'ADMIN' ? (
                        <div className="post-actions">
                          <button className="action-btn edit" onClick={() => startEditing(post)} title="Chỉnh sửa">
                            ✏️
                          </button>
                          <button className="action-btn delete" onClick={() => handleDeletePost(post.id)} title="Xóa">
                            🗑️
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="post-content" onClick={() => navigate(`/posts/${post.id}`)}>
                      <h2 className="post-title">{post.title}</h2>
                      <p className="post-text">{parseMarkdown(displayContent)}</p>
                      {post.content.length > 300 && (
                        <span className="read-more">Đọc tiếp →</span>
                      )}
                    </div>

                    {post.images && post.images.length > 0 && (
                      <div className="post-images">
                        {post.images.slice(0, 4).map((image, index) => {
                          const imageUrl = `${API_BASE_URL}${image.imageUrl}`;
                          return (
                            <div key={image.id} className="image-container">
                              <img
                                src={imageUrl}
                                alt={`Ảnh ${index + 1}`}
                                loading="lazy"
                              />
                              {index === 3 && post.images && post.images.length > 4 && (
                                <div className="images-overlay">
                                  +{post.images.length - 4}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="post-footer">
                      <button
                        className={`like-btn ${post.isLikedByCurrentUser ? 'liked' : ''}`}
                        onClick={() => handleToggleLike(post.id)}
                      >
                        <span className="like-icon">{post.isLikedByCurrentUser ? '❤️' : '🤍'}</span>
                        <span className="like-count">{post.likesCount || post._count?.likes || 0}</span>
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn prev"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            ← Trước
          </button>
          <div className="pagination-info">
            Trang <strong>{page}</strong> / {totalPages}
          </div>
          <button
            className="pagination-btn next"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};

export default PostList;