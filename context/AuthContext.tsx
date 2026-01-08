
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import { STORAGE_KEYS, APP_THEMES, DEFAULT_THEME_ID } from '../constants';
import { generateUUID } from '../services/uuid';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, displayName: string, password?: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check for active session ID on mount
    const activeUserId = storage.get<string | null>(STORAGE_KEYS.ACTIVE_SESSION, null);

    if (activeUserId) {
      // 2. Load that user's profile
      const storedUser = storage.getForUser<User | null>(activeUserId, STORAGE_KEYS.PROFILE, null);
      if (storedUser) {
        setUser(storedUser);
      } else {
        // Data integrity issue: Active ID exists but profile gone. Clear active session.
        storage.remove(STORAGE_KEYS.ACTIVE_SESSION);
      }
    }
    setIsLoading(false);
    setIsLoading(false);
  }, []);

  // Apply Theme Effect
  useEffect(() => {
    const themeId = user?.preferences.themeId || DEFAULT_THEME_ID;
    const theme = APP_THEMES.find(t => t.id === themeId);
    if (theme) {
      document.documentElement.style.setProperty('--color-primary', theme.color);
      document.documentElement.style.setProperty('--color-secondary', (theme as any).secondary || theme.color); // Fallback for safety
      document.documentElement.style.setProperty('--color-background', theme.background);
      document.documentElement.style.setProperty('--color-surface', theme.surface);
      document.documentElement.style.setProperty('--color-surface-highlight', theme.surfaceHighlight);
    }
  }, [user?.preferences.themeId]);

  const login = async (email: string, password?: string) => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Fake network delay

    // 1. Check User Index for Email -> ID mapping
    const userIndex = storage.get<Record<string, string>>(STORAGE_KEYS.USERS_INDEX, {});
    const userId = userIndex[email];

    if (userId) {
      // 2. Load User Profile
      const storedUser = storage.getForUser<User | null>(userId, STORAGE_KEYS.PROFILE, null);

      if (storedUser) {
        // Check password if provided (skip for guest/legacy if needed, but new flow requires it)
        if (password && storedUser.password !== password) {
          throw new Error("Invalid email or password.");
        }

        setUser(storedUser);
        // 3. Set Active Session
        storage.set(STORAGE_KEYS.ACTIVE_SESSION, userId);
        return;
      }
    }

    throw new Error("User not found locally. Please register.");
  };

  const register = async (email: string, displayName: string, password?: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check if email already exists
    const userIndex = storage.get<Record<string, string>>(STORAGE_KEYS.USERS_INDEX, {});
    if (userIndex[email]) {
      throw new Error("User already exists locally. Please login.");
    }

    const newUser: User = {
      id: generateUUID(),
      email,
      displayName,
      password, // Store password locally
      createdAt: Date.now(),
      preferences: {
        streakMinSeconds: 600,
        streakMinTopics: 1,
        dailyGoalSeconds: 0,
        themeId: DEFAULT_THEME_ID
      }
    };

    // 1. Save Profile (User Scoped)
    storage.setForUser(newUser.id, STORAGE_KEYS.PROFILE, newUser);

    // 2. Update Index (Global)
    userIndex[email] = newUser.id;
    storage.set(STORAGE_KEYS.USERS_INDEX, userIndex);

    // 3. DO NOT Set Session (Requirement: Redirect to login, empty inputs)
    // setUser(newUser);
    // storage.set(STORAGE_KEYS.ACTIVE_SESSION, newUser.id);
  };

  const loginAsGuest = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const guestEmail = "guest@local";
    const userIndex = storage.get<Record<string, string>>(STORAGE_KEYS.USERS_INDEX, {});

    let guestId = userIndex[guestEmail];
    let guestUser: User;

    if (guestId) {
      // Restore existing guest
      guestUser = storage.getForUser(guestId, STORAGE_KEYS.PROFILE, null) as User;
      if (!guestUser) {
        // Recovery if corrupted
        guestId = `guest-${generateUUID()}`;
        guestUser = createGuestUser(guestId, guestEmail);
      }
    } else {
      // Create new guest
      guestId = `guest-${generateUUID()}`;
      guestUser = createGuestUser(guestId, guestEmail);
    }

    // Save/Update Guest
    storage.setForUser(guestId, STORAGE_KEYS.PROFILE, guestUser);
    userIndex[guestEmail] = guestId;
    storage.set(STORAGE_KEYS.USERS_INDEX, userIndex);

    setUser(guestUser);
    storage.set(STORAGE_KEYS.ACTIVE_SESSION, guestId);
  };

  const createGuestUser = (id: string, email: string): User => ({
    id,
    email,
    displayName: 'Guest',
    createdAt: Date.now(),
    preferences: {
      streakMinSeconds: 600,
      streakMinTopics: 1,
      dailyGoalSeconds: 0,
      themeId: DEFAULT_THEME_ID
    }
  });

  const logout = () => {
    // Only clear memory and Active Session ID. 
    // Data remains in localStorage for next login.
    setUser(null);
    storage.remove(STORAGE_KEYS.ACTIVE_SESSION);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    // Persist update
    storage.setForUser(user.id, STORAGE_KEYS.PROFILE, updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, loginAsGuest, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
