import React, { useEffect, useState } from 'react';
import { sessionApi } from '../../services/sessionApi';
import { Session } from '../../types/session';
import ConfirmDialog from '../Toast/ConfirmDialog';
import Toast, { ToastType } from '../Toast/Toast';
import './AdminSessionManagement.css';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminSessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    fetchSessions();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);

      // Fetch all sessions (for admin, getMySessions returns all sessions)
      const allSessionsData = await sessionApi.getMySessions();
      let allSessions = allSessionsData;

      // Apply filters on frontend
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        allSessions = allSessions.filter((session: any) => 
          session.booking?.schedule?.topic?.toLowerCase().includes(search) ||
          session.user_session_mentorIdTouser?.email?.toLowerCase().includes(search) ||
          session.user_session_mentorIdTouser?.mentorprofile?.fullName?.toLowerCase().includes(search) ||
          session.user_session_menteeIdTouser?.email?.toLowerCase().includes(search) ||
          session.user_session_menteeIdTouser?.menteeprofile?.fullName?.toLowerCase().includes(search) ||
          session.notes?.toLowerCase().includes(search)
        );
      }

      if (statusFilter !== 'ALL') {
        allSessions = allSessions.filter((session: Session) => session.status === statusFilter);
      }

      // Calculate pagination
      const total = allSessions.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      const paginatedSessions = allSessions.slice(start, end);

      setSessions(paginatedSessions);
      setPagination({
        ...pagination,
        total,
        totalPages,
      });
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setToast({
        show: true,
        message: 'Failed to fetch sessions',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = (sessionId: number) => {
    setSessionToDelete(sessionId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;

    try {
      await sessionApi.deleteSession(sessionToDelete);

      setToast({
        show: true,
        message: 'Session deleted successfully',
        type: 'success',
      });
      fetchSessions();
      setShowDetailModal(false);
    } catch (err: any) {
      console.error('Error deleting session:', err);
      setToast({
        show: true,
        message: err.response?.data?.error || 'Failed to delete session',
        type: 'error',
      });
    } finally {
      setShowConfirmDialog(false);
      setSessionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setSessionToDelete(null);
  };

  const handleViewSession = (session: Session) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedSession(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchSessions();
  };

  const getUserFullName = (user?: any, profile?: any) => {
    if (!user) return 'Unknown';
    if (profile?.fullName) {
      return profile.fullName;
    }
    return user.email || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { text: string; class: string } } = {
      SCHEDULED: { text: 'Đã lên lịch', class: 'status-scheduled' },
      IN_PROGRESS: { text: 'Đang diễn ra', class: 'status-in-progress' },
      COMPLETED: { text: 'Hoàn thành', class: 'status-completed' },
      CANCELLED: { text: 'Đã hủy', class: 'status-cancelled' },
    };
    return badges[status] || { text: status, class: 'status-default' };
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

  if (loading && sessions.length === 0) {
    return <div className="admin-loading">Loading sessions...</div>;
  }

  return (
    <div className="admin-session-management">
      <div className="admin-header">
        <h1>Session Management</h1>
        <p>Manage all sessions in the system</p>
      </div>

      <div className="admin-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search sessions by topic, mentor, mentee, or notes..."
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
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination({ ...pagination, page: 1 });
          }}
          className="status-filter"
        >
          <option value="ALL">All Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="sessions-table-container">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mentor</th>
              <th>Mentee</th>
              <th>Topic</th>
              <th>Started At</th>
              <th>Ended At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  No sessions found
                </td>
              </tr>
            ) : (
              sessions.map((session: any) => (
                <tr key={session.id}>
                  <td>{session.id}</td>
                  <td>{getUserFullName(session.user_session_mentorIdTouser, session.user_session_mentorIdTouser?.mentorprofile)}</td>
                  <td>{getUserFullName(session.user_session_menteeIdTouser, session.user_session_menteeIdTouser?.menteeprofile)}</td>
                  <td className="session-topic">{session.booking?.schedule?.topic || 'N/A'}</td>
                  <td>{formatDateTime(session.startedAt)}</td>
                  <td>{formatDateTime(session.endedAt)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(session.status).class}`}>
                      {getStatusBadge(session.status).text}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleViewSession(session)}
                      className="action-button view-button"
                      title="View Details"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="action-button delete-button"
                      title="Delete Session"
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
            Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total} sessions)
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

      {showDetailModal && selectedSession && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Session Details</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Session #{selectedSession.id}</h3>
                <div className="session-meta">
                  <div className="meta-row">
                    <strong>Status:</strong>
                    <span className={`status-badge ${getStatusBadge(selectedSession.status).class}`}>
                      {getStatusBadge(selectedSession.status).text}
                    </span>
                  </div>
                  <div className="meta-row">
                    <strong>Mentor:</strong>
                    <span>
                      {getUserFullName((selectedSession as any).user_session_mentorIdTouser, (selectedSession as any).user_session_mentorIdTouser?.mentorprofile)} ({(selectedSession as any).user_session_mentorIdTouser?.email})
                    </span>
                  </div>
                  <div className="meta-row">
                    <strong>Mentee:</strong>
                    <span>
                      {getUserFullName((selectedSession as any).user_session_menteeIdTouser, (selectedSession as any).user_session_menteeIdTouser?.menteeprofile)} ({(selectedSession as any).user_session_menteeIdTouser?.email})
                    </span>
                  </div>
                  {selectedSession.booking?.schedule && (
                    <>
                      <div className="meta-row">
                        <strong>Topic:</strong>
                        <span>{selectedSession.booking.schedule.topic}</span>
                      </div>
                      {selectedSession.booking.schedule.description && (
                        <div className="meta-row">
                          <strong>Schedule Description:</strong>
                          <span>{selectedSession.booking.schedule.description}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="meta-row">
                    <strong>Started At:</strong>
                    <span>{formatDateTime(selectedSession.startedAt)}</span>
                  </div>
                  {selectedSession.endedAt && (
                    <div className="meta-row">
                      <strong>Ended At:</strong>
                      <span>{formatDateTime(selectedSession.endedAt)}</span>
                    </div>
                  )}
                  {selectedSession.autoStarted && (
                    <div className="meta-row">
                      <strong>Auto Started:</strong>
                      <span className="auto-badge">Yes</span>
                    </div>
                  )}
                  {selectedSession.autoEnded && (
                    <div className="meta-row">
                      <strong>Auto Ended:</strong>
                      <span className="auto-badge">Yes</span>
                    </div>
                  )}
                  {selectedSession.notes && (
                    <div className="meta-row">
                      <strong>Notes:</strong>
                      <span>{selectedSession.notes}</span>
                    </div>
                  )}
                  {selectedSession.feedback && (
                    <div className="feedback-section">
                      <h4>Feedback</h4>
                      <div className="meta-row">
                        <strong>Rating:</strong>
                        <span className="rating">{'⭐'.repeat(selectedSession.feedback.rating)}</span>
                      </div>
                      {selectedSession.feedback.comment && (
                        <div className="meta-row">
                          <strong>Comment:</strong>
                          <span>{selectedSession.feedback.comment}</span>
                        </div>
                      )}
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
                onClick={() => handleDeleteSession(selectedSession.id)}
                className="button button-danger"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone and will also delete any related feedback."
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

export default AdminSessionManagement;
