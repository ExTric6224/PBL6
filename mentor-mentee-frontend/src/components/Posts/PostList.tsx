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
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
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

  // Filter and sort posts based on active tab, search, and sort
  const getFilteredAndSortedPosts = () => {
    let filtered = activeTab === 'my' 
      ? posts.filter(post => post.authorId === user?.id)
      : posts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.content.toLowerCase().includes(query)
      );
    }

    // Apply sorting
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

  const toggleExpandPost = (postId: number) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
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
    return user?.role === 'MENTOR' || user?.role === 'ADMIN';
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
          <h1>
            <span className="icon">📝</span>
            Cộng Đồng
          </h1>
          <p className="subtitle">Chia sẻ kiến thức và kết nối với mọi người</p>
        </div>
        {canUserPost() && !editingPost && (
          <button
            className={`create-post-btn ${showCreateForm ? 'active' : ''}`}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? (
              <>
                <span>✖</span> Hủy
              </>
            ) : (
              <>
                <span>✚</span> Tạo Bài Viết
              </>
            )}
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
          <span className="tab-text">Tất Cả Bài Viết</span>
          <span className="tab-count">{posts.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => handleTabChange('my')}
        >
          <span className="tab-icon">👤</span>
          <span className="tab-text">Bài Viết Của Tôi</span>
          <span className="tab-count">{posts.filter(p => p.authorId === user?.id).length}</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
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
            <span>🎚️</span>
            <span>Lọc</span>
          </button>
          {showFilters && (
            <div className="filter-dropdown">
              <div className="filter-group">
                <label className="filter-label">Sắp xếp theo:</label>
                <div className="filter-options">
                  <button
                    className={`filter-option ${sortBy === 'newest' ? 'active' : ''}`}
                    onClick={() => setSortBy('newest')}
                  >
                    <span>🆕</span> Mới nhất
                  </button>
                  <button
                    className={`filter-option ${sortBy === 'oldest' ? 'active' : ''}`}
                    onClick={() => setSortBy('oldest')}
                  >
                    <span>📅</span> Cũ nhất
                  </button>
                  <button
                    className={`filter-option ${sortBy === 'popular' ? 'active' : ''}`}
                    onClick={() => setSortBy('popular')}
                  >
                    <span>🔥</span> Phổ biến
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
          <span>Tìm thấy <strong>{filteredPosts.length}</strong> kết quả cho "<strong>{searchQuery}</strong>"</span>
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

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="post-form-container">
          <form
            className="post-form"
            onSubmit={handleCreatePost}
          >
            <div className="form-header">
              <h2>✨ Tạo Bài Viết Mới</h2>
            </div>

            <div className="form-body">
              <div className="form-group">
                <label htmlFor="title">
                  Tiêu Đề <span className="required">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề bài viết..."
                  required
                  maxLength={200}
                />
                <span className="char-count">{formData.title.length}/200</span>
              </div>

              <div className="form-group">
                <label htmlFor="content">
                  Nội Dung <span className="required">*</span>
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Chia sẻ suy nghĩ của bạn..."
                  required
                  rows={8}
                  maxLength={5000}
                />
                <span className="char-count">{formData.content.length}/5000</span>
              </div>
            </div>

            <div className="form-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                Đăng Bài
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      {filteredPosts.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>{activeTab === 'my' ? 'Bạn chưa có bài viết nào' : 'Chưa có bài viết nào'}</h3>
          <p>{activeTab === 'my' ? 'Hãy tạo bài viết đầu tiên của bạn!' : 'Hãy là người đầu tiên chia sẻ!'}</p>
        </div>
      ) : (
        <div className="posts-grid">
          {filteredPosts.map((post) => {
            const isExpanded = expandedPosts.has(post.id);
            const shouldTruncate = post.content.length > 300;
            const displayContent = shouldTruncate && !isExpanded
              ? post.content.substring(0, 300) + '...'
              : post.content;
            const isEditing = editingPost?.id === post.id;

            return (
              <article key={post.id} className="post-card">
                {isEditing ? (
                  // Edit Form - Inline
                  <div className="post-edit-form">
                    <form onSubmit={handleUpdatePost}>
                      <div className="form-header">
                        <h2>✏️ Chỉnh Sửa Bài Viết</h2>
                      </div>

                      <div className="form-body">
                        <div className="form-group">
                          <label htmlFor={`edit-title-${post.id}`}>
                            Tiêu Đề <span className="required">*</span>
                          </label>
                          <input
                            id={`edit-title-${post.id}`}
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Nhập tiêu đề bài viết..."
                            required
                            maxLength={200}
                          />
                          <span className="char-count">{formData.title.length}/200</span>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`edit-content-${post.id}`}>
                            Nội Dung <span className="required">*</span>
                          </label>
                          <textarea
                            id={`edit-content-${post.id}`}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Chia sẻ suy nghĩ của bạn..."
                            required
                            rows={8}
                            maxLength={5000}
                          />
                          <span className="char-count">{formData.content.length}/5000</span>
                        </div>

                        {/* Edit Images Section */}
                        {post.images && post.images.length > 0 && (
                          <div className="edit-images-section">
                            <label>Ảnh Hiện Tại</label>
                            <div className={`post-images ${post.images.length === 1 ? 'single' : post.images.length === 2 ? 'double' : 'grid'}`}>
                              {post.images.map((image) => {
                                const imageUrl = `${API_BASE_URL}${image.imageUrl}`;
                                return (
                                  <div key={image.id} className="image-wrapper">
                                    <img
                                      src={imageUrl}
                                      alt={`Ảnh ${image.order + 1}`}
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="16">Không tải được ảnh</text></svg>';
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="delete-image-btn"
                                      onClick={() => handleDeleteImage(post.id, image.id)}
                                      title="Xóa ảnh"
                                    >
                                      ✖
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Add More Images */}
                        <div className="edit-upload-section">
                          <label>Thêm Ảnh Mới</label>
                          <div className="image-upload-section">
                            <input
                              type="file"
                              id={`file-edit-${post.id}`}
                              multiple
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={(e) => handleFileChange(post.id, e)}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor={`file-edit-${post.id}`} className="upload-label">
                              <span>📷</span>
                              <span>
                                {imageUploadState[post.id]?.files.length > 0
                                  ? `${imageUploadState[post.id].files.length} ảnh đã chọn`
                                  : 'Chọn ảnh để thêm'}
                              </span>
                            </label>
                            {imageUploadState[post.id]?.files.length > 0 && (
                              <button
                                type="button"
                                className="upload-btn"
                                onClick={() => handleUploadImages(post.id)}
                                disabled={imageUploadState[post.id]?.uploading}
                              >
                                {imageUploadState[post.id]?.uploading ? (
                                  <>
                                    <span className="spinner-small"></span>
                                    Đang tải...
                                  </>
                                ) : (
                                  'Tải lên ngay'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="form-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={cancelEditing}
                        >
                          Hủy
                        </button>
                        <button type="submit" className="btn btn-primary">
                          Cập Nhật
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  // Normal Post Display
                  <>
                    {/* Post Header */}
                    <div className="post-card-header">
                      <div className="author-info">
                        <div 
                          className="avatar clickable"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${post.authorId}`);
                          }}
                          style={{ cursor: 'pointer' }}
                          title="Xem profile"
                        >
                          {post.user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="author-details">
                          <h3 
                            className="author-name clickable"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${post.authorId}`);
                            }}
                            style={{ cursor: 'pointer' }}
                            title="Xem profile"
                          >
                            {post.user?.mentorprofile?.fullName || 
                             post.user?.menteeprofile?.fullName || 
                             post.user?.email || 
                             'Unknown'}
                          </h3>
                          <time className="post-time">{formatDate(post.createdAt)}</time>
                        </div>
                      </div>
                      {post.authorId === user?.id && (
                        <div className="post-menu">
                          <button
                            className="menu-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(post);
                            }}
                            title="Chỉnh sửa"
                          >
                            ✏️
                          </button>
                          <button
                            className="menu-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Clickable Post Content Area */}
                    <div 
                      className="post-clickable-area" 
                      onClick={() => navigate(`/posts/${post.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Post Title */}
                      <h2 className="post-title">{post.title}</h2>

                      {/* Post Content Preview */}
                      <div className="post-content">
                        <p>{displayContent}</p>
                        {shouldTruncate && (
                          <span className="read-more-indicator">
                            {isExpanded ? '↑' : 'Đọc thêm →'}
                          </span>
                        )}
                      </div>

                      {/* Post Images Preview */}
                      {post.images && post.images.length > 0 && (
                        <div className={`post-images-preview ${post.images.length === 1 ? 'single' : post.images.length === 2 ? 'double' : 'grid'}`}>
                          {post.images.slice(0, 4).map((image, index) => {
                            const imageUrl = `${API_BASE_URL}${image.imageUrl}`;
                            return (
                              <div key={image.id} className="image-wrapper-preview">
                                <img
                                  src={imageUrl}
                                  alt={`Ảnh ${image.order + 1}`}
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="16">Không tải được ảnh</text></svg>';
                                  }}
                                />
                                {index === 3 && post.images && post.images.length > 4 && (
                                  <div className="more-images-overlay">
                                    +{post.images.length - 4}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Post Actions */}
                    <div className="post-actions">
                      <button
                        className={`action-btn like-btn ${post.isLikedByCurrentUser ? 'liked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(post.id);
                        }}
                      >
                        <span className="icon">{post.isLikedByCurrentUser ? '❤️' : '🤍'}</span>
                        <span className="count">{post.likesCount || post._count?.likes || 0}</span>
                        <span className="text">Thích</span>
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
            className="pagination-btn"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            ← Trước
          </button>
          <div className="pagination-info">
            <span className="current-page">{page}</span>
            <span className="separator">/</span>
            <span className="total-pages">{totalPages}</span>
          </div>
          <button
            className="pagination-btn"
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
