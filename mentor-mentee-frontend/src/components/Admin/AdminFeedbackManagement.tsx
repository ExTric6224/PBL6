import React, { useEffect, useState } from 'react';
import { feedbackApi } from '../../services/feedbackApi';
import { Feedback } from '../../types/feedback';
import ConfirmDialog from '../Toast/ConfirmDialog';
import Toast, { ToastType } from '../Toast/Toast';
import './AdminFeedbackManagement.css';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminFeedbackManagement: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    fetchFeedbacks();
  }, [pagination.page, searchTerm, ratingFilter]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);

      // Fetch all feedbacks (for admin, getMyFeedbacks returns all feedbacks)
      const response = await feedbackApi.getMyFeedbacks();
      let allFeedbacks = response.data || [];

      // Apply filters on frontend
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        allFeedbacks = allFeedbacks.filter((feedback: Feedback) => 
          feedback.mentor?.email?.toLowerCase().includes(search) ||
          feedback.mentor?.mentorprofile?.fullName?.toLowerCase().includes(search) ||
          feedback.mentee?.email?.toLowerCase().includes(search) ||
          feedback.mentee?.menteeprofile?.fullName?.toLowerCase().includes(search) ||
          feedback.comment?.toLowerCase().includes(search)
        );
      }

      if (ratingFilter !== 'ALL') {
        const rating = parseInt(ratingFilter);
        allFeedbacks = allFeedbacks.filter((feedback: Feedback) => feedback.rating === rating);
      }

      // Calculate pagination
      const total = allFeedbacks.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      const paginatedFeedbacks = allFeedbacks.slice(start, end);

      setFeedbacks(paginatedFeedbacks);
      setPagination({
        ...pagination,
        total,
        totalPages,
      });
    } catch (err: any) {
      console.error('Error fetching feedbacks:', err);
      setToast({
        show: true,
        message: 'Failed to fetch feedbacks',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = (feedbackId: number) => {
    setFeedbackToDelete(feedbackId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!feedbackToDelete) return;

    try {
      await feedbackApi.deleteFeedback(feedbackToDelete);

      setToast({
        show: true,
        message: 'Feedback deleted successfully',
        type: 'success',
      });
      fetchFeedbacks();
      setShowDetailModal(false);
    } catch (err: any) {
      console.error('Error deleting feedback:', err);
      setToast({
        show: true,
        message: err.response?.data?.error || 'Failed to delete feedback',
        type: 'error',
      });
    } finally {
      setShowConfirmDialog(false);
      setFeedbackToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setFeedbackToDelete(null);
  };

  const handleViewFeedback = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedFeedback(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchFeedbacks();
  };

  const getUserFullName = (user?: any, profile?: any) => {
    if (!user) return 'Unknown';
    if (profile?.fullName) {
      return profile.fullName;
    }
    return user.email || 'Unknown';
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  if (loading && feedbacks.length === 0) {
    return <div className="admin-loading">Loading feedbacks...</div>;
  }

  return (
    <div className="admin-feedback-management">
      <div className="admin-header">
        <h1>Feedback Management</h1>
        <p>Manage all feedbacks in the system</p>
      </div>

      <div className="admin-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search feedbacks by mentor, mentee, or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
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
              Clear
            </button>
          )}
        </form>

        <select
          value={ratingFilter}
          onChange={(e) => {
            setRatingFilter(e.target.value);
            setPagination({ ...pagination, page: 1 });
          }}
          className="rating-filter"
        >
          <option value="ALL">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      <div className="feedbacks-table-container">
        <table className="feedbacks-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mentor</th>
              <th>Mentee</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  No feedbacks found
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback) => (
                <tr key={feedback.id}>
                  <td>{feedback.id}</td>
                  <td>{getUserFullName(feedback.mentor, feedback.mentor?.mentorprofile)}</td>
                  <td>{getUserFullName(feedback.mentee, feedback.mentee?.menteeprofile)}</td>
                  <td>
                    <span className="rating-stars">{renderStars(feedback.rating)}</span>
                  </td>
                  <td className="feedback-comment">
                    {feedback.comment ? (feedback.comment.length > 50 ? feedback.comment.substring(0, 50) + '...' : feedback.comment) : 'No comment'}
                  </td>
                  <td>{formatDateTime(feedback.createdAt)}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleViewFeedback(feedback)}
                      className="action-button view-button"
                      title="View Details"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteFeedback(feedback.id)}
                      className="action-button delete-button"
                      title="Delete Feedback"
                    >
                      Delete
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
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total} feedbacks)
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {showDetailModal && selectedFeedback && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Feedback Details</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Feedback #{selectedFeedback.id}</h3>
                <div className="feedback-meta">
                  <div className="meta-row">
                    <strong>Rating:</strong>
                    <span className="rating-stars large">{renderStars(selectedFeedback.rating)}</span>
                  </div>
                  <div className="meta-row">
                    <strong>Mentor:</strong>
                    <span>
                      {getUserFullName(selectedFeedback.mentor, selectedFeedback.mentor?.mentorprofile)} ({selectedFeedback.mentor?.email})
                    </span>
                  </div>
                  <div className="meta-row">
                    <strong>Mentee:</strong>
                    <span>
                      {getUserFullName(selectedFeedback.mentee, selectedFeedback.mentee?.menteeprofile)} ({selectedFeedback.mentee?.email})
                    </span>
                  </div>
                  {selectedFeedback.comment && (
                    <div className="meta-row">
                      <strong>Comment:</strong>
                      <p className="comment-full">{selectedFeedback.comment}</p>
                    </div>
                  )}
                  {selectedFeedback.session && (
                    <div className="meta-row">
                      <strong>Session ID:</strong>
                      <span>{selectedFeedback.session.id}</span>
                    </div>
                  )}
                  <div className="meta-row">
                    <strong>Created At:</strong>
                    <span>{formatDateTime(selectedFeedback.createdAt)}</span>
                  </div>
                  {selectedFeedback.mentor?.mentorprofile?.bio && (
                    <div className="meta-row">
                      <strong>Mentor Bio:</strong>
                      <span>{selectedFeedback.mentor.mentorprofile.bio}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseModal} className="button button-secondary">
                Close
              </button>
              <button
                onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                className="button button-danger"
              >
                Delete Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default AdminFeedbackManagement;
