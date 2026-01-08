
export interface User {
  id: string;
  email: string;
  password?: string; // Stored locally for this offline-first app
  displayName: string;
  createdAt: number;
  preferences: {
    streakMinSeconds: number;
    streakMinTopics: number;
    dailyGoalSeconds: number;
    themeId: string;
    focusDistributionView?: 'pie' | 'bar';
  };
}

export interface Topic {
  id: string;
  name: string;
  color: string;
  icon?: string;
  totalMinutes: number;
  createdAt: number;
}

export interface Session {
  id: string;
  topicId: string;
  topicName: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface Notification {
  id: string;
  icon: 'trophy' | 'zap' | 'star' | 'bell';
  color: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface Objective {
  id: string;
  text: string;
  completed: boolean;
  year: number;
  week: number;
  createdAt: number;
}

export enum AppTab {
  Overview = 'Overview',
  Tracking = 'Tracking',
  Coach = 'Coach',
  Profile = 'Profile',
}

export type AppScreen = AppTab | 'Notifications';

export type TimerState = 'idle' | 'running' | 'paused';
