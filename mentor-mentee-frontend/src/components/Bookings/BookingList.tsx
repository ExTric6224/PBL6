import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../../services/bookingApi';
import { Booking } from '../../types/booking';
import { useAuth } from '../../context/AuthContext';
import './BookingList.css';

const BookingList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'upcoming'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const isMentor = user?.role === 'MENTOR';

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getMyBookings();
      setBookings(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  // Filter and sort bookings
  const getFilteredAndSortedBookings = () => {
    let filtered = bookings;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.schedule?.topic?.toLowerCase().includes(query) ||
        booking.schedule?.description?.toLowerCase().includes(query) ||
        booking.schedule?.mentor?.email?.toLowerCase().includes(query) ||
        booking.schedule?.mentor?.mentorProfile?.fullName?.toLowerCase().includes(query) ||
        booking.mentee?.email?.toLowerCase().includes(query) ||
        booking.mentee?.menteeProfile?.fullName?.toLowerCase().includes(query) ||
        booking.notes?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(booking => booking.status === filterStatus);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'upcoming':
          return new Date(a.schedule?.startAt || 0).getTime() - new Date(b.schedule?.startAt || 0).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  };

  const handleConfirmBooking = async (id: number) => {
    if (!window.confirm('Confirm this booking?')) return;
    try {
      await bookingApi.confirmBooking(id);
      alert('Booking confirmed successfully!');
      loadBookings();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to confirm booking');
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingApi.cancelBooking(id);
      alert('Booking cancelled.');
      loadBookings();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel booking');
    }
  };

  const handleGiveFeedback = (booking: Booking) => {
    // Navigate to feedback page with booking info
    navigate('/feedback/create', { state: { booking } });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const filteredBookings = getFilteredAndSortedBookings();

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <h1>📅 {isMentor ? 'Booking Nhận Được' : 'Booking Của Tôi'}</h1>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-section">
        {/* Search Bar */}
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm booking theo tên, chủ đề, ghi chú..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              ✖
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="status-filter">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-select"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">⏳ Chờ xác nhận</option>
            <option value="CONFIRMED">✅ Đã xác nhận</option>
            <option value="COMPLETED">🎉 Hoàn thành</option>
            <option value="CANCELLED">❌ Đã hủy</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="filter-container" ref={filterDropdownRef}>
          <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
            🔽 Sắp xếp
          </button>
          {showFilters && (
            <div className="filter-dropdown">
              <div className="filter-option" onClick={() => { setSortBy('newest'); setShowFilters(false); }}>
                <span className={`option-radio ${sortBy === 'newest' ? 'active' : ''}`}>
                  {sortBy === 'newest' ? '●' : '○'}
                </span>
                <span>Mới nhất</span>
              </div>
              <div className="filter-option" onClick={() => { setSortBy('oldest'); setShowFilters(false); }}>
                <span className={`option-radio ${sortBy === 'oldest' ? 'active' : ''}`}>
                  {sortBy === 'oldest' ? '●' : '○'}
                </span>
                <span>Cũ nhất</span>
              </div>
              <div className="filter-option" onClick={() => { setSortBy('upcoming'); setShowFilters(false); }}>
                <span className={`option-radio ${sortBy === 'upcoming' ? 'active' : ''}`}>
                  {sortBy === 'upcoming' ? '●' : '○'}
                </span>
                <span>Sắp diễn ra</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          {searchQuery || filterStatus !== 'ALL' ? 'Không tìm thấy booking phù hợp' : 'Chưa có booking nào'}
        </div>
      ) : (
        <div className="bookings-grid">
          {filteredBookings.map((booking) => (
            <div 
              key={booking.id} 
              className={`booking-card ${booking.status.toLowerCase()}`}
              onClick={() => navigate(`/bookings/${booking.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="booking-header">
                <span className="booking-id">Booking #{booking.id}</span>
                <span className={`booking-status ${booking.status.toLowerCase()}`}>
                  {booking.status === 'PENDING' && '⏳ Chờ xác nhận'}
                  {booking.status === 'CONFIRMED' && '✅ Đã xác nhận'}
                  {booking.status === 'COMPLETED' && '🎉 Hoàn thành'}
                  {booking.status === 'CANCELLED' && '❌ Đã hủy'}
                </span>
              </div>

              <div className="booking-info">
                {isMentor ? (
                  <div 
                    className="info-row clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${booking.menteeId}`);
                    }}
                    title="Xem profile mentee"
                  >
                    <strong>👩‍🎓 Mentee:</strong>
                    <span>{booking.mentee?.menteeProfile?.fullName || booking.mentee?.email || 'Unknown'}</span>
                  </div>
                ) : (
                  <div 
                    className="info-row clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${booking.schedule?.mentorId}`);
                    }}
                    title="Xem profile mentor"
                  >
                    <strong>�‍🏫 Mentor:</strong>
                    <span>{booking.schedule?.mentor?.mentorProfile?.fullName || booking.schedule?.mentor?.email || 'Unknown'}</span>
                  </div>
                )}

                {booking.schedule?.topic && (
                  <div className="info-row">
                    <strong>� Chủ đề:</strong>
                    <span>{booking.schedule.topic}</span>
                  </div>
                )}

                <div className="info-row">
                  <strong>🕒 Thời gian:</strong>
                  <span>{formatDateTime(booking.schedule?.startAt || '')}</span>
                </div>

                {booking.notes && (
                  <div className="booking-notes">
                    <strong>💬 Ghi chú:</strong> {booking.notes.length > 100 ? booking.notes.substring(0, 100) + '...' : booking.notes}
                  </div>
                )}
              </div>

              <div className="booking-actions-quick" onClick={(e) => e.stopPropagation()}>
                {isMentor && booking.status === 'PENDING' && (
                  <button className="confirm-btn-small" onClick={() => handleConfirmBooking(booking.id)}>
                    ✓ Xác nhận
                  </button>
                )}

                {booking.status === 'PENDING' && (
                  <button className="cancel-btn-small" onClick={() => handleCancelBooking(booking.id)}>
                    ✖ Hủy
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

export default BookingList;
