import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../../services/bookingApi';
import { sessionApi } from '../../services/sessionApi';
import { Booking } from '../../types/booking';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../Toast/ConfirmDialog';
import ErrorDialog from '../Toast/ErrorDialog';
import './BookingList.css';

const BookingList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'upcoming'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showStartSessionConfirm, setShowStartSessionConfirm] = useState(false);
  const [showConfirmBookingDialog, setShowConfirmBookingDialog] = useState(false);
  const [showCancelBookingDialog, setShowCancelBookingDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [successDialog, setSuccessDialog] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const isMentor = user?.role === 'MENTOR';

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getMyBookings();
      setBookings(data);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
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

  const handleConfirmBooking = async () => {
    setShowConfirmBookingDialog(false);
    if (selectedBookingId === null) return;
    
    try {
      await bookingApi.confirmBooking(selectedBookingId);
      setSuccessDialog({ isOpen: true, message: 'Booking confirmed successfully!' });
      loadBookings();
    } catch (err: any) {
      setErrorDialog({ isOpen: true, message: err.response?.data?.error?.message || 'Failed to confirm booking' });
    }
  };

  const handleCancelBooking = async () => {
    setShowCancelBookingDialog(false);
    if (selectedBookingId === null) return;
    
    try {
      await bookingApi.cancelBooking(selectedBookingId);
      setSuccessDialog({ isOpen: true, message: 'Booking cancelled.' });
      loadBookings();
    } catch (err: any) {
      setErrorDialog({ isOpen: true, message: err.response?.data?.error?.message || 'Failed to cancel booking' });
    }
  };
  const handleStartSession = async () => {
    setShowStartSessionConfirm(false);
    if (selectedBookingId === null) return;
    
    try {
      await sessionApi.startSession({ bookingId: selectedBookingId });
      setSuccessDialog({ isOpen: true, message: 'Bắt đầu session thành công!' });
      setTimeout(() => navigate('/sessions'), 1500);
    } catch (err: any) {
      setErrorDialog({ isOpen: true, message: err.response?.data?.error?.message || 'Không thể bắt đầu session' });
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

  const filteredBookings = getFilteredAndSortedBookings();

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <h1>📅 {isMentor ? 'Booking Nhận Được' : 'Booking Của Tôi'}</h1>
      </div>

      {/* Search and Controls */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm booking..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <div className="sort-container" ref={filterDropdownRef}>
            <button 
              className="sort-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              Sắp xếp
            </button>
            {showFilters && (
              <div className="sort-menu">
                <button 
                  className={`sort-option ${sortBy === 'upcoming' ? 'active' : ''}`}
                  onClick={() => { setSortBy('upcoming'); setShowFilters(false); }}
                >
                  Sắp diễn ra
                </button>
                <button 
                  className={`sort-option ${sortBy === 'newest' ? 'active' : ''}`}
                  onClick={() => { setSortBy('newest'); setShowFilters(false); }}
                >
                  Mới nhất
                </button>
                <button 
                  className={`sort-option ${sortBy === 'oldest' ? 'active' : ''}`}
                  onClick={() => { setSortBy('oldest'); setShowFilters(false); }}
                >
                  Cũ nhất
                </button>
              </div>
            )}
          </div>
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
                <span className="booking-id">
                  {booking.schedule?.topic || 'Lịch không có tiêu đề'}
                </span>
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
                    <strong>Mentor:</strong>
                    <span>{booking.schedule?.mentor?.mentorProfile?.fullName || booking.schedule?.mentor?.email || 'Unknown'}</span>
                  </div>
                )}

                {booking.schedule?.topic && (
                  <div className="info-row">
                    <strong>Chủ đề:</strong>
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
                  <button className="confirm-btn-small" onClick={() => {
                    setSelectedBookingId(booking.id);
                    setShowConfirmBookingDialog(true);
                  }}>
                    ✓ Xác nhận
                  </button>
                )}

                {isMentor && booking.status === 'CONFIRMED' && !booking.session && (
                  <button className="confirm-btn-small" onClick={() => {
                    setSelectedBookingId(booking.id);
                    setShowStartSessionConfirm(true);
                  }}>
                    ▶️ Bắt đầu
                  </button>
                )}

                {booking.status === 'PENDING' && (
                  <button className="cancel-btn-small" onClick={() => {
                    setSelectedBookingId(booking.id);
                    setShowCancelBookingDialog(true);
                  }}>
                    ✖ Hủy
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
        message="Confirm this booking?"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmBooking}
        onCancel={() => setShowConfirmBookingDialog(false)}
        type="info"
      />

      {/* Confirm Dialog for Cancel Booking */}
      <ConfirmDialog
        isOpen={showCancelBookingDialog}
        title="Hủy Booking"
        message="Cancel this booking?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleCancelBooking}
        onCancel={() => setShowCancelBookingDialog(false)}
        type="danger"
      />

      {/* Success Dialog */}
      <ErrorDialog
        isOpen={successDialog.isOpen}
        message={successDialog.message}
        onClose={() => setSuccessDialog({ isOpen: false, message: '' })}
        type="success"
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

export default BookingList;
