export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationQueryParams {
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}
