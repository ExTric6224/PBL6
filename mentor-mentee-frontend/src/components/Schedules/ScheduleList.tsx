import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleApi } from '../../services/scheduleApi';
import { bookingApi } from '../../services/bookingApi';
import { Schedule, ScheduleQueryParams } from '../../types/schedule';
import { useAuth } from '../../context/AuthContext';
import './ScheduleList.css';
import './pagination-styles.css';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ScheduleList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ 
    topic: '', 
    description: '',
    startAt: '', 
    endAt: ''
  });
  const [filters, setFilters] = useState<ScheduleQueryParams>({ status: undefined });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'upcoming'>('upcoming');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [scheduleToBook, setScheduleToBook] = useState<number | null>(null);

  const isMentor = user?.role === 'MENTOR';

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const response = isMentor 
        ? await scheduleApi.getMySchedules(filters)
        : await scheduleApi.getAllSchedules(filters);
      
      // Backend returns array directly, not { data: [] }
      const schedulesData = Array.isArray(response) ? response : (response.data || []);
      setSchedules(schedulesData);
    } catch (err: any) {
      // Error will be handled by ErrorDialog via axios interceptor
      console.error('Failed to load schedules:', err);
      setSchedules([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [filters, isMentor]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Reset to page 1 when filters, search, or sort changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters.status, searchQuery, sortBy]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };

    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortMenu]);

  const getFilteredAndSortedSchedules = () => {
    let filtered = schedules;

    // Apply status filter with booking check
    if (filters.status) {
      filtered = filtered.filter(schedule => {
        const hasActiveBooking = schedule.booking && schedule.booking.length > 0 && 
          schedule.booking.some(b => b.status === 'PENDING' || b.status === 'CONFIRMED');
        
        if (filters.status === 'AVAILABLE') {
          // Only show schedules that are truly available (no active bookings)
          return schedule.status === 'AVAILABLE' && !hasActiveBooking;
        } else if (filters.status === 'BOOKED') {
          // Show schedules with active bookings OR schedule status is BOOKED
          return hasActiveBooking || schedule.status === 'BOOKED';
        } else {
          // For other statuses (COMPLETED, CANCELLED), use schedule status
          return schedule.status === filters.status;
        }
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(schedule =>
        schedule.topic.toLowerCase().includes(query) ||
        schedule.description?.toLowerCase().includes(query) ||
        schedule.mentor?.mentorProfile?.fullName?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || b.startAt).getTime() - new Date(a.createdAt || a.startAt).getTime();
        case 'oldest':
          return new Date(a.createdAt || a.startAt).getTime() - new Date(b.createdAt || b.startAt).getTime();
        case 'upcoming':
          return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
        default:
          return 0;
      }
    });

    // Calculate pagination
    const total = sorted.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    const paginatedSchedules = sorted.slice(start, end);

    // Update pagination info
    if (pagination.total !== total || pagination.totalPages !== totalPages) {
      setPagination(prev => ({
        ...prev,
        total,
        totalPages,
      }));
    }

    return paginatedSchedules;
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const start = new Date(formData.startAt);
    const end = new Date(formData.endAt);
    
    if (end <= start) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu!');
      return;
    }
    
    if (start < new Date()) {
      alert('Thời gian bắt đầu phải trong tương lai!');
      return;
    }
    
    try {
      await scheduleApi.createSchedule({
        topic: formData.topic,
        description: formData.description || undefined,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      
      setFormData({ topic: '', description: '', startAt: '', endAt: '' });
      setShowCreateForm(false);
      loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể tạo lịch');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn Hủy lịch này?')) return;
    try {
      await scheduleApi.deleteSchedule(id);
      loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể Hủy lịch');
    }
  };

  const handleBookSchedule = async (scheduleId: number) => {
    setScheduleToBook(scheduleId);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!scheduleToBook) return;
    
    try {
      await bookingApi.createBooking({ 
        scheduleId: scheduleToBook, 
        notes: bookingNotes || undefined 
      });
      alert('Đặt lịch thành công! Chờ mentor xác nhận.');
      setShowBookingModal(false);
      setBookingNotes('');
      setScheduleToBook(null);
      loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể đặt lịch');
    }
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setBookingNotes('');
    setScheduleToBook(null);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (schedule: Schedule) => {
    // For mentee: check if they booked this schedule
    if (!isMentor && user && schedule.booking && schedule.booking.length > 0) {
      const userBooking = schedule.booking.find(b => b.userId === user.id);
      if (userBooking) {
        // User has booked this schedule
        if (userBooking.status === 'COMPLETED') return 'completed';
        return 'booked-by-you';
      }
      // Someone else booked it
      const hasActiveBooking = schedule.booking.some(
        b => (b.status === 'PENDING' || b.status === 'CONFIRMED') && b.userId !== user.id
      );
      if (hasActiveBooking) return 'booked-by-other';
    }
    
    // For mentor or general status
    if (schedule.status === 'COMPLETED') return 'completed';
    if (schedule.booking && schedule.booking.length > 0) {
      const hasActiveBooking = schedule.booking.some(
        b => b.status === 'PENDING' || b.status === 'CONFIRMED'
      );
      if (hasActiveBooking) return 'booked';
    }
    return schedule.status.toLowerCase();
  };

  const getStatusText = (schedule: Schedule) => {
    // For mentee: show personalized status
    if (!isMentor && user && schedule.booking && schedule.booking.length > 0) {
      const userBooking = schedule.booking.find(b => b.userId === user.id);
      if (userBooking) {
        // User has booked this schedule
        if (userBooking.status === 'COMPLETED') return 'Đã hoàn thành';
        return 'Đã đặt (bạn)';
      }
      // Someone else booked it
      const hasActiveBooking = schedule.booking.some(
        b => (b.status === 'PENDING' || b.status === 'CONFIRMED') && b.userId !== user.id
      );
      if (hasActiveBooking) return 'Đã có người đặt';
    }
    
    // General status mapping
    if (schedule.status === 'COMPLETED') return 'Đã hoàn thành';
    if (schedule.booking && schedule.booking.length > 0) {
      const hasActiveBooking = schedule.booking.some(
        b => b.status === 'PENDING' || b.status === 'CONFIRMED'
      );
      if (hasActiveBooking) return 'Đã đặt';
    }
    
    const statusMap: { [key: string]: string } = {
      'AVAILABLE': 'Có thể đặt',
      'BOOKED': 'Đã đặt',
      'CANCELLED': 'Đã hủy'
    };
    return statusMap[schedule.status] || schedule.status;
  };

  const canBookSchedule = (schedule: Schedule) => {
    // Check if schedule is available
    if (schedule.status !== 'AVAILABLE') return false;
    
    // Check if there's already an active booking
    if (schedule.booking && schedule.booking.length > 0) {
      const hasActiveBooking = schedule.booking.some(
        b => b.status === 'PENDING' || b.status === 'CONFIRMED'
      );
      if (hasActiveBooking) return false;
    }
    
    return true;
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

  if (loading && schedules.length === 0) {
    return <div className="loading-message">Đang tải...</div>;
  }

  const filteredSchedules = getFilteredAndSortedSchedules();

  return (
    <div className="schedule-list-container">
      {/* Header */}
      <div className="page-header">
        <h1>{isMentor ? 'Lịch của tôi' : 'Lịch có sẵn'}</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="notification error">
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Search and Controls */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm lịch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        <div className="controls-group">
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="AVAILABLE">Có thể đặt</option>
            <option value="BOOKED">Đã đặt</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <div className="sort-container" ref={sortMenuRef}>
            <button 
              className="sort-btn"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              Sắp xếp
            </button>
            {showSortMenu && (
              <div className="sort-menu">
                <button 
                  className={`sort-option ${sortBy === 'upcoming' ? 'active' : ''}`}
                  onClick={() => { setSortBy('upcoming'); setShowSortMenu(false); }}
                >
                  Sắp diễn ra
                </button>
                <button 
                  className={`sort-option ${sortBy === 'newest' ? 'active' : ''}`}
                  onClick={() => { setSortBy('newest'); setShowSortMenu(false); }}
                >
                  Mới nhất
                </button>
                <button 
                  className={`sort-option ${sortBy === 'oldest' ? 'active' : ''}`}
                  onClick={() => { setSortBy('oldest'); setShowSortMenu(false); }}
                >
                  Cũ nhất
                </button>
              </div>
            )}
          </div>

          {isMentor && (
            <button
              className="sort-btn create-schedule-btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
              title={showCreateForm ? 'Hủy' : 'Tạo lịch mới'}
            >
              {showCreateForm ? '✕ Hủy' : '+ Tạo lịch'}
            </button>
          )}
        </div>
      </div>

      {/* Create Schedule Form */}
      {showCreateForm && isMentor && (
        <div className="create-form">
          <h2>Tạo lịch mới</h2>
          <form onSubmit={handleCreateSchedule}>
            <div className="form-group">
              <label>Chủ đề</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Ví dụ: Phát triển Backend cơ bản"
                required
              />
            </div>
            <div className="form-group">
              <label>Mô tả (tùy chọn)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả nội dung buổi học..."
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Thời gian kết thúc</label>
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                Tạo lịch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      {filteredSchedules.length === 0 && !loading ? (
        <div className="empty-state">
          <p>
            {searchQuery 
              ? 'Không tìm thấy lịch phù hợp' 
              : isMentor 
                ? 'Chưa có lịch nào. Tạo lịch đầu tiên của bạn!' 
                : 'Hiện không có lịch nào khả dụng.'
            }
          </p>
        </div>
      ) : (
        <>
        <div className="schedules-grid">
          {filteredSchedules.map((schedule) => (
            <div 
              key={schedule.id} 
              className="schedule-card"
              onClick={() => navigate(`/schedules/${schedule.id}`)}
            >
              <div className="schedule-header">
                <h3>{schedule.topic}</h3>
                <span className={`status-badge status-${getStatusBadgeClass(schedule)}`}>
                  {getStatusText(schedule)}
                </span>
              </div>

              {schedule.description && (
                <p className="schedule-description">{schedule.description}</p>
              )}

              <div className="schedule-time">
                <div className="date">{formatDate(schedule.startAt)}</div>
                <div className="time">
                  {formatTime(schedule.startAt)} - {formatTime(schedule.endAt)}
                </div>
              </div>

              {schedule.mentor && (
                <div className="mentor-info">
                  <div 
                    className="mentor-name"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${schedule.mentorId}`);
                    }}
                  >
                    Mentor: {schedule.mentor.mentorProfile?.fullName || schedule.mentor.email}
                  </div>
                  {schedule.mentor.mentorProfile?.expertise && 
                   schedule.mentor.mentorProfile.expertise.length > 0 && (
                    <div className="expertise-tags">
                      {schedule.mentor.mentorProfile.expertise.slice(0, 3).map((topic) => (
                        <span key={topic.id} className="expertise-tag">
                          {topic.name}
                        </span>
                      ))}
                      {schedule.mentor.mentorProfile.expertise.length > 3 && (
                        <span className="expertise-tag-more">
                          +{schedule.mentor.mentorProfile.expertise.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="schedule-actions" onClick={(e) => e.stopPropagation()}>
                {!isMentor && canBookSchedule(schedule) && (
                  <button 
                    className="btn btn-primary btn-small"
                    onClick={() => handleBookSchedule(schedule.id)}
                  >
                    Đặt lịch
                  </button>
                )}
                {isMentor && schedule.mentorId === user?.id && canDeleteSchedule(schedule) && (
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="pagination">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1 || pagination.totalPages <= 1}
              className="pagination-button"
            >
              ← Trước
            </button>
            <span className="pagination-info">
              Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.total} lịch)
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages || pagination.totalPages <= 1}
              className="pagination-button"
            >
              Sau →
            </button>
          </div>
        )}
        </>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={handleCloseBookingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Đặt lịch hẹn</h2>
              <button className="modal-close" onClick={handleCloseBookingModal}>×</button>
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
                onClick={handleCloseBookingModal}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmBooking}
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

export default ScheduleList;