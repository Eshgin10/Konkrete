
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

export const APP_THEMES = [
  {
    id: 'blue',
    name: 'Default',
    color: '#007AFF', // Blue
    secondary: '#FFFFFF', // White for Premium/Minimalist feel
    background: '#000000',
    surface: '#1C1C1E',
    surfaceHighlight: '#2C2C2E'
  },
  {
    id: 'green',
    name: 'Forest',
    color: '#30D158', // Green
    secondary: '#FFD60A', // Sunlight Yellow
    background: '#050A05',
    surface: '#121A12',
    surfaceHighlight: '#1E281E'
  },
  {
    id: 'orange',
    name: 'Sunset',
    color: '#FF9F0A', // Orange
    secondary: '#BF5AF2', // Purple
    background: '#100515', // Deep Purple/Black
    surface: '#1F1525',
    surfaceHighlight: '#2D2036'
  },
  {
    id: 'red',
    name: 'Ember',
    color: '#FF453A', // Red
    secondary: '#FF9F0A', // Orange
    background: '#0F0505',
    surface: '#1F1010',
    surfaceHighlight: '#2C1E1E'
  },
  {
    id: 'purple',
    name: 'Cosmos',
    color: '#BF5AF2', // Purple
    secondary: '#64D2FF', // Cyan
    background: '#0B0515',
    surface: '#161022',
    surfaceHighlight: '#201A2C'
  },
  {
    id: 'teal',
    name: 'Aqua',
    color: '#64D2FF', // Teal
    secondary: '#007AFF', // Blue
    background: '#000810',
    surface: '#0A1520',
    surfaceHighlight: '#152230'
  },
];

export const DEFAULT_THEME_ID = 'blue';
