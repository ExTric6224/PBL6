import api from './api';
import { Notification, NotificationQueryParams } from '../types/notification';
import { ApiResponse, PaginatedResponse } from '../types/common';

export const notificationApi = {
  // Get notifications
  getNotifications: async (params?: NotificationQueryParams): Promise<PaginatedResponse<Notification>> => {
    const queryParams = new URLSearchParams();
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<PaginatedResponse<Notification>>(`/notifications?${queryParams.toString()}`);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return response.data.data;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
