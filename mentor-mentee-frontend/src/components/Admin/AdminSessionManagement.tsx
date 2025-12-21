import React, { useEffect, useState } from 'react';
import { sessionApi } from '../../services/sessionApi';
import { Session } from '../../types/session';
import ConfirmDialog from '../Toast/ConfirmDialog';
import Toast, { ToastType } from '../Toast/Toast';
import './AdminSessionManagement.css';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminSessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    notes: '',
  });
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    fetchSessions();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);

      // Fetch all sessions (for admin, getMySessions returns all sessions)
      const allSessionsData = await sessionApi.getMySessions();
      let allSessions = allSessionsData;

      // Apply filters on frontend
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        allSessions = allSessions.filter((session: any) => 
          session.booking?.schedule?.topic?.toLowerCase().includes(search) ||
          session.user_session_mentorIdTouser?.email?.toLowerCase().includes(search) ||
          session.user_session_mentorIdTouser?.mentorprofile?.fullName?.toLowerCase().includes(search) ||
          session.user_session_menteeIdTouser?.email?.toLowerCase().includes(search) ||
          session.user_session_menteeIdTouser?.menteeprofile?.fullName?.toLowerCase().includes(search) ||
          session.notes?.toLowerCase().includes(search)
        );
      }

      if (statusFilter !== 'ALL') {
        allSessions = allSessions.filter((session: Session) => session.status === statusFilter);
      }

      // Calculate pagination
      const total = allSessions.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      const paginatedSessions = allSessions.slice(start, end);

      setSessions(paginatedSessions);
      setPagination({
        ...pagination,
        total,
        totalPages,
      });
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setToast({
        show: true,
        message: 'Tải danh sách phiên thất bại',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = (sessionId: number) => {
    setSessionToDelete(sessionId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;

    try {
      await sessionApi.deleteSession(sessionToDelete);

      setToast({
        show: true,
        message: 'Xóa phiên thành công',
        type: 'success',
      });
      fetchSessions();
      setShowDetailModal(false);
    } catch (err: any) {
      console.error('Error deleting session:', err);
      setToast({
        show: true,
        message: err.response?.data?.error || 'Xóa phiên thất bại',
        type: 'error',
      });
    } finally {
      setShowConfirmDialog(false);
      setSessionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setSessionToDelete(null);
  };

  const handleViewSession = (session: Session) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedSession(null);
  };

  const handleEditSession = (session: Session) => {
    setSessionToEdit(session);
    setEditFormData({
      status: session.status,
      notes: session.notes || '',
    });
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSessionToEdit(null);
    setEditFormData({
      status: '',
      notes: '',
    });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToEdit) return;

    try {
      const token = localStorage.getItem('accessToken');
      const updateData: any = {
        status: editFormData.status,
        notes: editFormData.notes || null,
      };

      await sessionApi.updateSession(sessionToEdit.id, updateData);

      setToast({
        show: true,
        message: 'Cập nhật phiên thành công',
        type: 'success',
      });
      fetchSessions();
      handleCloseEditModal();
    } catch (err: any) {
      console.error('Error updating session:', err);
      // Handle error response properly
      let errorMessage = 'Cập nhật phiên thất bại';
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
    fetchSessions();
  };

  const getUserFullName = (user?: any, profile?: any) => {
    if (!user) return 'Unknown';
    if (profile?.fullName) {
      return profile.fullName;
    }
    return user.email || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { text: string; class: string } } = {
      SCHEDULED: { text: 'Đã lên lịch', class: 'status-scheduled' },
      IN_PROGRESS: { text: 'Đang diễn ra', class: 'status-in-progress' },
      COMPLETED: { text: 'Hoàn thành', class: 'status-completed' },
      CANCELLED: { text: 'Đã hủy', class: 'status-cancelled' },
    };
    return badges[status] || { text: status, class: 'status-default' };
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && sessions.length === 0) {
    return <div className="admin-loading">Đang tải phiên...</div>;
  }

  return (
    <div className="admin-session-management">
      <div className="admin-header">
        <h1>Quản lý phiên</h1>
        <p>Quản lý tất cả phiên trong hệ thống</p>
      </div>

      <div className="admin-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm phiên theo chủ đề, mentor, mentee, hoặc ghi chú..."
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
          <option value="SCHEDULED">Đã lên lịch</option>
          <option value="IN_PROGRESS">Đang diễn ra</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      <div className="sessions-table-container">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mentor</th>
              <th>Mentee</th>
              <th>Chủ đề</th>
              <th>Bắt đầu lúc</th>
              <th>Kết thúc lúc</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  Không tìm thấy phiên
                </td>
              </tr>
            ) : (
              sessions.map((session: any) => (
                <tr key={session.id}>
                  <td>{session.id}</td>
                  <td>{getUserFullName(session.user_session_mentorIdTouser, session.user_session_mentorIdTouser?.mentorprofile)}</td>
                  <td>{getUserFullName(session.user_session_menteeIdTouser, session.user_session_menteeIdTouser?.menteeprofile)}</td>
                  <td className="session-topic">{session.booking?.schedule?.topic || 'N/A'}</td>
                  <td>{formatDateTime(session.startedAt)}</td>
                  <td>{formatDateTime(session.endedAt)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(session.status).class}`}>
                      {getStatusBadge(session.status).text}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleViewSession(session)}
                      className="action-button view-button"
                      title="Xem chi tiết"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => handleEditSession(session)}
                      className="action-button edit-button"
                      title="Sửa phiên"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="action-button delete-button"
                      title="Xóa phiên"
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
            Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.total} phiên)
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

      {showDetailModal && selectedSession && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết phiên</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Phiên #{selectedSession.id}</h3>
                <div className="session-meta">
                  <div className="meta-row">
                    <strong>Trạng thái:</strong>
                    <span className={`status-badge ${getStatusBadge(selectedSession.status).class}`}>
                      {getStatusBadge(selectedSession.status).text}
                    </span>
                  </div>
                  <div className="meta-row">
                    <strong>Mentor:</strong>
                    <span>
                      {getUserFullName((selectedSession as any).user_session_mentorIdTouser, (selectedSession as any).user_session_mentorIdTouser?.mentorprofile)} ({(selectedSession as any).user_session_mentorIdTouser?.email})
                    </span>
                  </div>
                  <div className="meta-row">
                    <strong>Mentee:</strong>
                    <span>
                      {getUserFullName((selectedSession as any).user_session_menteeIdTouser, (selectedSession as any).user_session_menteeIdTouser?.menteeprofile)} ({(selectedSession as any).user_session_menteeIdTouser?.email})
                    </span>
                  </div>
                  {selectedSession.booking?.schedule && (
                    <>
                      <div className="meta-row">
                        <strong>Chủ đề:</strong>
                        <span>{selectedSession.booking.schedule.topic}</span>
                      </div>
                      {selectedSession.booking.schedule.description && (
                        <div className="meta-row">
                          <strong>Mô tả lịch:</strong>
                          <span>{selectedSession.booking.schedule.description}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="meta-row">
                    <strong>Bắt đầu lúc:</strong>
                    <span>{formatDateTime(selectedSession.startedAt)}</span>
                  </div>
                  {selectedSession.endedAt && (
                    <div className="meta-row">
                      <strong>Kết thúc lúc:</strong>
                      <span>{formatDateTime(selectedSession.endedAt)}</span>
                    </div>
                  )}
                  {selectedSession.autoStarted && (
                    <div className="meta-row">
                      <strong>Tự động bắt đầu:</strong>
                      <span className="auto-badge">Có</span>
                    </div>
                  )}
                  {selectedSession.autoEnded && (
                    <div className="meta-row">
                      <strong>Tự động kết thúc:</strong>
                      <span className="auto-badge">Có</span>
                    </div>
                  )}
                  {selectedSession.notes && (
                    <div className="meta-row">
                      <strong>Ghi chú:</strong>
                      <span>{selectedSession.notes}</span>
                    </div>
                  )}
                  {selectedSession.feedback && (
                    <div className="feedback-section">
                      <h4>Đánh giá</h4>
                      <div className="meta-row">
                        <strong>Xếp hạng:</strong>
                        <span className="rating">{'⭐'.repeat(selectedSession.feedback.rating)}</span>
                      </div>
                      {selectedSession.feedback.comment && (
                        <div className="meta-row">
                          <strong>Bình luận:</strong>
                          <span>{selectedSession.feedback.comment}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseModal} className="button button-secondary">
                Đóng
              </button>
              <button
                onClick={() => handleEditSession(selectedSession)}
                className="button button-primary"
              >
                Sửa phiên
              </button>
              <button
                onClick={() => handleDeleteSession(selectedSession.id)}
                className="button button-danger"
              >
                Xóa phiên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && sessionToEdit && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa phiên</h2>
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
                    <option value="IN_PROGRESS">Đang diễn ra</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
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
                    placeholder="Thêm ghi chú phiên..."
                  />
                </div>
                <div className="session-meta-info">
                  <p><strong>Mentor:</strong> {getUserFullName((sessionToEdit as any).user_session_mentorIdTouser, (sessionToEdit as any).user_session_mentorIdTouser?.mentorprofile)}</p>
                  <p><strong>Mentee:</strong> {getUserFullName((sessionToEdit as any).user_session_menteeIdTouser, (sessionToEdit as any).user_session_menteeIdTouser?.menteeprofile)}</p>
                  <p><strong>Chủ đề:</strong> {(sessionToEdit as any).booking?.schedule?.topic || 'N/A'}</p>
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
        title="Xóa phiên"
        message="Bạn có chắc chắn muốn xóa phiên này? Hành động này không thể hoàn tác và sẽ xóa cả đánh giá liên quan."
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

export default AdminSessionManagement;
