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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);
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

      // Fetch all schedules with pagination
      const response = await scheduleApi.getAllSchedules({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== 'ALL' ? statusFilter as any : undefined,
      });

      let allSchedules = response.data;

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

      setSchedules(allSchedules);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setToast({
        show: true,
        message: 'Failed to fetch schedules',
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
        message: 'Schedule deleted successfully',
        type: 'success',
      });
      fetchSchedules();
      setShowDetailModal(false);
    } catch (err: any) {
      console.error('Error deleting schedule:', err);
      setToast({
        show: true,
        message: err.response?.data?.error || 'Failed to delete schedule',
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
    return <div className="admin-loading">Loading schedules...</div>;
  }

  return (
    <div className="admin-schedule-management">
      <div className="admin-header">
        <h1>Schedule Management</h1>
        <p>Manage all schedules in the system</p>
      </div>

      <div className="admin-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search schedules by topic, description, or mentor..."
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
          <option value="AVAILABLE">Available</option>
          <option value="BOOKED">Booked</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="schedules-table-container">
        <table className="schedules-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mentor</th>
              <th>Topic</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  No schedules found
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
                      title="View Details"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="action-button delete-button"
                      title="Delete Schedule"
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
            Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total} schedules)
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

      {showDetailModal && selectedSchedule && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Details</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Schedule #{selectedSchedule.id}</h3>
                <div className="schedule-meta">
                  <div className="meta-row">
                    <strong>Status:</strong>
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
                    <strong>Topic:</strong>
                    <span>{selectedSchedule.topic}</span>
                  </div>
                  {selectedSchedule.description && (
                    <div className="meta-row">
                      <strong>Description:</strong>
                      <span>{selectedSchedule.description}</span>
                    </div>
                  )}
                  <div className="meta-row">
                    <strong>Start Time:</strong>
                    <span>{formatDateTime(selectedSchedule.startAt)}</span>
                  </div>
                  <div className="meta-row">
                    <strong>End Time:</strong>
                    <span>{formatDateTime(selectedSchedule.endAt)}</span>
                  </div>
                  <div className="meta-row">
                    <strong>Capacity:</strong>
                    <span>{selectedSchedule.capacity}</span>
                  </div>
                  <div className="meta-row">
                    <strong>Created:</strong>
                    <span>{formatDateTime(selectedSchedule.createdAt)}</span>
                  </div>
                  {selectedSchedule.updatedAt && (
                    <div className="meta-row">
                      <strong>Updated:</strong>
                      <span>{formatDateTime(selectedSchedule.updatedAt)}</span>
                    </div>
                  )}
                  {selectedSchedule.mentor?.mentorProfile && (
                    <>
                      <div className="meta-row">
                        <strong>Mentor Bio:</strong>
                        <span>{selectedSchedule.mentor.mentorProfile.bio}</span>
                      </div>
                      <div className="meta-row">
                        <strong>Experience:</strong>
                        <span>{selectedSchedule.mentor.mentorProfile.experience} years</span>
                      </div>
                      {selectedSchedule.mentor.mentorProfile.expertise && selectedSchedule.mentor.mentorProfile.expertise.length > 0 && (
                        <div className="meta-row">
                          <strong>Expertise:</strong>
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
                Close
              </button>
              <button
                onClick={() => handleDeleteSchedule(selectedSchedule.id)}
                className="button button-danger"
              >
                Delete Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule? This action cannot be undone and will also delete any related bookings and sessions."
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

export default AdminScheduleManagement;
