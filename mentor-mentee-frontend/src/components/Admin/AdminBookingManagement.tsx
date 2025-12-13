import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { bookingApi } from '../../services/bookingApi';
import { Booking } from '../../types/booking';
import ConfirmDialog from '../Toast/ConfirmDialog';
import Toast, { ToastType } from '../Toast/Toast';
import './AdminBookingManagement.css';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminBookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  const API_URL = 'http://localhost:3000/api';

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      // Fetch all bookings (for admin, getMyBookings returns all bookings)
      const allBookingsData = await bookingApi.getMyBookings();
      let allBookings = allBookingsData;

      // Apply filters on frontend
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        allBookings = allBookings.filter((booking: Booking) => 
          booking.schedule?.topic?.toLowerCase().includes(search) ||
          booking.mentee?.email?.toLowerCase().includes(search) ||
          booking.schedule?.mentor?.email?.toLowerCase().includes(search) ||
          booking.notes?.toLowerCase().includes(search)
        );
      }

      if (statusFilter !== 'ALL') {
        allBookings = allBookings.filter((booking: Booking) => booking.status === statusFilter);
      }

      // Calculate pagination
      const total = allBookings.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      const paginatedBookings = allBookings.slice(start, end);

      setBookings(paginatedBookings);
      setPagination({
        ...pagination,
        total,
        totalPages,
      });
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setToast({
        show: true,
        message: 'Failed to fetch bookings',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = (bookingId: number) => {
    setBookingToDelete(bookingId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/bookings/${bookingToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setToast({
        show: true,
        message: 'Booking deleted successfully',
        type: 'success',
      });
      fetchBookings();
      setShowDetailModal(false);
    } catch (err: any) {
      console.error('Error deleting booking:', err);
      setToast({
        show: true,
        message: 'Failed to delete booking',
        type: 'error',
      });
    } finally {
      setShowConfirmDialog(false);
      setBookingToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setBookingToDelete(null);
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedBooking(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchBookings();
  };

  const getUserFullName = (user?: any) => {
    if (!user) return 'Unknown';
    
    // Check for mentor profile (both camelCase and lowercase)
    if (user.mentorProfile?.fullName || user.mentorprofile?.fullName) {
      return user.mentorProfile?.fullName || user.mentorprofile?.fullName;
    }
    
    // Check for mentee profile (both camelCase and lowercase)
    if (user.menteeProfile?.fullName || user.menteeprofile?.fullName) {
      return user.menteeProfile?.fullName || user.menteeprofile?.fullName;
    }
    
    // Fallback to email only if no profile name exists
    return user.email || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { text: string; class: string } } = {
      PENDING: { text: 'Chờ xác nhận', class: 'status-pending' },
      CONFIRMED: { text: 'Đã xác nhận', class: 'status-confirmed' },
      CANCELLED: { text: 'Đã hủy', class: 'status-cancelled' },
      COMPLETED: { text: 'Hoàn thành', class: 'status-completed' },
    };
    return badges[status] || { text: status, class: 'status-default' };
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && bookings.length === 0) {
    return <div className="admin-loading">Loading bookings...</div>;
  }

  return (
    <div className="admin-booking-management">
      <div className="admin-header">
        <h1>Booking Management</h1>
        <p>Manage all bookings in the system</p>
      </div>

      <div className="admin-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search bookings by topic, email, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPagination({ ...pagination, page: 1 });
              }}
              className="clear-button"
            >
              Clear
            </button>
          )}
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination({ ...pagination, page: 1 });
          }}
          className="status-filter"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mentee</th>
              <th>Mentor</th>
              <th>Topic</th>
              <th>Schedule Time</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  No bookings found
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{getUserFullName(booking.mentee)}</td>
                  <td>{getUserFullName(booking.schedule?.mentor)}</td>
                  <td className="booking-topic">{booking.schedule?.topic || 'N/A'}</td>
                  <td>{booking.schedule ? formatDateTime(booking.schedule.startAt) : 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(booking.status).class}`}>
                      {getStatusBadge(booking.status).text}
                    </span>
                  </td>
                  <td>{formatDateTime(booking.createdAt)}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleViewBooking(booking)}
                      className="action-button view-button"
                      title="View Details"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="action-button delete-button"
                      title="Delete Booking"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total} bookings)
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {showDetailModal && selectedBooking && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Booking #{selectedBooking.id}</h3>
                <div className="booking-meta">
                  <div className="meta-row">
                    <strong>Status:</strong>
                    <span className={`status-badge ${getStatusBadge(selectedBooking.status).class}`}>
                      {getStatusBadge(selectedBooking.status).text}
                    </span>
                  </div>
                  <div className="meta-row">
                    <strong>Mentee:</strong>
                    <span>
                      {getUserFullName(selectedBooking.mentee)} ({selectedBooking.mentee?.email})
                    </span>
                  </div>
                  {selectedBooking.schedule && (
                    <>
                      <div className="meta-row">
                        <strong>Mentor:</strong>
                        <span>
                          {getUserFullName(selectedBooking.schedule.mentor)} ({selectedBooking.schedule.mentor?.email})
                        </span>
                      </div>
                      <div className="meta-row">
                        <strong>Topic:</strong>
                        <span>{selectedBooking.schedule.topic}</span>
                      </div>
                      {selectedBooking.schedule.description && (
                        <div className="meta-row">
                          <strong>Description:</strong>
                          <span>{selectedBooking.schedule.description}</span>
                        </div>
                      )}
                      <div className="meta-row">
                        <strong>Schedule Time:</strong>
                        <span>
                          {formatDateTime(selectedBooking.schedule.startAt)} - {formatDateTime(selectedBooking.schedule.endAt)}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedBooking.notes && (
                    <div className="meta-row">
                      <strong>Notes:</strong>
                      <span>{selectedBooking.notes}</span>
                    </div>
                  )}
                  <div className="meta-row">
                    <strong>Created:</strong>
                    <span>{formatDateTime(selectedBooking.createdAt)}</span>
                  </div>
                  <div className="meta-row">
                    <strong>Updated:</strong>
                    <span>{formatDateTime(selectedBooking.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseModal} className="button button-secondary">
                Close
              </button>
              <button
                onClick={() => handleDeleteBooking(selectedBooking.id)}
                className="button button-danger"
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Delete Booking"
        message="Are you sure you want to delete this booking? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default AdminBookingManagement;
