import React, { useState, useEffect, useCallback } from 'react';
import { mentorRecommendationApi, MentorRecommendation } from '../../services/mentorRecommendationApi';
import { topicApi } from '../../services/topicApi';
import { Topic } from '../../types/topic';
import { useNavigate } from 'react-router-dom';
import './MentorRecommendations.css';

const MentorRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<MentorRecommendation[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'sessions' | 'rating' | 'experience' | 'feedbacks'>('sessions');
  const [selectedTopic, setSelectedTopic] = useState<number | undefined>(undefined);

  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000/api').replace('/api', '');

  // Load topics
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topicsData = await topicApi.getAllTopics();
        setTopics(topicsData);
      } catch (err) {
        console.error('Failed to load topics:', err);
      }
    };
    loadTopics();
  }, []);

  // Load mentors
  const loadMentors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await mentorRecommendationApi.getRecommendedMentors(
        page,
        9,
        sortBy,
        selectedTopic
      );
      setMentors(response.data);
      setTotalPages(response.pagination.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể tải danh sách mentor');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, selectedTopic]);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [sortBy, selectedTopic]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`}>⭐</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half">⭐</span>);
    }
    
    return <span className="rating-stars">{stars.length > 0 ? stars : '—'}</span>;
  };

  const handleCardClick = (mentorId: number) => {
    navigate(`/profile/${mentorId}`);
  };

  if (loading && mentors.length === 0) {
    return (
      <div className="mentor-recommendations-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải danh sách mentor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-recommendations-container">
      {/* Header */}
      <div className="mentor-recommendations-header">
        <h1>🎓 Đề Xuất Mentor</h1>
        <p className="subtitle">Tìm kiếm mentor phù hợp với mục tiêu học tập của bạn</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Sắp xếp theo:</label>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="sessions">Hoạt động nhiều nhất</option>
            <option value="experience">Kinh nghiệm</option>
            <option value="feedbacks">Feedback</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Lĩnh vực:</label>
          <select
            className="filter-select"
            value={selectedTopic || ''}
            onChange={(e) => setSelectedTopic(e.target.value ? parseInt(e.target.value) : undefined)}
          >
            <option value="">Tất cả lĩnh vực</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="toast error">
          {error}
        </div>
      )}

      {/* Mentors Grid */}
      {mentors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Không tìm thấy mentor</h3>
          <p>Thử thay đổi bộ lọc để xem thêm mentor khác</p>
        </div>
      ) : (
        <>
          <div className="mentors-grid">
            {mentors.map((mentor) => (
              <div 
                key={mentor.id} 
                className="mentor-card"
                onClick={() => handleCardClick(mentor.userId)}
              >
                <div className="mentor-card-header">
                  <img
                    src={
                      mentor.avatar
                        ? `${API_BASE_URL}${mentor.avatar}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.fullName || 'M')}&size=100&background=667eea&color=fff`
                    }
                    alt={mentor.fullName}
                    className="mentor-avatar"
                  />
                  <h3>{mentor.fullName || 'Chưa cập nhật'}</h3>
                  <div className="mentor-email">{mentor.user.email}</div>
                </div>

                <div className="mentor-card-body">
                  {/* Basic Info */}
                  {mentor.school && (
                    <div className="mentor-info-row">
                      <strong>🏫 Trường:</strong>
                      <span>{mentor.school}</span>
                    </div>
                  )}
                  {mentor.degree && (
                    <div className="mentor-info-row">
                      <strong>🎓 Bằng cấp:</strong>
                      <span>{mentor.degree}</span>
                    </div>
                  )}
                  {mentor.yearsExp !== null && mentor.yearsExp !== undefined && (
                    <div className="mentor-info-row">
                      <strong>💼 Kinh nghiệm:</strong>
                      <span>{mentor.yearsExp} năm</span>
                    </div>
                  )}

                  {/* Bio */}
                  {mentor.bio && (
                    <div className="mentor-bio">
                      {mentor.bio.length > 100 ? `${mentor.bio.substring(0, 100)}...` : mentor.bio}
                    </div>
                  )}

                  {/* Expertise */}
                  {mentor.expertise && mentor.expertise.length > 0 && (
                    <div className="mentor-expertise">
                      <h4>📚 Chuyên môn:</h4>
                      <div className="expertise-tags">
                        {mentor.expertise.map((topic) => (
                          <span key={topic.id} className="expertise-tag">
                            {topic.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating */}
                  {mentor.stats.averageRating > 0 && (
                    <div className="mentor-rating">
                      <span className="rating-label">⭐ Đánh giá:</span>
                      <span className="rating-value">{mentor.stats.averageRating}/5</span>
                      <span className="rating-count">({mentor.stats.totalFeedbacks} feedback)</span>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={page === p ? 'active' : ''}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MentorRecommendations;
