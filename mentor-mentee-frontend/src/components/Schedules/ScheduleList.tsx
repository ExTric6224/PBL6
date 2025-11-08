import React, { useState, useEffect, useCallback } from 'react';
import { scheduleApi } from '../../services/scheduleApi';
import { bookingApi } from '../../services/bookingApi';
import { Schedule, ScheduleQueryParams } from '../../types/schedule';
import { useAuth } from '../../context/AuthContext';
import './ScheduleList.css';

const ScheduleList: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ 
    topic: '', 
    startAt: '', 
    endAt: '', 
    capacity: 1 
  });
  const [filters, setFilters] = useState<ScheduleQueryParams>({ status: undefined });

  const isMentor = user?.role === 'MENTOR';

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      if (isMentor) {
        response = await scheduleApi.getMySchedules(filters);
      } else {
        response = await scheduleApi.getAllSchedules(filters);
      }
      setSchedules(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, [filters, isMentor]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    const start = new Date(formData.startAt);
    const end = new Date(formData.endAt);
    
    if (end <= start) {
      alert('End time must be after start time!');
      return;
    }
    
    if (start < new Date()) {
      alert('Start time must be in the future!');
      return;
    }
    
    try {
      // Convert to ISO 8601 format for backend
      const scheduleData = {
        topic: formData.topic,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        capacity: formData.capacity,
      };
      
      await scheduleApi.createSchedule(scheduleData);
      setFormData({ topic: '', startAt: '', endAt: '', capacity: 1 });
      setShowCreateForm(false);
      loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create schedule');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await scheduleApi.deleteSchedule(id);
      loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete schedule');
    }
  };

  const handleBookSchedule = async (scheduleId: number) => {
    const notes = prompt('Enter any notes for the mentor (optional):');
    try {
      await bookingApi.createBooking({ scheduleId, notes: notes || undefined });
      alert('Booking created successfully! Waiting for mentor confirmation.');
      loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create booking');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && schedules.length === 0) {
    return <div className="loading">Loading schedules...</div>;
  }

  return (
    <div className="schedules-container">
      <div className="schedules-header">
        <h1>🗓️ {isMentor ? 'My Schedules' : 'Available Schedules'}</h1>
        {isMentor && (
          <button
            className="create-schedule-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '✖ Cancel' : '✚ Create Schedule'}
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
          >
            <option value="">All</option>
            <option value="AVAILABLE">Available</option>
            <option value="BOOKED">Booked</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && isMentor && (
        <form className="schedule-form" onSubmit={handleCreateSchedule}>
          <h2>Create New Schedule</h2>
          <div className="form-group">
            <label>Topic</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g. Backend Development Fundamentals"
              required
            />
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input
              type="datetime-local"
              value={formData.endAt}
              onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ 
                ...formData, 
                capacity: parseInt(e.target.value) || 1 
              })}
              min="1"
              max="100"
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Schedule
            </button>
          </div>
        </form>
      )}

      {/* Schedules Grid */}
      {schedules.length === 0 && !loading ? (
        <div className="empty-state">
          {isMentor ? 'No schedules yet. Create your first schedule!' : 'No schedules available.'}
        </div>
      ) : (
        <div className="schedule-grid">
          {schedules.map((schedule) => (
            <div key={schedule.id} className={`schedule-card ${schedule.status.toLowerCase()}`}>
              <h3 className="schedule-topic">{schedule.topic}</h3>
              <div className="schedule-time">
                🕒 {formatDateTime(schedule.startAt)}
              </div>
              <div className="schedule-date">
                to {formatDateTime(schedule.endAt)}
              </div>
              <div className="schedule-capacity">
                👥 Capacity: {schedule.capacity}
              </div>
              {schedule.mentor && (
                <>
                  <div className="schedule-mentor">
                    👨‍🏫 Mentor: {schedule.mentor.mentorProfile?.fullName || schedule.mentor.email}
                  </div>
                  {schedule.mentor.mentorProfile?.expertise && 
                   schedule.mentor.mentorProfile.expertise.length > 0 && (
                    <div className="mentor-expertise">
                      <strong>Expertise:</strong>
                      <div className="expertise-tags">
                        {schedule.mentor.mentorProfile.expertise.map((topic) => (
                          <span key={topic.id} className="expertise-tag" title={topic.description}>
                            {topic.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <span className={`status-badge ${schedule.status.toLowerCase()}`}>
                {schedule.status}
              </span>
              <div className="schedule-actions">
                {!isMentor && schedule.status === 'AVAILABLE' && (
                  <button className="book-btn" onClick={() => handleBookSchedule(schedule.id)}>
                    📅 Book Now
                  </button>
                )}
                {isMentor && schedule.mentorId === user?.id && (
                  <button className="delete-btn" onClick={() => handleDeleteSchedule(schedule.id)}>
                    🗑️ Delete
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
