
export const COLORS = {
  background: '#000000',
  surface: '#1C1C1E',
  primary: '#007AFF',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
};

export const TOPIC_COLORS = [
  '#007AFF', // Blue
  '#30D158', // Green
  '#FF9F0A', // Orange
  '#FF453A', // Red
  '#BF5AF2', // Purple
  '#5E5CE6', // Indigo
  '#64D2FF', // Teal
  '#FFD60A', // Yellow
];

export const TOPIC_ICONS = [
  'briefcase',
  'code',
  'book',
  'dumbbell',
  'zap',
  'coffee',
  'pen-tool',
  'music',
  'globe',
  'camera',
  'gamepad-2',
  'heart'
];

export const STORAGE_KEYS = {
  // Global (Device Level)
  USERS_INDEX: 'konkrete_users_index', // Map<email, userId>
  ACTIVE_SESSION: 'konkrete_active_session_id', // string (userId)
  ONBOARDING_DONE: 'konkrete_onboarding_done', // boolean

  // User-Specific Suffixes (Constructed as: konkrete_user_{userId}_{SUFFIX})
  PROFILE: 'profile',
  TOPICS: 'topics',
  SESSIONS: 'sessions',
  ACTIVE_TIMER: 'active_timer',
  CHAT_HISTORY: 'chat',
  NOTIFICATIONS: 'notifications',
  SKIP_DELETE_CONFIRM: 'skip_delete_confirm',
  OBJECTIVES: 'objectives',
  GYM_DAYS: 'gym_days',
};

export const DEFAULT_DAILY_GOAL = 60; // Minutes
