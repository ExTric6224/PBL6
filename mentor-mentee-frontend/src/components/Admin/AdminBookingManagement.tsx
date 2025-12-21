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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    notes: '',
  });
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
        message: 'Tải danh sách đặt lịch thất bại',
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
        message: 'Xóa đặt lịch thành công',
        type: 'success',
      });
      fetchBookings();
      setShowDetailModal(false);
    } catch (err: any) {
      console.error('Error deleting booking:', err);
      setToast({
        show: true,
        message: 'Xóa đặt lịch thất bại',
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

  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setEditFormData({
      status: booking.status,
      notes: booking.notes || '',
    });
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setBookingToEdit(null);
    setEditFormData({
      status: '',
      notes: '',
    });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingToEdit) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `${API_URL}/bookings/${bookingToEdit.id}`,
        {
          status: editFormData.status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
          notes: editFormData.notes || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setToast({
        show: true,
        message: 'Cập nhật đặt lịch thành công',
        type: 'success',
      });
      fetchBookings();
      handleCloseEditModal();
    } catch (err: any) {
      console.error('Error updating booking:', err);
      // Handle error response properly
      let errorMessage = 'Cập nhật đặt lịch thất bại';
      if (err.response?.data?.error) {
        // If error is an object, extract message
        if (typeof err.response.data.error === 'object') {
          errorMessage = err.response.data.error.message || JSON.stringify(err.response.data.error);
        } else {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setToast({
        show: true,
        message: errorMessage,
        type: 'error',
      });
    }
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
    return <div className="admin-loading">Đang tải đặt lịch...</div>;
  }

  return (
    <div className="admin-booking-management">
      <div className="admin-header">
        <h1>Quản lý đặt lịch</h1>
        <p>Quản lý tất cả đặt lịch trong hệ thống</p>
      </div>

      <div className="admin-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm đặt lịch theo chủ đề, email, hoặc ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Tìm kiếm
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
              Xóa
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
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="COMPLETED">Hoàn thành</option>
        </select>
      </div>

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mentee</th>
              <th>Mentor</th>
              <th>Chủ đề</th>
              <th>Thời gian lịch</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  Không tìm thấy đặt lịch
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
                      title="Xem chi tiết"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="action-button edit-button"
                      title="Sửa đặt lịch"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="action-button delete-button"
                      title="Xóa đặt lịch"
                    >
                      Xóa
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
            Trước
          </button>
          <span className="pagination-info">
            Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.total} đặt lịch)
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            Sau
          </button>
        </div>
      )}

      {showDetailModal && selectedBooking && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đặt lịch</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Đặt lịch #{selectedBooking.id}</h3>
                <div className="booking-meta">
                  <div className="meta-row">
                    <strong>Trạng thái:</strong>
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
                        <strong>Chủ đề:</strong>
                        <span>{selectedBooking.schedule.topic}</span>
                      </div>
                      {selectedBooking.schedule.description && (
                        <div className="meta-row">
                          <strong>Mô tả:</strong>
                          <span>{selectedBooking.schedule.description}</span>
                        </div>
                      )}
                      <div className="meta-row">
                        <strong>Thời gian lịch:</strong>
                        <span>
                          {formatDateTime(selectedBooking.schedule.startAt)} - {formatDateTime(selectedBooking.schedule.endAt)}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedBooking.notes && (
                    <div className="meta-row">
                      <strong>Ghi chú:</strong>
                      <span>{selectedBooking.notes}</span>
                    </div>
                  )}
                  <div className="meta-row">
                    <strong>Ngày tạo:</strong>
                    <span>{formatDateTime(selectedBooking.createdAt)}</span>
                  </div>
                  <div className="meta-row">
                    <strong>Cập nhật:</strong>
                    <span>{formatDateTime(selectedBooking.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseModal} className="button button-secondary">
                Đóng
              </button>
              <button
                onClick={() => handleEditBooking(selectedBooking)}
                className="button button-primary"
              >
                Sửa đặt lịch
              </button>
              <button
                onClick={() => handleDeleteBooking(selectedBooking.id)}
                className="button button-danger"
              >
                Xóa đặt lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && bookingToEdit && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa đặt lịch</h2>
              <button onClick={handleCloseEditModal} className="close-button">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="edit-status">Trạng thái *</label>
                  <select
                    id="edit-status"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    required
                    className="form-select"
                  >
                    <option value="PENDING">Chờ xác nhận</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="COMPLETED">Hoàn thành</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-notes">Ghi chú</label>
                  <textarea
                    id="edit-notes"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    rows={5}
                    className="form-textarea"
                    placeholder="Thêm ghi chú đặt lịch..."
                  />
                </div>
                <div className="booking-meta-info">
                  <p><strong>Mentee:</strong> {getUserFullName(bookingToEdit.mentee)}</p>
                  <p><strong>Mentor:</strong> {getUserFullName(bookingToEdit.schedule?.mentor)}</p>
                  <p><strong>Chủ đề:</strong> {bookingToEdit.schedule?.topic || 'N/A'}</p>
                  <p><strong>Lịch:</strong> {bookingToEdit.schedule ? formatDateTime(bookingToEdit.schedule.startAt) : 'N/A'}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={handleCloseEditModal} className="button button-secondary">
                  Hủy
                </button>
                <button type="submit" className="button button-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Xóa đặt lịch"
        message="Bạn có chắc chắn muốn xóa đặt lịch này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
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
