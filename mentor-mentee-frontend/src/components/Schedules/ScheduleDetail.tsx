import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scheduleApi } from '../../services/scheduleApi';
import { bookingApi } from '../../services/bookingApi';
import { Schedule } from '../../types/schedule';
import { useAuth } from '../../context/AuthContext';
import './ScheduleDetail.css';

const ScheduleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');

  const isMentor = user?.role === 'MENTOR';
  const isMentee = user?.role === 'MENTEE';

  useEffect(() => {
    loadSchedule();
  }, [id]);

  const loadSchedule = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await scheduleApi.getScheduleById(parseInt(id));
      setSchedule(response);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể tải lịch');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSchedule = () => {
    // Check if schedule already has a booking
    if (schedule && schedule.booking && schedule.booking.length > 0) {
      setError('Lịch này đã được đặt!');
      return;
    }
    setShowBookDialog(true);
  };

  const handleConfirmBook = async () => {
    if (!schedule) return;

    try {
      await bookingApi.createBooking({ 
        scheduleId: schedule.id, 
        notes: bookingNotes.trim() || undefined 
      });
      setSuccess('Đặt lịch thành công! Chờ mentor xác nhận.');
      setShowBookDialog(false);
      setBookingNotes('');
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể đặt lịch');
    }
  };

  const canDeleteSchedule = (schedule: Schedule) => {
    // Only show delete button if schedule is AVAILABLE and has no active bookings
    if (schedule.status !== 'AVAILABLE') return false;
    
    // Check if there's any booking (active or not)
    if (schedule.booking && schedule.booking.length > 0) {
      const hasActiveBooking = schedule.booking.some(
        b => b.status === 'PENDING' || b.status === 'CONFIRMED'
      );
      if (hasActiveBooking) return false;
    }
    
    return true;
  };

  const handleDeleteSchedule = async () => {
    if (!schedule || !window.confirm('Bạn có chắc chắn muốn hủy lịch này?')) return;

    try {
      await scheduleApi.deleteSchedule(schedule.id);
      setSuccess('hủy lịch thành công!');
      setTimeout(() => navigate('/schedules'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể hủy lịch');
    }
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeRange = (startAt: string, endAt: string) => {
    const start = new Date(startAt);
    const end = new Date(endAt);
    
    return `${start.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })} - ${end.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  const getStatusBadge = (schedule: Schedule) => {
    // For mentee: check if they booked this schedule
    if (isMentee && user && schedule.booking && schedule.booking.length > 0) {
      const userBooking = schedule.booking.find(b => b.userId === user.id);
      if (userBooking) {
        // User has booked this schedule
        if (userBooking.status === 'COMPLETED') {
          return { text: 'Đã hoàn thành', class: 'status-completed' };
        }
        return { text: 'Đã đặt (bạn)', class: 'status-booked-by-you' };
      }
      // Someone else booked it
      const hasActiveBooking = schedule.booking.some(
        b => (b.status === 'PENDING' || b.status === 'CONFIRMED') && b.userId !== user.id
      );
      if (hasActiveBooking) {
        return { text: 'Đã có người đặt', class: 'status-booked-by-other' };
      }
    }
    
    const badges = {
      AVAILABLE: { text: 'Có thể đặt', class: 'status-available' },
      BOOKED: { text: 'Đã đặt', class: 'status-booked' },
      COMPLETED: { text: 'Đã hoàn thành', class: 'status-completed' },
      CANCELLED: { text: 'Đã hủy', class: 'status-cancelled' }
    };
    return badges[schedule.status as keyof typeof badges] || badges.AVAILABLE;
  };

  if (loading) {
    return (
      <div className="schedule-detail-container">
        <div className="loading-message">
          Đang tải...
        </div>
      </div>
    );
  }

  if (error && !schedule) {
    return (
      <div className="schedule-detail-container">
        <div className="error-state">
          <h2>Có lỗi xảy ra</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/schedules')}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="schedule-detail-container">
        <div className="error-state">
          <h2>Không tìm thấy lịch</h2>
          <button className="btn btn-primary" onClick={() => navigate('/schedules')}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(schedule);
  
  // Check if user can book this schedule
  const canBook = isMentee && schedule.status === 'AVAILABLE' && 
                  (!schedule.booking || schedule.booking.length === 0 || 
                   !schedule.booking.some(b => (b.status === 'PENDING' || b.status === 'CONFIRMED')));
  
  // Check if this is user's own booking
  const userBooking = isMentee && user && schedule.booking?.find(b => b.userId === user.id);

  return (
    <div className="schedule-detail-container">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/schedules')}>
          ← Quay lại
        </button>
        <h1>Chi tiết lịch</h1>
      </div>

      {/* Notifications */}
      {error && (
        <div className="notification error">
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className="notification success">
          <span>{success}</span>
          <button className="close-btn" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="schedule-card">
        {/* Schedule Header */}
        <div className="schedule-header">
          <div className="schedule-title-section">
            <h2>{schedule.topic}</h2>
            <span className={`status-badge ${statusBadge.class}`}>
              {statusBadge.text}
            </span>
          </div>
          
          {/* Mentor Info */}
          {schedule.mentor && (
            <div 
              className="mentor-section"
              onClick={() => navigate(`/profile/${schedule.mentorId}`)}
            >
              <div className="mentor-avatar">
                {schedule.mentor.mentorProfile?.fullName?.charAt(0).toUpperCase() || 
                 schedule.mentor.email?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="mentor-info">
                <span className="mentor-role">Mentor</span>
                <h3>{schedule.mentor.mentorProfile?.fullName || schedule.mentor.email}</h3>
                {schedule.mentor.mentorProfile?.bio && (
                  <p>{schedule.mentor.mentorProfile.bio}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Schedule Details */}
        <div className="schedule-details">
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-icon">📅</div>
              <div className="detail-content">
                <label>Ngày</label>
                <p>{formatDateTime(schedule.startAt).split(',')[0]}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">🕐</div>
              <div className="detail-content">
                <label>Thời gian</label>
                <p>{formatTimeRange(schedule.startAt, schedule.endAt)}</p>
              </div>
            </div>
            
          </div>

          {/* Description */}
          {schedule.description && (
            <div className="description-section">
              <h3>Mô tả</h3>
              <p>{schedule.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="action-section">
          {canBook && (
            <button 
              className="btn btn-primary"
              onClick={handleBookSchedule}
            >
              Đặt Lịch
            </button>
          )}
          
          {isMentee && userBooking && (
            <div className="booking-info-alert">
              <span className="alert-icon">✅</span>
              <span>
                {userBooking.status === 'COMPLETED' 
                  ? 'Bạn đã hoàn thành buổi học này'
                  : 'Bạn đã đặt lịch này'}
              </span>
            </div>
          )}
          
          {isMentee && !canBook && !userBooking && schedule.booking && schedule.booking.length > 0 && (
            <div className="booking-info-alert warning">
              <span className="alert-icon">⚠️</span>
              <span>Lịch này đã có người đặt</span>
            </div>
          )}
          
          {isMentor && schedule.mentorId === user?.id && canDeleteSchedule(schedule) && (
            <button 
              className="btn btn-danger"
              onClick={handleDeleteSchedule}
            >
              hủy Lịch
            </button>
          )}
        </div>
      </div>

      {/* Book Schedule Dialog */}
      {showBookDialog && (
        <div className="modal-overlay" onClick={() => setShowBookDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Đặt lịch hẹn</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowBookDialog(false);
                  setBookingNotes('');
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Vui lòng nhập ghi chú cho mentor (không bắt buộc). 
                Mentor sẽ xem xét và xác nhận lịch hẹn của bạn.
              </p>
              <div className="form-group">
                <label htmlFor="booking-notes">Ghi chú</label>
                <textarea
                  id="booking-notes"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn học về React Hooks và State Management..."
                  rows={5}
                  className="form-textarea"
                />
                <small className="form-hint">
                  Ghi chú giúp mentor hiểu rõ hơn về nhu cầu học tập của bạn
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowBookDialog(false);
                  setBookingNotes('');
                }}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConfirmBook}
              >
                Xác nhận đặt lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleDetail;