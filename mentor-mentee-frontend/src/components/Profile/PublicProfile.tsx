import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileApi } from '../../services/profileApi';
import { postApi } from '../../services/postApi';
import { scheduleApi } from '../../services/scheduleApi';
import { feedbackApi } from '../../services/feedbackApi';
import { MentorProfile, MenteeProfile } from '../../types/profile';
import { Post } from '../../types/post';
import { Schedule } from '../../types/schedule';
import { Feedback } from '../../types/feedback';
import './PublicProfile.css';

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MentorProfile | MenteeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<'MENTOR' | 'MENTEE' | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'schedules' | 'feedbacks'>('profile');

  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000/api').replace('/api', '');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    // Load posts và schedules ngay khi profile được load
    if (userId && profileType) {
      loadPosts();
      if (profileType === 'MENTOR') {
        loadSchedules();
        loadFeedbacks();
      }
    }
  }, [userId, profileType]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Use the new auto-detect API
      const profileData = await profileApi.getProfile(parseInt(userId));
      
      // Check if user data exists
      if (!profileData.user) {
        throw new Error('Invalid profile data');
      }
      
      // Determine profile type based on user role
      if (profileData.user.role === 'MENTOR') {
        // Ensure expertise is always an array
        if (!(profileData as any).expertise) {
          (profileData as any).expertise = [];
        }
        setProfile(profileData as MentorProfile);
        setProfileType('MENTOR');
      } else if (profileData.user.role === 'MENTEE') {
        // Ensure interests is always an array
        if (!(profileData as any).interests) {
          (profileData as any).interests = [];
        }
        setProfile(profileData as MenteeProfile);
        setProfileType('MENTEE');
      } else {
        throw new Error('Invalid profile type');
      }
    } catch (err: any) {
      setError('Không thể tải profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!userId) return;

    try {
      setLoadingPosts(true);
      const response = await postApi.getAllPosts(1, 50);
      // Filter posts by authorId on frontend and ensure it's an array
      const userPosts = Array.isArray(response.data) 
        ? response.data.filter(post => post.authorId === parseInt(userId))
        : [];
      setPosts(userPosts);
    } catch (err) {
      console.error('Error loading posts:', err);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadSchedules = async () => {
    if (!userId) return;

    try {
      setLoadingSchedules(true);
      const response = await scheduleApi.getAllSchedules({ 
        mentorId: parseInt(userId),
        limit: 50 
      });
      // Ensure response.data is an array
      setSchedules(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error loading schedules:', err);
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const loadFeedbacks = async () => {
    if (!userId) return;

    try {
      setLoadingFeedbacks(true);
      const response = await feedbackApi.getFeedbacksByMentor(parseInt(userId), { limit: 50 });
      // Ensure response.data is an array
      setFeedbacks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error loading feedbacks:', err);
      setFeedbacks([]);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatScheduleTime = (startAt: string, endAt: string) => {
    const start = new Date(startAt);
    const end = new Date(endAt);
    
    return `${start.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })} • ${start.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })} - ${end.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  if (loading) {
    return (
      <div className="public-profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="public-profile-container">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h2>Không tìm thấy profile</h2>
          <p>{error || 'Profile không tồn tại hoặc chưa được tạo'}</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const avatarUrl = profile.avatar ? `${baseUrl}${profile.avatar}` : '';

  return (
    <div className="public-profile-container">
      {/* Back Button */}
      <div className="back-button-wrapper">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
      </div>

      {/* Profile Card */}
      <div className="public-profile-card">
        <div className="profile-view-header">
          <div className="profile-avatar-large">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={profile.fullName}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`avatar-placeholder-large ${avatarUrl ? 'hidden' : ''}`}>
              <span>{profileType === 'MENTOR' ? '👨‍🏫' : '👩‍🎓'}</span>
            </div>
          </div>
          <div className="profile-view-info">
            <h1>{profile.fullName}</h1>
            <p className="profile-role">
              {profileType === 'MENTOR' ? '🎓 Mentor' : '🎓 Mentee'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            <span>Thông Tin</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <span className="tab-icon">📝</span>
            <span>Bài Viết</span>
            <span className="tab-count">{posts.length}</span>
          </button>
          {profileType === 'MENTOR' && (
            <>
              <button
                className={`tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedules')}
              >
                <span className="tab-icon">📅</span>
                <span>Lịch Hẹn</span>
                <span className="tab-count">{schedules.length}</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'feedbacks' ? 'active' : ''}`}
                onClick={() => setActiveTab('feedbacks')}
              >
                <span className="tab-icon">⭐</span>
                <span>Đánh Giá</span>
                <span className="tab-count">{feedbacks.length}</span>
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="profile-details">
          {/* Mentor-specific fields */}
          {profileType === 'MENTOR' && (
            <>
              {(profile as MentorProfile).phoneNumber && (
                <div className="detail-item">
                  <span className="detail-label">📱 Phone</span>
                  <span className="detail-value">{(profile as MentorProfile).phoneNumber}</span>
                </div>
              )}

              {(profile as MentorProfile).school && (
                <div className="detail-item">
                  <span className="detail-label">🏫 School</span>
                  <span className="detail-value">{(profile as MentorProfile).school}</span>
                </div>
              )}
              
              {(profile as MentorProfile).degree && (
                <div className="detail-item">
                  <span className="detail-label">🎓 Degree</span>
                  <span className="detail-value">{(profile as MentorProfile).degree}</span>
                </div>
              )}
              
              {(profile as MentorProfile).yearsExp !== undefined && (
                <div className="detail-item">
                  <span className="detail-label">💼 Experience</span>
                  <span className="detail-value">{(profile as MentorProfile).yearsExp} years</span>
                </div>
              )}
              
              {(profile as MentorProfile).bio && (
                <div className="detail-item">
                  <span className="detail-label">📝 Bio</span>
                  <p className="detail-value">{(profile as MentorProfile).bio}</p>
                </div>
              )}
              
              {(profile as MentorProfile).expertise && Array.isArray((profile as MentorProfile).expertise) && (profile as MentorProfile).expertise.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">🎯 Expertise</span>
                  <div className="topics-display">
                    {(profile as MentorProfile).expertise.map((topic) => (
                      <span key={topic.id} className="topic-badge">
                        {topic.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Mentee-specific fields */}
          {profileType === 'MENTEE' && (
            <>
              {(profile as MenteeProfile).phoneNumber && (
                <div className="detail-item">
                  <span className="detail-label">📱 Phone</span>
                  <span className="detail-value">{(profile as MenteeProfile).phoneNumber}</span>
                </div>
              )}

              {(profile as MenteeProfile).goals && (
                <div className="detail-item">
                  <span className="detail-label">🎯 Goals</span>
                  <p className="detail-value">{(profile as MenteeProfile).goals}</p>
                </div>
              )}
              
              {(profile as MenteeProfile).interests && Array.isArray((profile as MenteeProfile).interests) && (profile as MenteeProfile).interests.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">💡 Interests</span>
                  <div className="topics-display">
                    {(profile as MenteeProfile).interests.map((topic) => (
                      <span key={topic.id} className="topic-badge">
                        {topic.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="posts-section">
            {loadingPosts ? (
              <div className="loading-text">Đang tải bài viết...</div>
            ) : posts.length === 0 ? (
              <div className="empty-message">
                <span className="empty-icon">📭</span>
                <p>Chưa có bài viết nào</p>
              </div>
            ) : (
              <div className="posts-list">
                {posts.map((post) => (
                  <div 
                    key={post.id} 
                    className="post-item"
                    onClick={() => navigate(`/posts/${post.id}`)}
                  >
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-preview">
                      {post.content.substring(0, 150)}
                      {post.content.length > 150 ? '...' : ''}
                    </p>
                    <div className="post-meta">
                      <span className="post-date">{formatDate(post.createdAt)}</span>
                      <div className="post-stats">
                        <span>❤️ {post.likesCount || 0}</span>
                        {post.images && Array.isArray(post.images) && post.images.length > 0 && (
                          <span>🖼️ {post.images.length}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedules Tab */}
        {activeTab === 'schedules' && profileType === 'MENTOR' && (
          <div className="schedules-section">
            {loadingSchedules ? (
              <div className="loading-text">Đang tải lịch rảnh...</div>
            ) : schedules.length === 0 ? (
              <div className="empty-message">
                <span className="empty-icon">📅</span>
                <p>Chưa có lịch rảnh nào</p>
              </div>
            ) : (
              <div className="schedules-list">
                {schedules.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="schedule-item"
                    onClick={() => navigate(`/schedules/${schedule.id}`)}
                  >
                    <div className="schedule-header">
                      <h4 className="schedule-title">{schedule.topic || 'Không có chủ đề'}</h4>
                      <span className={`schedule-status status-${schedule.status?.toLowerCase()}`}>
                        {schedule.status === 'AVAILABLE' && '✅ Có thể đặt'}
                        {schedule.status === 'BOOKED' && '📅 Đã đặt'}
                        {schedule.status === 'CANCELLED' && '❌ Đã hủy'}
                      </span>
                    </div>
                    <div className="schedule-time">
                      <span className="time-icon">🕐</span>
                      <span>{formatScheduleTime(schedule.startAt, schedule.endAt)}</span>
                    </div>
                    {schedule.description && (
                      <p className="schedule-description">{schedule.description}</p>
                    )}
                    <div className="schedule-capacity">
                      <span>👥 Sức chứa: {schedule.capacity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedbacks Tab */}
        {activeTab === 'feedbacks' && profileType === 'MENTOR' && (
          <div className="feedbacks-section">
            {loadingFeedbacks ? (
              <div className="loading-text">Đang tải đánh giá...</div>
            ) : feedbacks.length === 0 ? (
              <div className="empty-message">
                <span className="empty-icon">⭐</span>
                <p>Chưa có đánh giá nào</p>
              </div>
            ) : (
              <div className="feedbacks-list">
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} className="feedback-item">
                    <div className="feedback-header">
                      <div className="feedback-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={`star ${star <= feedback.rating ? 'filled' : ''}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="feedback-date">
                        {new Date(feedback.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {feedback.comment && (
                      <p className="feedback-comment">{feedback.comment}</p>
                    )}
                    <div className="feedback-meta">
                      <span className="feedback-mentee">
                        👤 {feedback.mentee?.email || 'Mentee'}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Average Rating Summary */}
                {feedbacks.length > 0 && (
                  <div className="rating-summary">
                    <div className="summary-title">Tổng Quan Đánh Giá</div>
                    <div className="summary-content">
                      <div className="average-rating">
                        <span className="rating-number">
                          {(feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)}
                        </span>
                        <span className="rating-text">/ 5.0</span>
                      </div>
                      <div className="rating-breakdown">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = feedbacks.filter(f => f.rating === rating).length;
                          const percentage = (count / feedbacks.length) * 100;
                          return (
                            <div key={rating} className="rating-bar-container">
                              <span className="rating-label">{rating} ⭐</span>
                              <div className="rating-bar">
                                <div 
                                  className="rating-bar-fill" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="rating-count">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
