// Permission code to Vietnamese description mapping
export const permissionTranslations: Record<string, string> = {
  // Schedule permissions
  'schedule:create': 'tạo lịch',
  'schedule:view_own': 'xem lịch của bản thân',
  'schedule:view_any': 'xem lịch của người khác',
  'schedule:update_own': 'cập nhật lịch của bản thân',
  'schedule:update_any': 'cập nhật lịch của người khác',
  'schedule:delete_own': 'xóa lịch của bản thân',
  'schedule:delete_any': 'xóa lịch của người khác',

  // Booking permissions
  'booking:create': 'tạo đặt lịch',
  'booking:view_own': 'xem đặt lịch của bản thân',
  'booking:view_any': 'xem đặt lịch của người khác',
  'booking:update_own': 'cập nhật đặt lịch của bản thân',
  'booking:update_any': 'cập nhật đặt lịch của người khác',
  'booking:approve': 'phê duyệt đặt lịch',
  'booking:cancel_own': 'hủy đặt lịch của bản thân',
  'booking:cancel_any': 'hủy đặt lịch của người khác',

  // Post permissions
  'post:create': 'tạo bài đăng',
  'post:view_own': 'xem bài đăng của bản thân',
  'post:view_any': 'xem bài đăng của người khác',
  'post:update_own': 'cập nhật bài đăng của bản thân',
  'post:update_any': 'cập nhật bài đăng của người khác',
  'post:delete_own': 'xóa bài đăng của bản thân',
  'post:delete_any': 'xóa bài đăng của người khác',
  'post:like': 'thích bài đăng',

  // Session permissions
  'session:create': 'tạo phiên học',
  'session:view_own': 'xem phiên học của bản thân',
  'session:view_any': 'xem phiên học của người khác',
  'session:update_own': 'cập nhật phiên học của bản thân',
  'session:update_any': 'cập nhật phiên học của người khác',

  // Feedback permissions
  'feedback:create': 'tạo đánh giá',
  'feedback:view_own': 'xem đánh giá của bản thân',
  'feedback:view_any': 'xem đánh giá của người khác',
  'feedback:update_own': 'cập nhật đánh giá của bản thân',
  'feedback:update_any': 'cập nhật đánh giá của người khác',
  'feedback:delete_own': 'xóa đánh giá của bản thân',
  'feedback:delete_any': 'xóa đánh giá của người khác',

  // Profile permissions
  'profile:view_own': 'xem hồ sơ của bản thân',
  'profile:view_any': 'xem hồ sơ của người khác',
  'profile:update_own': 'cập nhật hồ sơ của bản thân',
  'profile:update_any': 'cập nhật hồ sơ của người khác',

  // Notification permissions
  'notification:view_own': 'xem thông báo của bản thân',
  'notification:view_any': 'xem thông báo của người khác',
  'notification:update_own': 'cập nhật thông báo của bản thân',
  'notification:create': 'tạo thông báo',

  // User management permissions
  'user:view_any': 'xem thông tin người dùng',
  'user:create': 'tạo người dùng',
  'user:update_any': 'cập nhật thông tin người dùng',
  'user:delete_any': 'xóa người dùng',

  // Admin permissions
  'admin:manage_users': 'quản lý người dùng',
  'admin:view_stats': 'xem thống kê',

  // Permission management
  'permission:view': 'xem quyền',
  'permission:grant': 'cấp quyền',
  'permission:revoke': 'thu hồi quyền',
  'role:manage': 'quản lý vai trò',
};

/**
 * Translate permission code to Vietnamese description
 * @param permissionCode - The permission code (e.g., "schedule:view_own")
 * @returns Vietnamese description or the original code if not found
 */
export const translatePermission = (permissionCode: string): string => {
  return permissionTranslations[permissionCode] || permissionCode;
};

/**
 * Extract permission codes from error message and translate them
 * @param errorMessage - Error message that may contain permission codes
 * @returns Translated error message
 */
export const translateErrorMessage = (errorMessage: string): string => {
  // Pattern to match permission codes like "schedule:view_own"
  const permissionPattern = /([a-z_]+:[a-z_]+)/gi;
  
  return errorMessage.replace(permissionPattern, (match) => {
    const translated = translatePermission(match);
    return translated !== match ? `"${translated}"` : match;
  });
};
