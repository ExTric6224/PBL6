import React, { useState, useEffect, useCallback } from 'react';
import { bookingApi } from '../../services/bookingApi';
import { Booking } from '../../types/booking';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './BookingList.css';

const BookingList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <h1>📅 {isMentor ? 'My Bookings (Received)' : 'My Bookings'}</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">No bookings yet.</div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => (
            <div key={booking.id} className={`booking-card ${booking.status.toLowerCase()}`}>
              <div className="booking-header">
                <span className="booking-id">Booking #{booking.id}</span>
                <span className={`booking-status ${booking.status.toLowerCase()}`}>
                  {booking.status}
                </span>
              </div>

              <div className="booking-info">
                {isMentor ? (
                  <div className="info-row">
                    <strong>Mentee:</strong>
                    <span>{booking.mentee?.email || 'Unknown'}</span>
                  </div>
                ) : (
                  <div className="info-row">
                    <strong>Mentor:</strong>
                    <span>{booking.schedule?.mentor?.email || 'Unknown'}</span>
                  </div>
                )}

                <div className="info-row">
                  <strong>🕒 Start:</strong>
                  <span>{formatDateTime(booking.schedule?.startTime || '')}</span>
                </div>

                <div className="info-row">
                  <strong>🕒 End:</strong>
                  <span>{formatDateTime(booking.schedule?.endTime || '')}</span>
                </div>

                <div className="info-row">
                  <strong>Created:</strong>
                  <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                </div>

                {booking.notes && (
                  <div className="booking-notes">
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}
              </div>

              <div className="booking-actions">
                {isMentor && booking.status === 'PENDING' && (
                  <button className="confirm-btn" onClick={() => handleConfirmBooking(booking.id)}>
                    ✓ Confirm
                  </button>
                )}

                {booking.status === 'PENDING' && (
                  <button className="cancel-btn" onClick={() => handleCancelBooking(booking.id)}>
                    ✖ Cancel
                  </button>
                )}

                {!isMentor && booking.status === 'COMPLETED' && (
                  <button className="feedback-btn" onClick={() => handleGiveFeedback(booking)}>
                    ⭐ Give Feedback
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
