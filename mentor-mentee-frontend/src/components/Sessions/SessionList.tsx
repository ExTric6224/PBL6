import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionApi } from '../../services/sessionApi';
import { Session } from '../../types/session';
import { useAuth } from '../../context/AuthContext';
import './SessionList.css';

const SessionList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sessionApi.getMySessions();
      console.log('Sessions data:', data); // Debug log
      console.log('First session feedback:', data[0]?.feedback); // Debug log
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (bookingId: number) => {
    try {
      setActionLoading(bookingId);
      setError(null);
      await sessionApi.startSession({ bookingId });
      await loadSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
      console.error('Error starting session:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndSession = async (sessionId: number) => {
    const notes = prompt('Enter session notes (optional):');
    try {
      setActionLoading(sessionId);
      setError(null);
      await sessionApi.endSession({ 
        sessionId, 
        notes: notes || undefined 
      });
      await loadSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to end session');
      console.error('Error ending session:', err);
    } finally {
      setActionLoading(null);
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

  const toggleExpand = (sessionId: number) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const isExpanded = (sessionId: number) => expandedSessions.has(sessionId);

  if (loading) {
    return (
      <div className="sessions-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      <div className="sessions-header">
        <h1>📅 Quản lý Sessions</h1>
        <button className="btn-refresh" onClick={loadSessions}>
          🔄 Làm mới
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có session nào</h3>
          <p>Sessions sẽ xuất hiện ở đây khi có bookings được confirmed</p>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions.map((session: any) => (
            <div key={session.id} className={`session-card ${isExpanded(session.id) ? 'expanded' : ''}`}>
              <div className="session-header-card">
                <div className="session-id">Session #{session.id}</div>
                <span className={`status-badge ${getStatusColor(session.status)}`}>
                  {getStatusLabel(session.status)}
                </span>
              </div>

              {/* Preview Info */}
              <div className="session-preview">
                <div className="info-row">
                  <span className="info-label">📚 Booking ID:</span>
                  <span className="info-value">#{session.bookingId}</span>
                </div>

                {user?.role === 'MENTOR' && session.booking?.user && (
                  <div className="info-row">
                    <span className="info-label">👤 Mentee:</span>
                    <span className="info-value">{session.booking.user.email}</span>
                  </div>
                )}

                {user?.role === 'MENTEE' && session.booking?.schedule?.user && (
                  <div className="info-row">
                    <span className="info-label">👨‍🏫 Mentor:</span>
                    <span className="info-value">{session.booking.schedule.user.email}</span>
                  </div>
                )}

                {session.booking?.schedule && (
                  <div className="info-row">
                    <span className="info-label">📅 Thời gian:</span>
                    <span className="info-value">
                      {formatDateTime(session.booking.schedule.startAt)}
                    </span>
                  </div>
                )}

                {/* Show feedback rating in preview */}
                {session.feedback && (
                  <div className="info-row">
                    <span className="info-label">⭐ Rating:</span>
                    <span className="info-value">
                      {session.feedback.rating}/5 ⭐
                    </span>
                  </div>
                )}
              </div>

              {/* Expanded Info */}
              {isExpanded(session.id) && (
                <div className="session-info">
                  {session.booking?.schedule && (
                    <div className="info-row">
                      <span className="info-label">⏰ Kết thúc schedule:</span>
                      <span className="info-value">
                        {formatDateTime(session.booking.schedule.endAt)}
                      </span>
                    </div>
                  )}

                  {session.startedAt && (
                    <div className="info-row">
                      <span className="info-label">▶️ Bắt đầu thực tế:</span>
                      <span className="info-value">{formatDateTime(session.startedAt)}</span>
                    </div>
                  )}

                  {session.endedAt && (
                    <div className="info-row">
                      <span className="info-label">⏹️ Kết thúc thực tế:</span>
                      <span className="info-value">{formatDateTime(session.endedAt)}</span>
                    </div>
                  )}

                  {session.notes && (
                    <div className="info-row">
                      <span className="info-label">📝 Notes:</span>
                      <span className="info-value notes-preview">{session.notes}</span>
                    </div>
                  )}

                  {session.feedback && (
                    <div className="info-row">
                      <span className="info-label">⭐ Rating:</span>
                      <span className="info-value">
                        {session.feedback.rating}/5 ⭐
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Auto status badges */}
              <div className="auto-badges">
                {session.autoStarted && (
                  <div className="auto-badge auto-started">
                    🤖 Tự động bắt đầu
                  </div>
                )}
                {session.autoEnded && (
                  <div className="auto-badge auto-ended">
                    🤖 Tự động kết thúc
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="session-footer">
                <div className="session-actions">
                  <button
                    className="btn-action btn-expand"
                    onClick={() => toggleExpand(session.id)}
                  >
                    {isExpanded(session.id) ? '🔼 Thu gọn' : '🔽 Xem thêm'}
                  </button>

                  <button
                    className="btn-action btn-detail"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    👁️ Chi tiết
                  </button>

                  {/* Mentor controls */}
                  {user?.role === 'MENTOR' && (
                    <>
                      {session.status === 'SCHEDULED' && !session.startedAt && (
                        <button
                          className="btn-action btn-start"
                          onClick={() => handleStartSession(session.bookingId)}
                          disabled={actionLoading === session.bookingId}
                        >
                          {actionLoading === session.bookingId ? (
                            <span>⏳</span>
                          ) : (
                            <span>▶️ Bắt đầu</span>
                          )}
                        </button>
                      )}

                      {session.status === 'IN_PROGRESS' && !session.endedAt && (
                        <button
                          className="btn-action btn-end"
                          onClick={() => handleEndSession(session.id)}
                          disabled={actionLoading === session.id}
                        >
                          {actionLoading === session.id ? (
                            <span>⏳</span>
                          ) : (
                            <span>⏹️ Kết thúc</span>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* View profile links */}
                {isExpanded(session.id) && (
                  <div className="profile-links">
                    {session.booking?.schedule?.user && (
                      <button
                        className="btn-profile"
                        onClick={() => navigate(`/profile/${session.booking.schedule.user.id}`)}
                      >
                        👨‍🏫 Profile Mentor
                      </button>
                    )}
                    {session.booking?.user && (
                      <button
                        className="btn-profile"
                        onClick={() => navigate(`/profile/${session.booking.user.id}`)}
                      >
                        👤 Profile Mentee
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionList;
