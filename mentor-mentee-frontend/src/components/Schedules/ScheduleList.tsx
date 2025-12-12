import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleApi } from '../../services/scheduleApi';
import { bookingApi } from '../../services/bookingApi';
import { Schedule, ScheduleQueryParams } from '../../types/schedule';
import { useAuth } from '../../context/AuthContext';
import './ScheduleList.css';

const ScheduleList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ 
    topic: '', 
    description: '',
    startAt: '', 
    endAt: ''
  });
  const [filters, setFilters] = useState<ScheduleQueryParams>({ status: undefined });
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [showBookForm, setShowBookForm] = useState(false);
  const [selectedScheduleForBooking, setSelectedScheduleForBooking] = useState<Schedule | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'upcoming'>('upcoming');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const isMentor = user?.role === 'MENTOR';

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const response = isMentor 
        ? await scheduleApi.getMySchedules(filters)
        : await scheduleApi.getAllSchedules(filters);
      
      setSchedules(response.data);
    } catch (err: any) {
      // Error will be handled by ErrorDialog via axios interceptor
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, isMentor]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

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
    return [...filtered].sort((a, b) => {
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch này?')) return;
    try {
      await scheduleApi.deleteSchedule(id);
      loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể xóa lịch');
    }
  };

  const handleBookSchedule = (scheduleId: number) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      setSelectedScheduleForBooking(schedule);
      setShowBookForm(true);
      // Scroll to top to show the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfirmBook = async () => {
    if (!selectedScheduleForBooking) return;

    try {
      await bookingApi.createBooking({ 
        scheduleId: selectedScheduleForBooking.id, 
        notes: bookingNotes.trim() || undefined 
      });
      alert('Đặt lịch thành công! Chờ mentor xác nhận.');
      setShowBookForm(false);
      setBookingNotes('');
      setSelectedScheduleForBooking(null);
      loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể đặt lịch');
    }
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

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'AVAILABLE': 'Có thể đặt',
      'BOOKED': 'Đã đặt',
      'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Đang tải lịch...</p>
      </div>
    );
  }

  const filteredSchedules = getFilteredAndSortedSchedules();

  return (
    <div className="schedule-list-container">
      {/* Header */}
      <div className="page-header">
        <h1>{isMentor ? 'Lịch của tôi' : 'Lịch có sẵn'}</h1>
        {isMentor && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Hủy' : 'Tạo lịch mới'}
          </button>
        )}
      </div>

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
        </div>
      </div>

      {/* Book Schedule Form */}
      {showBookForm && selectedScheduleForBooking && !isMentor && (
        <div className="book-form">
          <h2>Đặt lịch: {selectedScheduleForBooking.topic}</h2>
          <div className="schedule-info">
            <p><strong>Mentor:</strong> {selectedScheduleForBooking.mentor?.mentorProfile?.fullName || selectedScheduleForBooking.mentor?.email}</p>
            <p><strong>Thời gian:</strong> {formatDate(selectedScheduleForBooking.startAt)} {formatTime(selectedScheduleForBooking.startAt)} - {formatTime(selectedScheduleForBooking.endAt)}</p>
            {selectedScheduleForBooking.description && (
              <p><strong>Mô tả:</strong> {selectedScheduleForBooking.description}</p>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleConfirmBook(); }}>
            <div className="form-group">
              <label>Ghi chú cho mentor (tùy chọn)</label>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Ví dụ: Tôi muốn học về React hooks..."
                rows={4}
                className="form-textarea"
              />
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowBookForm(false);
                  setBookingNotes('');
                  setSelectedScheduleForBooking(null);
                }}
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                Đặt lịch
              </button>
            </div>
          </form>
        </div>
      )}

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

      {/* Book Schedule Form */}
      {showBookForm && selectedScheduleForBooking && !isMentor && (
        <div className="book-form">
          <h2>Đặt lịch: {selectedScheduleForBooking.topic}</h2>
          <div className="schedule-info">
            <p><strong>Mentor:</strong> {selectedScheduleForBooking.mentor?.mentorProfile?.fullName || selectedScheduleForBooking.mentor?.email}</p>
            <p><strong>Thời gian:</strong> {formatDate(selectedScheduleForBooking.startAt)} {formatTime(selectedScheduleForBooking.startAt)} - {formatTime(selectedScheduleForBooking.endAt)}</p>
            {selectedScheduleForBooking.description && (
              <p><strong>Mô tả:</strong> {selectedScheduleForBooking.description}</p>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleConfirmBook(); }}>
            <div className="form-group">
              <label>Ghi chú cho mentor (tùy chọn)</label>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Ví dụ: Tôi muốn học về React hooks..."
                rows={4}
                className="form-textarea"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => {
                setShowBookForm(false);
                setBookingNotes('');
                setSelectedScheduleForBooking(null);
              }}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                Đặt lịch
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
        <div className="schedules-grid">
          {filteredSchedules.map((schedule) => (
            <div 
              key={schedule.id} 
              className="schedule-card"
              onClick={() => navigate(`/schedules/${schedule.id}`)}
            >
              <div className="schedule-header">
                <h3>{schedule.topic}</h3>
                <span className={`status-badge status-${schedule.status.toLowerCase()}`}>
                  {getStatusText(schedule.status)}
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
                {!isMentor && schedule.status === 'AVAILABLE' && (
                  <button 
                    className="btn btn-primary btn-small"
                    onClick={() => handleBookSchedule(schedule.id)}
                  >
                    Đặt lịch
                  </button>
                )}
                {isMentor && schedule.mentorId === user?.id && (
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ScheduleList;