import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi } from '../../services/bookingApi';
import { sessionApi } from '../../services/sessionApi';
import { Booking } from '../../types/booking';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../Toast/ConfirmDialog';
import ErrorDialog from '../Toast/ErrorDialog';
import './BookingDetail.css';

const BookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [showStartSessionConfirm, setShowStartSessionConfirm] = useState(false);
  const [showConfirmBookingDialog, setShowConfirmBookingDialog] = useState(false);
  const [showCancelBookingDialog, setShowCancelBookingDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  const isMentor = user?.role === 'MENTOR';

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // Get all bookings and find the one we need
      const bookings = await bookingApi.getMyBookings();
      const foundBooking = bookings.find(b => b.id === parseInt(id));
      
      if (!foundBooking) {
        throw new Error('Booking not found');
      }
      
      setBooking(foundBooking);
    } catch (err: any) {
      console.error('Failed to load booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    setShowConfirmBookingDialog(false);
    if (!booking) return;

    try {
      await bookingApi.confirmBooking(booking.id);
      setSuccess('Xác nhận booking thành công!');
      setTimeout(() => navigate('/bookings'), 1500);
    } catch (err: any) {
      console.error('Failed to confirm booking:', err);
    }
  };

  const handleCancelBooking = async () => {
    setShowCancelBookingDialog(false);
    if (!booking) return;

    try {
      await bookingApi.cancelBooking(booking.id);
      setSuccess('Hủy booking thành công!');
      setTimeout(() => navigate('/bookings'), 1500);
    } catch (err: any) {
      console.error('Failed to cancel booking:', err);
    }
  };

  const handleGiveFeedback = () => {
    navigate('/feedback/create', { state: { booking } });
  };

  const handleStartSession = async () => {
    setShowStartSessionConfirm(false);
    if (!booking) return;

    try {
      await sessionApi.startSession({ bookingId: booking.id });
      setSuccess('Bắt đầu session thành công! Chuyển đến trang Sessions...');
      setTimeout(() => navigate('/sessions'), 1500);
    } catch (err: any) {
      setErrorDialog({ isOpen: true, message: err.response?.data?.error?.message || 'Không thể bắt đầu session' });
      console.error('Failed to start session:', err);
    }
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('vi-VN', {
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

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { icon: '⏳', text: 'Chờ xác nhận', class: 'status-pending' },
      CONFIRMED: { icon: '✅', text: 'Đã xác nhận', class: 'status-confirmed' },
      CANCELLED: { icon: '❌', text: 'Đã hủy', class: 'status-cancelled' },
      COMPLETED: { icon: '🎉', text: 'Hoàn thành', class: 'status-completed' }
    };
    return badges[status as keyof typeof badges] || badges.PENDING;
  };

  if (loading) {
    return (
      <div className="booking-detail-container">
        <div className="loading-message">
          Loading...
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="booking-detail-container">
        <div className="error-state">
          <span className="error-icon">📅</span>
          <h2>Không tìm thấy booking</h2>
          <button className="btn btn-primary" onClick={() => navigate('/bookings')}>
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(booking.status);

  return (
    <div className="booking-detail-container">
      {/* Back Button */}
      <div className="back-button-wrapper">
        <button className="back-btn" onClick={() => navigate('/bookings')}>
          ← Quay lại
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="notification success-notification">
          <span className="icon">✓</span>
          <span>{success}</span>
          <button className="close-btn" onClick={() => setSuccess(null)}>✖</button>
        </div>
      )}

      {/* Booking Detail Card */}
      <div className="booking-detail-card">
        {/* Header */}
        <div className="booking-detail-header">
          <div className="booking-header-content">
            <div className="booking-title-section">
              <h1 className="booking-detail-title">
                {booking.schedule?.topic || 'Lịch không có tiêu đề'}
              </h1>
              {booking.schedule?.topic && (
                <p className="booking-topic">📚 {booking.schedule.topic}</p>
              )}
            </div>
            <span className={`status-badge ${statusBadge.class}`}>
              {statusBadge.icon} {statusBadge.text}
            </span>
          </div>
        </div>

        {/* Participants Info */}
        <div className="participants-section">
          {/* Mentor Info */}
          {booking.schedule?.mentor && (
            <div 
              className="participant-card mentor-card"
              onClick={() => navigate(`/profile/${booking.schedule?.mentor?.id}`)}
              style={{ cursor: 'pointer' }}
              title="Xem profile mentor"
            >
              <div className="participant-avatar">
                {booking.schedule.mentor.mentorProfile?.fullName?.charAt(0).toUpperCase() || 
                 booking.schedule.mentor.email?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="participant-info">
                <span className="participant-label">👨‍🏫 Mentor</span>
                <h3 className="participant-name">
                  {booking.schedule.mentor.mentorProfile?.fullName || booking.schedule.mentor.email}
                </h3>
                {booking.schedule.mentor.mentorProfile?.bio && (
                  <p className="participant-bio">{booking.schedule.mentor.mentorProfile.bio}</p>
                )}
              </div>
            </div>
          )}

          {/* Mentee Info */}
          {booking.mentee && (
            <div 
              className="participant-card mentee-card"
              onClick={() => navigate(`/profile/${booking.mentee?.id}`)}
              style={{ cursor: 'pointer' }}
              title="Xem profile mentee"
            >
              <div className="participant-avatar">
                {booking.mentee.menteeProfile?.fullName?.charAt(0).toUpperCase() || 
                 booking.mentee.email?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="participant-info">
                <span className="participant-label">👩‍🎓 Mentee</span>
                <h3 className="participant-name">
                  {booking.mentee.menteeProfile?.fullName || booking.mentee.email}
                </h3>
                {booking.mentee.menteeProfile?.goals && (
                  <p className="participant-bio">{booking.mentee.menteeProfile.goals}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Schedule Info */}
        <div className="booking-info-section">
          <h3 className="section-title">📅 Thông Tin Lịch Hẹn</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-icon">📅</span>
              <div className="info-content">
                <label className="info-label">Ngày</label>
                <p className="info-value">
                  {new Date(booking.schedule?.startAt || '').toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              </div>
            </div>
            
            <div className="info-item">
              <span className="info-icon">🕐</span>
              <div className="info-content">
                <label className="info-label">Thời gian</label>
                <p className="info-value">
                  {booking.schedule?.startAt && booking.schedule?.endAt && 
                    formatTimeRange(booking.schedule.startAt, booking.schedule.endAt)}
                </p>
              </div>
            </div>
            
            <div className="info-item">
              <span className="info-icon">📝</span>
              <div className="info-content">
                <label className="info-label">Tạo lúc</label>
                <p className="info-value">{formatDateTime(booking.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Schedule Description */}
          {booking.schedule?.description && (
            <div className="description-section">
              <h4 className="subsection-title">📖 Mô tả buổi học</h4>
              <p className="description-text">{booking.schedule.description}</p>
            </div>
          )}

          {/* Booking Notes */}
          {booking.notes && (
            <div className="description-section">
              <h4 className="subsection-title">💬 Ghi chú từ mentee</h4>
              <p className="description-text">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="booking-actions">
          {isMentor && booking.status === 'PENDING' && (
            <button 
              className="btn btn-success btn-large"
              onClick={() => setShowConfirmBookingDialog(true)}
            >
              ✓ Xác Nhận Booking
            </button>
          )}
          
          {isMentor && booking.status === 'CONFIRMED' && !booking.session && (
            <button 
              className="btn btn-primary btn-large"
              onClick={() => setShowStartSessionConfirm(true)}
            >
              ▶️ Bắt Đầu Session
            </button>
          )}
          
          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <button 
              className="btn btn-danger btn-large"
              onClick={() => setShowCancelBookingDialog(true)}
            >
              ✖ Hủy Booking
            </button>
          )}

          {!isMentor && booking.status === 'COMPLETED' && (
            <button 
              className="btn btn-primary btn-large"
              onClick={handleGiveFeedback}
            >
              ⭐ Đánh Giá
            </button>
          )}
        </div>
      </div>

      {/* Confirm Dialog for Start Session */}
      <ConfirmDialog
        isOpen={showStartSessionConfirm}
        title="Bắt đầu Session"
        message="Bạn có chắc chắn muốn bắt đầu session ngay bây giờ không?"
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={handleStartSession}
        onCancel={() => setShowStartSessionConfirm(false)}
        type="info"
      />

      {/* Confirm Dialog for Confirm Booking */}
      <ConfirmDialog
        isOpen={showConfirmBookingDialog}
        title="Xác nhận Booking"
        message="Bạn có chắc chắn muốn xác nhận booking này?"
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={handleConfirmBooking}
        onCancel={() => setShowConfirmBookingDialog(false)}
        type="info"
      />

      {/* Confirm Dialog for Cancel Booking */}
      <ConfirmDialog
        isOpen={showCancelBookingDialog}
        title="Hủy Booking"
        message="Bạn có chắc chắn muốn hủy booking này?"
        confirmText="Hủy booking"
        cancelText="Không"
        onConfirm={handleCancelBooking}
        onCancel={() => setShowCancelBookingDialog(false)}
        type="danger"
      />

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={errorDialog.isOpen}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ isOpen: false, message: '' })}
        type="error"
      />
    </div>
  );
};

export default BookingDetail;
