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
      if (isMentee) {
        // MENTEE: lấy feedback đã đánh giá
        const paginatedResponse = await feedbackApi.getMyFeedbacks();
        setFeedbacks(paginatedResponse.data || []);
      } else if (isMentor && user?.id) {
        // MENTOR: lấy feedback đã nhận
        const paginatedResponse = await feedbackApi.getFeedbacksByMentor(user.id);
        setFeedbacks(paginatedResponse.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load feedbacks:', err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [isMentee, isMentor, user?.id]);

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
      console.error('Error fetching sessions:', error);
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
      alert('Feedback submitted successfully!');
      setShowForm(false);
      setFormData({ sessionId: 0, rating: 5, comment: '' });
      loadMyFeedbacks();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit feedback');
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
        <h1>⭐ Feedback</h1>
        <p className="feedback-subtitle">
          {isMentee && 'View feedbacks you have given to mentors'}
          {isMentor && 'View feedbacks you have received from mentees'}
        </p>
      </div>

      {/* Only MENTEE can create feedback */}
      {isMentee && showForm && (
        <form className="feedback-form" onSubmit={handleSubmit}>
          <h2>Give Feedback</h2>
          <div className="rating-input">
            <label>Rating</label>
            {renderStars(formData.rating, true)}
          </div>
          <div className="form-group">
            <label>Select Session</label>
            {loadingSessions ? (
              <p className="loading-text">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="info-text">No completed sessions available for feedback</p>
            ) : (
              <select
                value={formData.sessionId || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  sessionId: parseInt(e.target.value) || 0 
                })}
                required
              >
                <option value="">-- Select a session to rate --</option>
                {sessions.map((session) => {
                  const sessionDate = new Date(session.startTime).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const mentorEmail = session.mentor?.email || 'Unknown mentor';
                  const bookingNotes = session.booking?.notes ? ` - ${session.booking.notes}` : '';
                  
                  return (
                    <option key={session.id} value={session.id}>
                      {sessionDate} with {mentorEmail}{bookingNotes}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
          <div className="form-group">
            <label>Comment (optional)</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Share your experience..."
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!formData.sessionId || loadingSessions}
            >
              Submit Feedback
            </button>
          </div>
        </form>
      )}

      {/* Only MENTEE can see create button */}
      {isMentee && !showForm && (
        <button className="create-post-btn" onClick={() => setShowForm(true)}>
          ✚ Give Feedback
        </button>
      )}

      {/* Display feedback list based on role */}
      <div className="feedback-list">
        <h2>
          {isMentee && 'Feedbacks I Have Given'}
          {isMentor && 'Feedbacks I Have Received'}
        </h2>
        
        {loading ? (
          <div className="loading">Loading feedbacks...</div>
        ) : feedbacks.length === 0 ? (
          <div className="empty-state">
            {isMentee && 'You haven\'t given any feedback yet.'}
            {isMentor && 'You haven\'t received any feedback yet.'}
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
                    Feedback for: {
                      feedback.mentor?.mentorprofile?.fullName || 
                      feedback.mentor?.email || 
                      'Unknown Mentor'
                    }
                  </span>
                )}
                
                {/* MENTOR sees: Feedback from Mentee X */}
                {isMentor && (
                  <span>
                    Feedback from: {
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
