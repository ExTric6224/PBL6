import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './NotificationList.css';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationList: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.data || []);
    } catch (err: any) {
      setError('Failed to load notifications');
      console.error('Load notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err: any) {
      console.error('Mark as read error:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (err: any) {
      console.error('Mark all as read error:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_request':
        return '📅';
      case 'booking_confirmed':
        return '✅';
      case 'session_reminder':
        return '⏰';
      default:
        return '🔔';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="notification-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông báo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification-error">
        <p>{error}</p>
        <button onClick={loadNotifications} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notification-container">
      <div className="notification-header">
        <h2>Thông báo</h2>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="mark-all-read-btn">
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>Chưa có thông báo nào</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <h4 className="notification-title">{notification.title}</h4>
                <p className="notification-text">{notification.content}</p>
                <span className="notification-time">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
              {!notification.isRead && (
                <div className="unread-indicator"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;