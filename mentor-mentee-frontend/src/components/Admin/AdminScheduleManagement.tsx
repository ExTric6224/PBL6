import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { scheduleApi } from '../../services/scheduleApi';
import { Schedule } from '../../types/schedule';
import ConfirmDialog from '../Toast/ConfirmDialog';
import Toast, { ToastType } from '../Toast/Toast';
import './AdminScheduleManagement.css';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminScheduleManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);
  const [editFormData, setEditFormData] = useState({
    topic: '',
    description: '',
    startAt: '',
    endAt: '',
    capacity: 1,
    status: '',
  });
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  const API_URL = 'http://localhost:3000/api';

  useEffect(() => {
    fetchSchedules();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);

      // Fetch all schedules (backend returns all schedules without pagination)
      const response = await scheduleApi.getAllSchedules({
        status: statusFilter !== 'ALL' ? statusFilter as any : undefined,
      });

      // Backend returns array directly, not PaginatedResponse
      let allSchedules = Array.isArray(response) ? response : (response.data || []);

      // Apply search filter on frontend
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        allSchedules = allSchedules.filter((schedule: Schedule) => 
          schedule.topic?.toLowerCase().includes(search) ||
          schedule.description?.toLowerCase().includes(search) ||
          schedule.mentor?.email?.toLowerCase().includes(search) ||
          schedule.mentor?.mentorProfile?.fullName?.toLowerCase().includes(search)
        );
      }

      // Calculate pagination on filtered data
      const total = allSchedules.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      const paginatedSchedules = allSchedules.slice(start, end);

      setSchedules(paginatedSchedules);
      setPagination({
        ...pagination,
        total,
        totalPages,
      });
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setToast({
        show: true,
        message: 'Tải danh sách lịch thất bại',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = (scheduleId: number) => {
    setScheduleToDelete(scheduleId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;

    try {
      await scheduleApi.deleteSchedule(scheduleToDelete);

      setToast({
        show: true,
        message: 'Xóa lịch thành công',
        type: 'success',
      });
      fetchSchedules();
      setShowDetailModal(false);
    } catch (err: any) {
      console.error('Error deleting schedule:', err);
      setToast({
        show: true,
        message: err.response?.data?.error || 'Xóa lịch thất bại',
        type: 'error',
      });
    } finally {
      setShowConfirmDialog(false);
      setScheduleToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setScheduleToDelete(null);
  };

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedSchedule(null);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setScheduleToEdit(schedule);
    setEditFormData({
      topic: schedule.topic,
      description: schedule.description || '',
      startAt: new Date(schedule.startAt).toISOString().slice(0, 16),
      endAt: new Date(schedule.endAt).toISOString().slice(0, 16),
      capacity: schedule.capacity,
      status: schedule.status,
    });
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setScheduleToEdit(null);
    setEditFormData({
      topic: '',
      description: '',
      startAt: '',
      endAt: '',
      capacity: 1,
      status: '',
    });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleToEdit) return;

    try {
      const updateData: any = {
        topic: editFormData.topic,
        description: editFormData.description || undefined,
        startAt: new Date(editFormData.startAt).toISOString(),
        endAt: new Date(editFormData.endAt).toISOString(),
        // Không gửi capacity vì luôn là 1
        status: editFormData.status as 'AVAILABLE' | 'BOOKED' | 'CANCELLED',
      };

      await scheduleApi.updateSchedule(scheduleToEdit.id, updateData);

      setToast({
        show: true,
        message: 'Cập nhật lịch thành công',
        type: 'success',
      });
      fetchSchedules();
      handleCloseEditModal();
    } catch (err: any) {
      console.error('Error updating schedule:', err);
      // Handle error response properly
      let errorMessage = 'Cập nhật lịch thất bại';
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
    fetchSchedules();
  };

  const getMentorName = (schedule: Schedule) => {
    if (!schedule.mentor) return 'Unknown';
    return schedule.mentor.mentorProfile?.fullName || schedule.mentor.email || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { text: string; class: string } } = {
      AVAILABLE: { text: 'Có sẵn', class: 'status-available' },
      BOOKED: { text: 'Đã đặt', class: 'status-booked' },
      CANCELLED: { text: 'Đã hủy', class: 'status-cancelled' },
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

  if (loading && schedules.length === 0) {
    return <div className="admin-loading">Đang tải lịch...</div>;
  }

  return (
    <div className="admin-schedule-management">
      <div className="admin-header">
        <h1>Quản lý lịch</h1>
        <p>Quản lý tất cả lịch trong hệ thống</p>
      </div>

      <div className="admin-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm lịch theo chủ đề, mô tả, hoặc mentor..."
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
          <option value="AVAILABLE">Có sẵn</option>
          <option value="BOOKED">Đã đặt</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      <div className="schedules-table-container">
        <table className="schedules-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mentor</th>
              <th>Chủ đề</th>
              <th>Thời gian bắt đầu</th>
              <th>Thời gian kết thúc</th>
              <th>Trạng thái</th>
              <th>Số chỗ</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  Không tìm thấy lịch
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>{schedule.id}</td>
                  <td>{getMentorName(schedule)}</td>
                  <td className="schedule-topic">{schedule.topic}</td>
                  <td>{formatDateTime(schedule.startAt)}</td>
                  <td>{formatDateTime(schedule.endAt)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(schedule.status).class}`}>
                      {getStatusBadge(schedule.status).text}
                    </span>
                  </td>
                  <td>{schedule.capacity}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleViewSchedule(schedule)}
                      className="action-button view-button"
                      title="Xem chi tiết"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => handleEditSchedule(schedule)}
                      className="action-button edit-button"
                      title="Sửa lịch"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="action-button delete-button"
                      title="Xóa lịch"
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

      {pagination.total > 0 && (
        <div className="pagination">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1 || pagination.totalPages <= 1}
            className="pagination-button"
          >
            Trước
          </button>
          <span className="pagination-info">
            Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.total} lịch)
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages || pagination.totalPages <= 1}
            className="pagination-button"
          >
            Sau
          </button>
        </div>
      )}

      {showDetailModal && selectedSchedule && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết lịch</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Lịch #{selectedSchedule.id}</h3>
                <div className="schedule-meta">
                  <div className="meta-row">
                    <strong>Trạng thái:</strong>
                    <span className={`status-badge ${getStatusBadge(selectedSchedule.status).class}`}>
                      {getStatusBadge(selectedSchedule.status).text}
                    </span>
                  </div>
                  <div className="meta-row">
                    <strong>Mentor:</strong>
                    <span>
                      {getMentorName(selectedSchedule)} ({selectedSchedule.mentor?.email})
                    </span>
                  </div>
                  <div className="meta-row">
                    <strong>Chủ đề:</strong>
                    <span>{selectedSchedule.topic}</span>
                  </div>
                  {selectedSchedule.description && (
                    <div className="meta-row">
                      <strong>Mô tả:</strong>
                      <span>{selectedSchedule.description}</span>
                    </div>
                  )}
                  <div className="meta-row">
                    <strong>Thời gian bắt đầu:</strong>
                    <span>{formatDateTime(selectedSchedule.startAt)}</span>
                  </div>
                  <div className="meta-row">
                    <strong>Thời gian kết thúc:</strong>
                    <span>{formatDateTime(selectedSchedule.endAt)}</span>
                  </div>
                  <div className="meta-row">
                    <strong>Số chỗ:</strong>
                    <span>{selectedSchedule.capacity}</span>
                  </div>
                  <div className="meta-row">
                    <strong>Ngày tạo:</strong>
                    <span>{formatDateTime(selectedSchedule.createdAt)}</span>
                  </div>
                  {selectedSchedule.updatedAt && (
                    <div className="meta-row">
                      <strong>Cập nhật:</strong>
                      <span>{formatDateTime(selectedSchedule.updatedAt)}</span>
                    </div>
                  )}
                  {selectedSchedule.mentor?.mentorProfile && (
                    <>
                      <div className="meta-row">
                        <strong>Giới thiệu Mentor:</strong>
                        <span>{selectedSchedule.mentor.mentorProfile.bio}</span>
                      </div>
                      <div className="meta-row">
                        <strong>Kinh nghiệm:</strong>
                        <span>{selectedSchedule.mentor.mentorProfile.experience} năm</span>
                      </div>
                      {selectedSchedule.mentor.mentorProfile.expertise && selectedSchedule.mentor.mentorProfile.expertise.length > 0 && (
                        <div className="meta-row">
                          <strong>Chuyên môn:</strong>
                          <div className="expertise-tags">
                            {selectedSchedule.mentor.mentorProfile.expertise.map((topic, index) => (
                              <span key={index} className="expertise-tag">
                                {topic.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseModal} className="button button-secondary">
                Đóng
              </button>
              <button
                onClick={() => handleEditSchedule(selectedSchedule)}
                className="button button-primary"
              >
                Sửa lịch
              </button>
              <button
                onClick={() => handleDeleteSchedule(selectedSchedule.id)}
                className="button button-danger"
              >
                Xóa lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && scheduleToEdit && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa lịch</h2>
              <button onClick={handleCloseEditModal} className="close-button">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="edit-topic">Chủ đề *</label>
                  <input
                    id="edit-topic"
                    type="text"
                    value={editFormData.topic}
                    onChange={(e) => setEditFormData({ ...editFormData, topic: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Nhập chủ đề lịch"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-description">Mô tả</label>
                  <textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    className="form-textarea"
                    placeholder="Nhập mô tả lịch"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-start">Thời gian bắt đầu *</label>
                    <input
                      id="edit-start"
                      type="datetime-local"
                      value={editFormData.startAt}
                      onChange={(e) => setEditFormData({ ...editFormData, startAt: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-end">Thời gian kết thúc *</label>
                    <input
                      id="edit-end"
                      type="datetime-local"
                      value={editFormData.endAt}
                      onChange={(e) => setEditFormData({ ...editFormData, endAt: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-status">Trạng thái *</label>
                    <select
                      id="edit-status"
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      required
                      className="form-select"
                    >
                      <option value="AVAILABLE">Có sẵn</option>
                      <option value="BOOKED">Đã đặt</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>
                </div>
                <div className="schedule-meta-info">
                  <p><strong>Mentor:</strong> {getMentorName(scheduleToEdit)}</p>
                  <p><strong>Ngày tạo:</strong> {formatDateTime(scheduleToEdit.createdAt)}</p>
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
        title="Xóa lịch"
        message="Bạn có chắc chắn muốn xóa lịch này? Hành động này không thể hoàn tác và sẽ xóa cả các đặt lịch và phiên liên quan."
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

export default AdminScheduleManagement;
