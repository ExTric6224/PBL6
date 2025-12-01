import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { sessionApi } from '../../services/sessionApi';
import { feedbackApi } from '../../services/feedbackApi';
import { Session } from '../../types/session';
import { useAuth } from '../../context/AuthContext';
import './SessionDetail.css';

const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    comment: ''
  });
  const feedbackSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadSession();
    }
  }, [id]);

  // Auto scroll to feedback section if navigated from "View Feedback" button
  useEffect(() => {
    if (location.state?.scrollToFeedback && feedbackSectionRef.current && !loading) {
      setTimeout(() => {
        feedbackSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 300);
    }
  }, [location.state, loading]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sessionApi.getMySessions();
      const foundSession = data.find((s: any) => s.id === parseInt(id!));
      if (foundSession) {
        console.log('Session data:', foundSession); // Debug log
        console.log('Feedback data:', foundSession.feedback); // Debug log
        setSession(foundSession);
      } else {
        setError('Session not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!session) return;
    try {
      setActionLoading(true);
      setError(null);
      await sessionApi.startSession({ bookingId: session.bookingId });
      await loadSession();
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
      console.error('Error starting session:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!session) return;
    const notes = prompt('Enter session notes (optional):');
    try {
      setActionLoading(true);
      setError(null);
      await sessionApi.endSession({ 
        sessionId: session.id, 
        notes: notes || undefined 
      });
      await loadSession();
    } catch (err: any) {
      setError(err.message || 'Failed to end session');
      console.error('Error ending session:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    try {
      setActionLoading(true);
      setError(null);
      await feedbackApi.createFeedback({
        sessionId: session.id,
        rating: feedbackData.rating,
        comment: feedbackData.comment
      });
      alert('Feedback đã được gửi thành công!');
      setShowFeedbackForm(false);
      setFeedbackData({ rating: 5, comment: '' });
      await loadSession(); // Reload to show the new feedback
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể gửi feedback');
      console.error('Error submitting feedback:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'status-scheduled';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Đã lên lịch';
      case 'IN_PROGRESS': return 'Đang diễn ra';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = () => {
    if (!session?.startedAt || !session?.endedAt) return null;
    const start = new Date(session.startedAt);
    const end = new Date(session.endedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} phút`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} giờ ${mins} phút`;
  };

  if (loading) {
    return (
      <div className="session-detail-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="session-detail-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>{error || 'Session not found'}</h3>
          <button className="btn-back" onClick={() => navigate('/sessions')}>
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="session-detail-container">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/sessions')}>
          ← Quay lại
        </button>
        <h1>{session.booking?.schedule?.topic || 'Session Details'}</h1>
        <span className={`status-badge ${getStatusColor(session.status)}`}>
          {getStatusLabel(session.status)}
        </span>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="detail-content">
        {/* Schedule Info Card - Now Primary */}
        {session.booking?.schedule && (
          <div className="detail-card">
            <div className="card-header">
              <h2>Thông tin buổi học</h2>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item full-width">
                  <span className="info-label">Chủ đề</span>
                  <span className="info-value schedule-title">{session.booking.schedule.topic}</span>
                </div>
                {session.booking.schedule.description && (
                  <div className="info-item full-width">
                    <span className="info-label">Mô tả</span>
                    <span className="info-value">{session.booking.schedule.description}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Thời gian bắt đầu</span>
                  <span className="info-value">
                    {formatDateTime(session.booking.schedule.startAt)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Thời gian kết thúc</span>
                  <span className="info-value">
                    {formatDateTime(session.booking.schedule.endAt)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Trạng thái</span>
                  <span className={`status-badge ${getStatusColor(session.status)}`}>
                    {getStatusLabel(session.status)}
                  </span>
                </div>
                {calculateDuration() && (
                  <div className="info-item">
                    <span className="info-label">Thời lượng thực tế</span>
                    <span className="info-value">{calculateDuration()}</span>
                  </div>
                )}
              </div>

              {/* Auto badges */}
              {(session.autoStarted || session.autoEnded) && (
                <div className="auto-badges">
                  {session.autoStarted && (
                    <div className="auto-badge auto-started">
                      Tự động bắt đầu
                    </div>
                  )}
                  {session.autoEnded && (
                    <div className="auto-badge auto-ended">
                      Tự động kết thúc
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Participant Info Card - Mentor or Mentee based on user role */}
        {user?.role === 'MENTEE' && session.booking?.schedule?.user && (
          <div className="detail-card">
            <div className="card-header">
              <h2>Thông tin Mentor</h2>
            </div>
            <div className="card-body">
              <div className="participant-card">
                <div className="participant-avatar">
                  {session.booking.schedule.user.mentorprofile?.avatar ? (
                    <img 
                      src={session.booking.schedule.user.mentorprofile.avatar} 
                      alt="Mentor avatar"
                    />
                  ) : (
                    <div className="avatar-placeholder">👨‍🏫</div>
                  )}
                </div>
                <div className="participant-info">
                  <div className="participant-name">
                    {session.booking.schedule.user.mentorprofile?.fullName || 'N/A'}
                  </div>
                  <div className="participant-email">
                    {session.booking.schedule.user.email}
                  </div>
                  {session.booking.schedule.user.mentorprofile?.bio && (
                    <div className="participant-bio">
                      {session.booking.schedule.user.mentorprofile.bio}
                    </div>
                  )}
                  <Link 
                    to={`/profile/${session.booking.schedule.user.id}`}
                    className="btn-view-profile"
                  >
                    Xem profile đầy đủ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'MENTOR' && session.booking?.user && (
          <div className="detail-card">
            <div className="card-header">
              <h2>Thông tin Mentee</h2>
            </div>
            <div className="card-body">
              <div className="participant-card">
                <div className="participant-avatar">
                  {session.booking.user.menteeprofile?.avatar ? (
                    <img 
                      src={session.booking.user.menteeprofile.avatar} 
                      alt="Mentee avatar"
                    />
                  ) : (
                    <div className="avatar-placeholder">👤</div>
                  )}
                </div>
                <div className="participant-info">
                  <div className="participant-name">
                    {session.booking.user.menteeprofile?.fullName || 'N/A'}
                  </div>
                  <div className="participant-email">
                    {session.booking.user.email}
                  </div>
                  {session.booking.user.menteeprofile?.goals && (
                    <div className="participant-bio">
                      <strong>Mục tiêu:</strong> {session.booking.user.menteeprofile.goals}
                    </div>
                  )}
                  <Link 
                    to={`/profile/${session.booking.user.id}`}
                    className="btn-view-profile"
                  >
                    Xem profile đầy đủ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Card */}
        {session.notes && (
          <div className="detail-card">
            <div className="card-header">
              <h2>📝 Notes</h2>
            </div>
            <div className="card-body">
              <div className="notes-content">{session.notes}</div>
            </div>
          </div>
        )}

        {/* Feedback Card - Show existing or form to create */}
        {session.feedback ? (
          <div className="detail-card" ref={feedbackSectionRef}>
            <div className="card-header">
              <h2>Feedback</h2>
            </div>
            <div className="card-body">
              <div className="feedback-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= session.feedback.rating ? 'star-filled' : 'star-empty'}>
                    ⭐
                  </span>
                ))}
                <span className="rating-value">({session.feedback.rating}/5)</span>
              </div>
              {session.feedback.comment && (
                <div className="feedback-comment">{session.feedback.comment}</div>
              )}
            </div>
          </div>
        ) : user?.role === 'MENTEE' && session.status === 'COMPLETED' && (
          <div className="detail-card" ref={feedbackSectionRef}>
            <div className="card-header">
              <h2>Đánh giá buổi học</h2>
            </div>
            <div className="card-body">
              {!showFeedbackForm ? (
                <button 
                  className="btn-action btn-primary"
                  onClick={() => setShowFeedbackForm(true)}
                >
                  ✚ Tạo feedback
                </button>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="feedback-form-inline">
                  <div className="form-group">
                    <label>Đánh giá của bạn</label>
                    <div className="rating-input">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star-interactive ${star <= feedbackData.rating ? 'active' : ''}`}
                          onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                        >
                          ⭐
                        </span>
                      ))}
                      <span className="rating-value">({feedbackData.rating}/5)</span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Nhận xét (tùy chọn)</label>
                    <textarea
                      value={feedbackData.comment}
                      onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                      placeholder="Chia sẻ trải nghiệm của bạn về buổi học..."
                      rows={4}
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn-action btn-secondary"
                      onClick={() => {
                        setShowFeedbackForm(false);
                        setFeedbackData({ rating: 5, comment: '' });
                      }}
                      disabled={actionLoading}
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="btn-action btn-primary"
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Đang gửi...' : 'Gửi feedback'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {user?.role === 'MENTOR' && (
          <div className="detail-actions">
            {session.status === 'SCHEDULED' && !session.startedAt && (
              <button
                className="btn-action btn-start"
                onClick={handleStartSession}
                disabled={actionLoading}
              >
                {actionLoading ? '⏳ Đang xử lý...' : '▶️ Bắt đầu Session'}
              </button>
            )}

            {session.status === 'IN_PROGRESS' && !session.endedAt && (
              <button
                className="btn-action btn-end"
                onClick={handleEndSession}
                disabled={actionLoading}
              >
                {actionLoading ? '⏳ Đang xử lý...' : '⏹️ Kết thúc Session'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetail;
