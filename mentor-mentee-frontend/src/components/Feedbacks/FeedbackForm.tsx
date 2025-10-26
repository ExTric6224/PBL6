import React, { useState, useEffect, useCallback } from 'react';
import { feedbackApi } from '../../services/feedbackApi';
import { Feedback, CreateFeedbackData } from '../../types/feedback';
import { useLocation } from 'react-router-dom';
import './FeedbackForm.css';

const FeedbackForm: React.FC = () => {
  const location = useLocation();
  const booking = location.state?.booking;

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(!!booking);
  const [formData, setFormData] = useState<CreateFeedbackData>({
    sessionId: 0,
    rating: 5,
    comment: '',
  });

  const loadMyFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await feedbackApi.getMyFeedbacks();
      setFeedbacks(response.data);
    } catch (err: any) {
      console.error('Failed to load feedbacks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!booking) {
      loadMyFeedbacks();
    }
  }, [booking, loadMyFeedbacks]);

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
      </div>

      {showForm && (
        <form className="feedback-form" onSubmit={handleSubmit}>
          <h2>Give Feedback</h2>
          <div className="rating-input">
            <label>Rating</label>
            {renderStars(formData.rating, true)}
          </div>
          <div className="form-group">
            <label>Session ID</label>
            <input
              type="number"
              value={formData.sessionId || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                sessionId: parseInt(e.target.value) || 0 
              })}
              required
              min="1"
              placeholder="Enter session ID"
            />
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
            <button type="submit" className="btn btn-primary">
              Submit Feedback
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button className="create-post-btn" onClick={() => setShowForm(true)}>
          ✚ Give Feedback
        </button>
      )}

      <div className="feedback-list">
        {loading ? (
          <div className="loading">Loading feedbacks...</div>
        ) : feedbacks.length === 0 ? (
          <div className="empty-state">No feedbacks yet.</div>
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
                Mentor: {feedback.mentor?.email || 'Unknown'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackForm;
