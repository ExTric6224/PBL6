import React, { useState, useEffect, useCallback } from 'react';
import { feedbackApi } from '../../services/feedbackApi';
import { sessionApi } from '../../services/sessionApi';
import { Feedback, CreateFeedbackData } from '../../types/feedback';
import { Session } from '../../types/session';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './FeedbackForm.css';

const FeedbackForm: React.FC = () => {
  const location = useLocation();
  const booking = location.state?.booking;
  const { user } = useAuth();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showForm, setShowForm] = useState(!!booking);
  const [formData, setFormData] = useState<CreateFeedbackData>({
    sessionId: 0,
    rating: 5,
    comment: '',
  });

  // Check if user is MENTEE
  const isMentee = user?.role === 'MENTEE';
  const isMentor = user?.role === 'MENTOR';

  const loadMyFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      // Both MENTEE and MENTOR use getMyFeedbacks endpoint
      const paginatedResponse = await feedbackApi.getMyFeedbacks();
      setFeedbacks(paginatedResponse.data || []);
    } catch (err: any) {
      console.error('Không thể tải đánh giá:', err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCompletedSessions = useCallback(async () => {
    if (!isMentee) return; // Chỉ MENTEE mới cần load sessions
    
    try {
      setLoadingSessions(true);
      const allSessions = await sessionApi.getMySessions();
      
      // Lọc chỉ sessions đã hoàn thành và chưa có feedback
      const feedbackSessionIds = new Set(feedbacks.map(f => f.sessionId));
      const completedSessions = allSessions.filter(session => 
        session.status === 'COMPLETED' && !feedbackSessionIds.has(session.id)
      );
      
      setSessions(completedSessions);
    } catch (error) {
      console.error('Lỗi khi tải buổi học:', error);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [isMentee, feedbacks]);

  useEffect(() => {
    if (!booking) {
      loadMyFeedbacks();
    }
  }, [booking, loadMyFeedbacks]);

  useEffect(() => {
    // Load sessions sau khi đã có feedbacks
    if (isMentee && feedbacks.length >= 0) {
      loadCompletedSessions();
    }
  }, [feedbacks.length, isMentee, loadCompletedSessions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await feedbackApi.createFeedback(formData);
      alert('Gửi đánh giá thành công!');
      setShowForm(false);
      setFormData({ sessionId: 0, rating: 5, comment: '' });
      loadMyFeedbacks();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể gửi đánh giá');
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'active' : ''}`}
            onClick={interactive ? () => setFormData({ ...formData, rating: star }) : undefined}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h1>⭐ Đánh giá</h1>
        <p className="feedback-subtitle">
          {isMentee && 'Xem các đánh giá bạn đã gửi cho mentor'}
          {isMentor && 'Xem các đánh giá bạn đã nhận từ mentee'}
        </p>
      </div>

      {/* Only MENTEE can create feedback */}
      {isMentee && showForm && (
        <form className="feedback-form" onSubmit={handleSubmit}>
          <h2>Gửi đánh giá</h2>
          <div className="rating-input">
            <label>Đánh giá</label>
            {renderStars(formData.rating, true)}
          </div>
          <div className="form-group">
            <label>Chọn buổi học</label>
            {loadingSessions ? (
              <p className="loading-text">Đang tải buổi học...</p>
            ) : sessions.length === 0 ? (
              <p className="info-text">Không có buổi học nào để đánh giá</p>
            ) : (
              <select
                value={formData.sessionId || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  sessionId: parseInt(e.target.value) || 0 
                })}
                required
              >
                <option value="">-- Chọn buổi học để đánh giá --</option>
                {sessions.map((session) => {
                  const scheduleTopic = session.booking?.schedule?.topic || 'Session';
                  const mentorName = session.mentor?.mentorProfile?.fullName || 
                                    session.mentor?.email || 
                                    'Unknown mentor';
                  
                  return (
                    <option key={session.id} value={session.id}>
                      {scheduleTopic} với {mentorName}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
          <div className="form-group">
            <label>Nhận xét (tùy chọn)</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Chia sẻ trải nghiệm của bạn..."
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!formData.sessionId || loadingSessions}
            >
              Gửi đánh giá
            </button>
          </div>
        </form>
      )}

      {/* Only MENTEE can see create button */}
      {isMentee && !showForm && (
        <button className="create-post-btn" onClick={() => setShowForm(true)}>
          ✚ Gửi đánh giá
        </button>
      )}

      {/* Display feedback list based on role */}
      <div className="feedback-list">
        <h2>
          {isMentee && 'Các đánh giá tôi đã gửi'}
          {isMentor && 'Đánh giá đã nhận'}
        </h2>
        
        {loading ? (
          <div className="loading">Đang tải đánh giá...</div>
        ) : feedbacks.length === 0 ? (
          <div className="empty-state">
            {isMentee && 'Bạn chưa gửi đánh giá nào.'}
            {isMentor && 'Bạn chưa nhận được đánh giá nào.'}
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="feedback-card">
              <div className="feedback-header-info">
                <div className="feedback-rating">{renderStars(feedback.rating)}</div>
                <div className="feedback-date">
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </div>
              </div>
              {feedback.comment && <p className="feedback-comment">{feedback.comment}</p>}
              <div className="feedback-meta">
                {/* MENTEE sees: Feedback for Mentor X */}
                {isMentee && (
                  <span>
                    Đánh giá đến từ: {
                      feedback.mentor?.mentorprofile?.fullName || 
                      feedback.mentor?.email || 
                      'Unknown Mentor'
                    }
                  </span>
                )}
                
                {/* MENTOR sees: Feedback from Mentee X */}
                {isMentor && (
                  <span>
                    Đánh giá đến từ: {
                      feedback.mentee?.menteeprofile?.fullName || 
                      feedback.mentee?.email || 
                      'Anonymous Mentee'
                    }
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackForm;
