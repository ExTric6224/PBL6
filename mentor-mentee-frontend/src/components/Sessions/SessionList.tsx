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
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionApi.getMySessions();
      console.log('Sessions data:', data); // Debug log
      console.log('First session feedback:', data[0]?.feedback); // Debug log
      setSessions(data);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (bookingId: number) => {
    try {
      setActionLoading(bookingId);
      await sessionApi.startSession({ bookingId });
      await loadSessions();
    } catch (err: any) {
      console.error('Failed to start session:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndSession = async (sessionId: number) => {
    const notes = prompt('Enter session notes (optional):');
    try {
      setActionLoading(sessionId);
      await sessionApi.endSession({ 
        sessionId, 
        notes: notes || undefined 
      });
      await loadSessions();
    } catch (err: any) {
      console.error('Failed to end session:', err);
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
        <div className="loading-message">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      <div className="sessions-header">
        <h1>Quản lý buổi meeting</h1>
        <button className="btn-refresh" onClick={loadSessions}>
          Làm mới
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có buổi học nào</h3>
          <p>Các buổi học sẽ xuất hiện ở đây sau khi booking được xác nhận</p>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions.map((session: any) => (
            <div key={session.id} className={`session-card ${isExpanded(session.id) ? 'expanded' : ''}`}>
              <div className="session-header-card">
                <div className="session-title">
                  {session.booking?.schedule?.topic || `Session #${session.id}`}
                </div>
                <span className={`status-badge ${getStatusColor(session.status)}`}>
                  {getStatusLabel(session.status)}
                </span>
              </div>

              {/* Preview Info - Schedule focused */}
              <div className="session-preview">
                {session.booking?.schedule && (
                  <>
                    <div className="info-row">
                      <span className="info-label">Thời gian bắt đầu:</span>
                      <span className="info-value">
                        {formatDateTime(session.booking.schedule.startAt)}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Thời gian kết thúc:</span>
                      <span className="info-value">
                        {formatDateTime(session.booking.schedule.endAt)}
                      </span>
                    </div>
                  </>
                )}

                {/* Show Mentee info for Mentor, Mentor info for Mentee */}
                {user?.role === 'MENTOR' && session.booking?.user && (
                  <div className="info-row">
                    <span className="info-label">Mentee:</span>
                    <span className="info-value">
                      {session.booking.user.menteeprofile?.fullName || session.booking.user.email}
                    </span>
                  </div>
                )}

                {user?.role === 'MENTEE' && session.booking?.schedule?.user && (
                  <div className="info-row">
                    <span className="info-label">Mentor:</span>
                    <span className="info-value">
                      {session.booking.schedule.user.mentorprofile?.fullName || session.booking.schedule.user.email}
                    </span>
                  </div>
                )}

                {/* Show feedback rating in preview */}
                {session.feedback && (
                  <div className="info-row">
                    <span className="info-label">Đánh giá:</span>
                    <span className="info-value">
                      {session.feedback.rating}/5 ⭐
                    </span>
                  </div>
                )}
              </div>

              {/* Expanded Info */}
              {isExpanded(session.id) && (
                <div className="session-info">
                  {session.booking?.schedule?.description && (
                    <div className="info-row">
                      <span className="info-label">Mô tả:</span>
                      <span className="info-value">{session.booking.schedule.description}</span>
                    </div>
                  )}

                  {session.startedAt && (
                    <div className="info-row">
                      <span className="info-label">Bắt đầu thực tế:</span>
                      <span className="info-value">{formatDateTime(session.startedAt)}</span>
                    </div>
                  )}

                  {session.endedAt && (
                    <div className="info-row">
                      <span className="info-label">Kết thúc thực tế:</span>
                      <span className="info-value">{formatDateTime(session.endedAt)}</span>
                    </div>
                  )}

                  {session.notes && (
                    <div className="info-row">
                      <span className="info-label">Ghi chú:</span>
                      <span className="info-value notes-preview">{session.notes}</span>
                    </div>
                  )}

                  {session.feedback && session.feedback.comment && (
                    <div className="info-row">
                      <span className="info-label">Nhận xét:</span>
                      <span className="info-value">{session.feedback.comment}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Auto status badges */}
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

              {/* Action buttons - Simplified to 2 buttons max */}
              <div className="session-footer">
                <div className="session-actions">
                  {/* Button 1: Xem chi tiết - Always show */}
                  <button
                    className="btn-action btn-detail"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    Xem chi tiết
                  </button>

                  {/* Button 2: Role-specific action */}
                  {user?.role === 'MENTEE' && (
                    <>
                      {session.feedback ? (
                        <button
                          className="btn-action btn-feedback"
                          onClick={() => navigate(`/sessions/${session.id}`, { state: { scrollToFeedback: true } })}
                        >
                          Xem đánh giá
                        </button>
                      ) : session.status === 'COMPLETED' && (
                        <button
                          className="btn-action btn-feedback-create"
                          onClick={() => navigate(`/sessions/${session.id}`, { state: { scrollToFeedback: true } })}
                        >
                          Để lại đánh giá
                        </button>
                      )}
                    </>
                  )}

                  {user?.role === 'MENTOR' && (
                    <>
                      {session.status === 'SCHEDULED' && !session.startedAt && (
                        <button
                          className="btn-action btn-start"
                          onClick={() => handleStartSession(session.bookingId)}
                          disabled={actionLoading === session.bookingId}
                        >
                          {actionLoading === session.bookingId ? 'Đang xử lý...' : 'Bắt đầu'}
                        </button>
                      )}

                      {session.status === 'IN_PROGRESS' && !session.endedAt && (
                        <button
                          className="btn-action btn-end"
                          onClick={() => handleEndSession(session.id)}
                          disabled={actionLoading === session.id}
                        >
                          {actionLoading === session.id ? 'Đang xử lý...' : 'Kết thúc'}
                        </button>
                      )}

                      {session.status === 'COMPLETED' && session.feedback && (
                        <button
                          className="btn-action btn-feedback"
                          onClick={() => navigate(`/sessions/${session.id}`, { state: { scrollToFeedback: true } })}
                        >
                          Xem đánh giá
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionList;
