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

  const handleBookSchedule = async () => {
    if (!schedule) return;

    const notes = prompt('Nhập ghi chú cho mentor (tùy chọn):');
    try {
      await bookingApi.createBooking({ 
        scheduleId: schedule.id, 
        notes: notes || undefined 
      });
      setSuccess('Đặt lịch thành công! Chờ mentor xác nhận.');
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể đặt lịch');
    }
  };

  const handleDeleteSchedule = async () => {
    if (!schedule || !window.confirm('Bạn có chắc chắn muốn xóa lịch này?')) return;

    try {
      await scheduleApi.deleteSchedule(schedule.id);
      setSuccess('Xóa lịch thành công!');
      setTimeout(() => navigate('/schedules'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể xóa lịch');
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

  const getStatusBadge = (status: string) => {
    const badges = {
      AVAILABLE: { icon: '✅', text: 'Có thể đặt', class: 'status-available' },
      BOOKED: { icon: '📅', text: 'Đã đặt', class: 'status-booked' },
      CANCELLED: { icon: '❌', text: 'Đã hủy', class: 'status-cancelled' }
    };
    return badges[status as keyof typeof badges] || badges.AVAILABLE;
  };

  if (loading) {
    return (
      <div className="schedule-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải lịch...</p>
        </div>
      </div>
    );
  }

  if (error && !schedule) {
    return (
      <div className="schedule-detail-container">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h2>Có lỗi xảy ra</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/schedules')}>
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="schedule-detail-container">
        <div className="error-state">
          <span className="error-icon">📅</span>
          <h2>Không tìm thấy lịch</h2>
          <button className="btn btn-primary" onClick={() => navigate('/schedules')}>
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(schedule.status);

  return (
    <div className="schedule-detail-container">
      {/* Back Button */}
      <div className="back-button-wrapper">
        <button className="back-btn" onClick={() => navigate('/schedules')}>
          ← Quay lại
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="notification error-notification">
          <span className="icon">⚠️</span>
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError(null)}>✖</button>
        </div>
      )}
      {success && (
        <div className="notification success-notification">
          <span className="icon">✓</span>
          <span>{success}</span>
          <button className="close-btn" onClick={() => setSuccess(null)}>✖</button>
        </div>
      )}

      {/* Schedule Detail Card */}
      <div className="schedule-detail-card">
        {/* Header */}
        <div className="schedule-detail-header">
          <div className="schedule-header-content">
            <h1 className="schedule-detail-title">{schedule.topic}</h1>
            <span className={`status-badge ${statusBadge.class}`}>
              {statusBadge.icon} {statusBadge.text}
            </span>
          </div>
          
          {/* Mentor Info */}
          {schedule.mentor && (
            <div 
              className="mentor-info-card"
              onClick={() => navigate(`/profile/${schedule.mentorId}`)}
              style={{ cursor: 'pointer' }}
              title="Xem profile"
            >
              <div className="mentor-avatar">
                {schedule.mentor.mentorProfile?.fullName?.charAt(0).toUpperCase() || 
                 schedule.mentor.email?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="mentor-details">
                <span className="mentor-label">Mentor</span>
                <h3 className="mentor-name">
                  {schedule.mentor.mentorProfile?.fullName || schedule.mentor.email}
                </h3>
                {schedule.mentor.mentorProfile?.bio && (
                  <p className="mentor-bio">{schedule.mentor.mentorProfile.bio}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Schedule Info */}
        <div className="schedule-info-section">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-icon">📅</span>
              <div className="info-content">
                <label className="info-label">Ngày</label>
                <p className="info-value">{formatDateTime(schedule.startAt).split(',')[0]}</p>
              </div>
            </div>
            
            <div className="info-item">
              <span className="info-icon">🕐</span>
              <div className="info-content">
                <label className="info-label">Thời gian</label>
                <p className="info-value">{formatTimeRange(schedule.startAt, schedule.endAt)}</p>
              </div>
            </div>
            
            <div className="info-item">
              <span className="info-icon">👥</span>
              <div className="info-content">
                <label className="info-label">Số lượng</label>
                <p className="info-value">{schedule.capacity} người</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {schedule.description && (
            <div className="description-section">
              <h3 className="section-title">📝 Mô tả</h3>
              <p className="description-text">{schedule.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="schedule-actions">
          {isMentee && schedule.status === 'AVAILABLE' && (
            <button 
              className="btn btn-primary btn-large"
              onClick={handleBookSchedule}
            >
              📅 Đặt Lịch Ngay
            </button>
          )}
          
          {isMentor && schedule.mentorId === user?.id && (
            <button 
              className="btn btn-danger btn-large"
              onClick={handleDeleteSchedule}
            >
              🗑️ Xóa Lịch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetail;
