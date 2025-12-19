// Permission codes constants
// Format: resource:action or resource:action_scope

export const PERMISSIONS = {
  // Schedule permissions
  SCHEDULE_CREATE: 'schedule:create',
  SCHEDULE_VIEW_OWN: 'schedule:view_own',
  SCHEDULE_VIEW_ANY: 'schedule:view_any',
  SCHEDULE_UPDATE_OWN: 'schedule:update_own',
  SCHEDULE_UPDATE_ANY: 'schedule:update_any',
  SCHEDULE_DELETE_OWN: 'schedule:delete_own',
  SCHEDULE_DELETE_ANY: 'schedule:delete_any',

  // Booking permissions
  BOOKING_CREATE: 'booking:create',
  BOOKING_VIEW_OWN: 'booking:view_own',
  BOOKING_VIEW_ANY: 'booking:view_any',
  BOOKING_UPDATE_OWN: 'booking:update_own',
  BOOKING_UPDATE_ANY: 'booking:update_any',
  BOOKING_APPROVE: 'booking:approve',
  BOOKING_CANCEL_OWN: 'booking:cancel_own',
  BOOKING_CANCEL_ANY: 'booking:cancel_any',
  BOOKING_DELETE: 'booking:delete',

  // Post permissions
  POST_CREATE: 'post:create',
  POST_VIEW_OWN: 'post:view_own',
  POST_VIEW_ANY: 'post:view_any',
  POST_UPDATE_OWN: 'post:update_own',
  POST_UPDATE_ANY: 'post:update_any',
  POST_DELETE_OWN: 'post:delete_own',
  POST_DELETE_ANY: 'post:delete_any',
  POST_LIKE: 'post:like',

  // Session permissions
  SESSION_CREATE: 'session:create',
  SESSION_VIEW_OWN: 'session:view_own',
  SESSION_VIEW_ANY: 'session:view_any',
  SESSION_UPDATE_OWN: 'session:update_own',
  SESSION_UPDATE_ANY: 'session:update_any',
  SESSION_DELETE: 'session:delete',

  // Feedback permissions
  FEEDBACK_CREATE: 'feedback:create',
  FEEDBACK_VIEW_OWN: 'feedback:view_own',
  FEEDBACK_VIEW_ANY: 'feedback:view_any',
  FEEDBACK_UPDATE_OWN: 'feedback:update_own',
  FEEDBACK_UPDATE_ANY: 'feedback:update_any',
  FEEDBACK_DELETE_OWN: 'feedback:delete_own',
  FEEDBACK_DELETE_ANY: 'feedback:delete_any',

  // Profile permissions
  PROFILE_VIEW_OWN: 'profile:view_own',
  PROFILE_VIEW_ANY: 'profile:view_any',
  PROFILE_UPDATE_OWN: 'profile:update_own',
  PROFILE_UPDATE_ANY: 'profile:update_any',

  // Notification permissions
  NOTIFICATION_VIEW_OWN: 'notification:view_own',
  NOTIFICATION_VIEW_ANY: 'notification:view_any',
  NOTIFICATION_UPDATE_OWN: 'notification:update_own',
  NOTIFICATION_CREATE: 'notification:create',

  // User management permissions (Admin only)
  USER_VIEW_ANY: 'user:view_any',
  USER_CREATE: 'user:create',
  USER_UPDATE_ANY: 'user:update_any',
  USER_DELETE_ANY: 'user:delete_any',

  // Admin-specific permissions
  ADMIN_MANAGE_USERS: 'admin:manage_users',
  ADMIN_VIEW_STATS: 'admin:view_stats',

  // Permission management (Admin only)
  PERMISSION_VIEW: 'permission:view',
  PERMISSION_GRANT: 'permission:grant',
  PERMISSION_REVOKE: 'permission:revoke',
  ROLE_MANAGE: 'role:manage',
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permission definitions with metadata
export interface PermissionDefinition {
  code: string;
  resource: string;
  action: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Schedules
  { code: PERMISSIONS.SCHEDULE_CREATE, resource: 'schedule', action: 'create', description: 'Create schedules' },
  { code: PERMISSIONS.SCHEDULE_VIEW_OWN, resource: 'schedule', action: 'view_own', description: 'View own schedules' },
  { code: PERMISSIONS.SCHEDULE_VIEW_ANY, resource: 'schedule', action: 'view_any', description: 'View any schedules' },
  { code: PERMISSIONS.SCHEDULE_UPDATE_OWN, resource: 'schedule', action: 'update_own', description: 'Update own schedules' },
  { code: PERMISSIONS.SCHEDULE_UPDATE_ANY, resource: 'schedule', action: 'update_any', description: 'Update any schedules' },
  { code: PERMISSIONS.SCHEDULE_DELETE_OWN, resource: 'schedule', action: 'delete_own', description: 'Delete own schedules' },
  { code: PERMISSIONS.SCHEDULE_DELETE_ANY, resource: 'schedule', action: 'delete_any', description: 'Delete any schedules' },

  // Bookings
  { code: PERMISSIONS.BOOKING_CREATE, resource: 'booking', action: 'create', description: 'Create bookings' },
  { code: PERMISSIONS.BOOKING_VIEW_OWN, resource: 'booking', action: 'view_own', description: 'View own bookings' },
  { code: PERMISSIONS.BOOKING_VIEW_ANY, resource: 'booking', action: 'view_any', description: 'View any bookings' },
  { code: PERMISSIONS.BOOKING_UPDATE_OWN, resource: 'booking', action: 'update_own', description: 'Update own bookings' },
  { code: PERMISSIONS.BOOKING_UPDATE_ANY, resource: 'booking', action: 'update_any', description: 'Update any bookings' },
  { code: PERMISSIONS.BOOKING_APPROVE, resource: 'booking', action: 'approve', description: 'Approve/confirm bookings' },
  { code: PERMISSIONS.BOOKING_CANCEL_OWN, resource: 'booking', action: 'cancel_own', description: 'Cancel own bookings' },
  { code: PERMISSIONS.BOOKING_CANCEL_ANY, resource: 'booking', action: 'cancel_any', description: 'Cancel any bookings' },
  { code: PERMISSIONS.BOOKING_DELETE, resource: 'booking', action: 'delete', description: 'Delete any bookings' },

  // Posts
  { code: PERMISSIONS.POST_CREATE, resource: 'post', action: 'create', description: 'Create posts' },
  { code: PERMISSIONS.POST_VIEW_OWN, resource: 'post', action: 'view_own', description: 'View own posts' },
  { code: PERMISSIONS.POST_VIEW_ANY, resource: 'post', action: 'view_any', description: 'View any posts' },
  { code: PERMISSIONS.POST_UPDATE_OWN, resource: 'post', action: 'update_own', description: 'Update own posts' },
  { code: PERMISSIONS.POST_UPDATE_ANY, resource: 'post', action: 'update_any', description: 'Update any posts' },
  { code: PERMISSIONS.POST_DELETE_OWN, resource: 'post', action: 'delete_own', description: 'Delete own posts' },
  { code: PERMISSIONS.POST_DELETE_ANY, resource: 'post', action: 'delete_any', description: 'Delete any posts' },
  { code: PERMISSIONS.POST_LIKE, resource: 'post', action: 'like', description: 'Like/unlike posts' },

  // Sessions
  { code: PERMISSIONS.SESSION_CREATE, resource: 'session', action: 'create', description: 'Create sessions' },
  { code: PERMISSIONS.SESSION_VIEW_OWN, resource: 'session', action: 'view_own', description: 'View own sessions' },
  { code: PERMISSIONS.SESSION_VIEW_ANY, resource: 'session', action: 'view_any', description: 'View any sessions' },
  { code: PERMISSIONS.SESSION_UPDATE_OWN, resource: 'session', action: 'update_own', description: 'Update own sessions' },
  { code: PERMISSIONS.SESSION_UPDATE_ANY, resource: 'session', action: 'update_any', description: 'Update any sessions' },
  { code: PERMISSIONS.SESSION_DELETE, resource: 'session', action: 'delete', description: 'Delete any sessions' },

  // Feedbacks
  { code: PERMISSIONS.FEEDBACK_CREATE, resource: 'feedback', action: 'create', description: 'Create feedback' },
  { code: PERMISSIONS.FEEDBACK_VIEW_OWN, resource: 'feedback', action: 'view_own', description: 'View own feedback' },
  { code: PERMISSIONS.FEEDBACK_VIEW_ANY, resource: 'feedback', action: 'view_any', description: 'View any feedback' },
  { code: PERMISSIONS.FEEDBACK_UPDATE_OWN, resource: 'feedback', action: 'update_own', description: 'Update own feedback' },
  { code: PERMISSIONS.FEEDBACK_UPDATE_ANY, resource: 'feedback', action: 'update_any', description: 'Update any feedback' },
  { code: PERMISSIONS.FEEDBACK_DELETE_OWN, resource: 'feedback', action: 'delete_own', description: 'Delete own feedback' },
  { code: PERMISSIONS.FEEDBACK_DELETE_ANY, resource: 'feedback', action: 'delete_any', description: 'Delete any feedback' },

  // Profiles
  { code: PERMISSIONS.PROFILE_VIEW_OWN, resource: 'profile', action: 'view_own', description: 'View own profile' },
  { code: PERMISSIONS.PROFILE_VIEW_ANY, resource: 'profile', action: 'view_any', description: 'View any profile' },
  { code: PERMISSIONS.PROFILE_UPDATE_OWN, resource: 'profile', action: 'update_own', description: 'Update own profile' },
  { code: PERMISSIONS.PROFILE_UPDATE_ANY, resource: 'profile', action: 'update_any', description: 'Update any profile' },

  // Notifications
  { code: PERMISSIONS.NOTIFICATION_VIEW_OWN, resource: 'notification', action: 'view_own', description: 'View own notifications' },
  { code: PERMISSIONS.NOTIFICATION_VIEW_ANY, resource: 'notification', action: 'view_any', description: 'View any notifications' },
  { code: PERMISSIONS.NOTIFICATION_UPDATE_OWN, resource: 'notification', action: 'update_own', description: 'Update own notifications (mark as read)' },
  { code: PERMISSIONS.NOTIFICATION_CREATE, resource: 'notification', action: 'create', description: 'Create notifications' },

  // Users
  { code: PERMISSIONS.USER_VIEW_ANY, resource: 'user', action: 'view_any', description: 'View any user' },
  { code: PERMISSIONS.USER_CREATE, resource: 'user', action: 'create', description: 'Create users' },
  { code: PERMISSIONS.USER_UPDATE_ANY, resource: 'user', action: 'update_any', description: 'Update any user' },
  { code: PERMISSIONS.USER_DELETE_ANY, resource: 'user', action: 'delete_any', description: 'Delete any user' },

  // Admin-specific
  { code: PERMISSIONS.ADMIN_MANAGE_USERS, resource: 'admin', action: 'manage_users', description: 'Manage users (admin)' },
  { code: PERMISSIONS.ADMIN_VIEW_STATS, resource: 'admin', action: 'view_stats', description: 'View statistics (admin)' },

  // Permission management
  { code: PERMISSIONS.PERMISSION_VIEW, resource: 'permission', action: 'view', description: 'View permissions' },
  { code: PERMISSIONS.PERMISSION_GRANT, resource: 'permission', action: 'grant', description: 'Grant permissions' },
  { code: PERMISSIONS.PERMISSION_REVOKE, resource: 'permission', action: 'revoke', description: 'Revoke permissions' },
  { code: PERMISSIONS.ROLE_MANAGE, resource: 'role', action: 'manage', description: 'Manage roles' },
];

// Default permissions for each role
export const ROLE_PERMISSIONS = {
  ADMIN: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
  MENTOR: [
    // Schedule management
    PERMISSIONS.SCHEDULE_CREATE,
    PERMISSIONS.SCHEDULE_VIEW_OWN,
    PERMISSIONS.SCHEDULE_VIEW_ANY,
    PERMISSIONS.SCHEDULE_UPDATE_OWN,
    PERMISSIONS.SCHEDULE_DELETE_OWN,

    // Booking management
    PERMISSIONS.BOOKING_VIEW_OWN,
    PERMISSIONS.BOOKING_VIEW_ANY, // Mentors can see bookings for their schedules
    PERMISSIONS.BOOKING_UPDATE_OWN,
    PERMISSIONS.BOOKING_APPROVE, // Mentors can confirm bookings
    PERMISSIONS.BOOKING_CANCEL_OWN,

    // Session management
    PERMISSIONS.SESSION_CREATE,
    PERMISSIONS.SESSION_VIEW_OWN,
    PERMISSIONS.SESSION_UPDATE_OWN,

    // Feedback
    PERMISSIONS.FEEDBACK_CREATE,
    PERMISSIONS.FEEDBACK_VIEW_OWN,
    PERMISSIONS.FEEDBACK_VIEW_ANY, // Can see feedback for their sessions

    // Posts
    PERMISSIONS.POST_CREATE,
    PERMISSIONS.POST_VIEW_OWN,
    PERMISSIONS.POST_VIEW_ANY,
    PERMISSIONS.POST_UPDATE_OWN,
    PERMISSIONS.POST_DELETE_OWN,
    PERMISSIONS.POST_LIKE,

    // Profile
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_VIEW_ANY,
    PERMISSIONS.PROFILE_UPDATE_OWN,

    // Notifications
    PERMISSIONS.NOTIFICATION_VIEW_OWN,
    PERMISSIONS.NOTIFICATION_UPDATE_OWN,
  ],
  MENTEE: [
    // Schedule viewing
    PERMISSIONS.SCHEDULE_VIEW_OWN,
    PERMISSIONS.SCHEDULE_VIEW_ANY,

    // Booking management
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_VIEW_OWN,
    PERMISSIONS.BOOKING_VIEW_ANY, // Mentees can see all bookings
    PERMISSIONS.BOOKING_CANCEL_OWN,

    // Session viewing
    PERMISSIONS.SESSION_VIEW_OWN,
    PERMISSIONS.SESSION_VIEW_ANY, // Mentees can see all sessions

    // Feedback
    PERMISSIONS.FEEDBACK_CREATE,
    PERMISSIONS.FEEDBACK_VIEW_OWN,
    PERMISSIONS.FEEDBACK_VIEW_ANY, // Mentees can see all feedback

    // Posts - MENTEE chỉ có quyền xem và like, không được tạo/sửa/xóa bài viết
    PERMISSIONS.POST_VIEW_OWN,
    PERMISSIONS.POST_VIEW_ANY,
    PERMISSIONS.POST_LIKE,

    // Profile
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_VIEW_ANY,
    PERMISSIONS.PROFILE_UPDATE_OWN,

    // Notifications
    PERMISSIONS.NOTIFICATION_VIEW_OWN,
    PERMISSIONS.NOTIFICATION_UPDATE_OWN,
  ],
};
