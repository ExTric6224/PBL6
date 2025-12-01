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
      AVAILABLE: { text: 'Có thể đặt', class: 'status-available' },
      BOOKED: { text: 'Đã đặt', class: 'status-booked' },
      CANCELLED: { text: 'Đã hủy', class: 'status-cancelled' }
    };
    return badges[status as keyof typeof badges] || badges.AVAILABLE;
  };

  if (loading) {
    return (
      <div className="schedule-detail-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Đang tải lịch...</p>
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

  const statusBadge = getStatusBadge(schedule.status);

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
          {isMentee && schedule.status === 'AVAILABLE' && (
            <button 
              className="btn btn-primary"
              onClick={handleBookSchedule}
            >
              Đặt Lịch
            </button>
          )}
          
          {isMentor && schedule.mentorId === user?.id && (
            <button 
              className="btn btn-danger"
              onClick={handleDeleteSchedule}
            >
              Xóa Lịch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetail;