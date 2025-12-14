
import { STORAGE_KEYS } from '../constants';

export const storage = {
  // --- Primitive Methods ---
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from storage`, e);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to storage`, e);
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  clearAll: (): void => {
      localStorage.clear();
  },

  // --- User Scoped Methods ---
  
  // Helper to generate a namespaced key: konkrete_user_{userId}_{suffix}
  getUserKey: (userId: string, suffix: string) => `konkrete_user_${userId}_${suffix}`,

  getForUser: <T>(userId: string, suffix: string, defaultValue: T): T => {
    const key = `konkrete_user_${userId}_${suffix}`;
    return storage.get<T>(key, defaultValue);
  },

  setForUser: <T>(userId: string, suffix: string, value: T): void => {
    const key = `konkrete_user_${userId}_${suffix}`;
    storage.set<T>(key, value);
  },
  
  removeForUser: (userId: string, suffix: string): void => {
    const key = `konkrete_user_${userId}_${suffix}`;
    storage.remove(key);
  }
};
