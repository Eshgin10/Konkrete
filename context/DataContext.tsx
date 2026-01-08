
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Topic, Session, TimerState, Objective } from '../types';
import { storage } from '../services/storage';
import { STORAGE_KEYS, TOPIC_COLORS, TOPIC_ICONS } from '../constants';
import { predictTopicIcon } from '../services/geminiService';
import { useAuth } from './AuthContext';
import { generateUUID } from '../services/uuid';

type PersistedTimer = {
  activeTopicId: string | null;
  timerState: TimerState;
  startedAt: number | null;
  elapsedSeconds: number;
};

interface DataContextType {
  topics: Topic[];
  sessions: Session[];
  objectives: Objective[];

  addTopic: (name: string, icon?: string) => void;
  updateTopic: (id: string, updates: Partial<Pick<Topic, 'name' | 'icon' | 'color'>>) => void;
  addManualMinutes: (id: string, minutesToAdd: number) => void;
  deleteTopic: (id: string) => void;
  addObjective: (text: string, year: number, week: number) => void;
  updateObjective: (id: string, text: string) => void;
  toggleObjective: (id: string) => void;
  deleteObjective: (id: string) => void;
  gymDays: string[];
  toggleGymDay: (dateStr: string) => void;
}

interface TimerContextType {
  activeTopicId: string | null;
  timerState: TimerState;
  elapsedSeconds: number;

  selectTopic: (topicId: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resumeTimer: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inject Auth to get userId
  const { user } = useAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [gymDays, setGymDays] = useState<string[]>([]);
  const pendingHydrationUserIdRef = useRef<string | null>(null);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);

  // Timer State (Ephemeral)
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const persistTimer = (next: PersistedTimer) => {
    if (!user) return;
    storage.setForUser(user.id, STORAGE_KEYS.ACTIVE_TIMER, next);
  };

  const updateTopic = (id: string, updates: Partial<Pick<Topic, 'name' | 'icon' | 'color'>>) => {
    if (!user) return;
    setTopics(prev => {
      const next = prev.map(t => (t.id === id ? { ...t, ...updates } : t));
      storage.setForUser(user.id, STORAGE_KEYS.TOPICS, next);
      return next;
    });
  };

  const addManualMinutes = (id: string, minutesToAdd: number) => {
    if (!user) return;
    if (!Number.isFinite(minutesToAdd) || minutesToAdd === 0) return;

    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    const durationSeconds = Math.floor(minutesToAdd * 60);
    const endTime = Date.now();
    const startTime = endTime - (durationSeconds * 1000);

    const newSession: Session = {
      id: generateUUID(),
      topicId: id,
      topicName: topic.name,
      startTime,
      endTime,
      durationSeconds,
    };

    setSessions(prev => {
      const next = [newSession, ...prev];
      storage.setForUser(user.id, STORAGE_KEYS.SESSIONS, next);
      return next;
    });

    setTopics(prev => {
      const next = prev.map(t => (t.id === id ? { ...t, totalMinutes: Math.max(0, t.totalMinutes + minutesToAdd) } : t));
      storage.setForUser(user.id, STORAGE_KEYS.TOPICS, next);
      return next;
    });
  };

  const clearPersistedTimer = () => {
    if (!user) return;
    storage.removeForUser(user.id, STORAGE_KEYS.ACTIVE_TIMER);
  };

  // 1. Load Data When User Changes
  useEffect(() => {
    if (user) {
      pendingHydrationUserIdRef.current = user.id;
      setHydratedUserId(null);
      const loadedTopics = storage.getForUser<Topic[]>(user.id, STORAGE_KEYS.TOPICS, []);
      const loadedSessions = storage.getForUser<Session[]>(user.id, STORAGE_KEYS.SESSIONS, []);
      const loadedTimer = storage.getForUser<PersistedTimer | null>(user.id, STORAGE_KEYS.ACTIVE_TIMER, null);
      setTopics(loadedTopics);
      setSessions(loadedSessions);
      setObjectives(storage.getForUser<Objective[]>(user.id, STORAGE_KEYS.OBJECTIVES, []));
      setGymDays(storage.getForUser<string[]>(user.id, STORAGE_KEYS.GYM_DAYS, []));

      if (loadedTimer) {
        setActiveTopicId(loadedTimer.activeTopicId);
        setTimerState(loadedTimer.timerState);

        if (loadedTimer.timerState === 'running' && loadedTimer.startedAt) {
          const computedElapsed = Math.max(0, Math.floor((Date.now() - loadedTimer.startedAt) / 1000));
          setElapsedSeconds(computedElapsed);
          startTimeRef.current = loadedTimer.startedAt;
        } else {
          setElapsedSeconds(loadedTimer.elapsedSeconds || 0);
          startTimeRef.current = null;
        }
      }
    } else {
      // Clear sensitive data from memory on logout
      setTopics([]);
      setSessions([]);
      setObjectives([]);
      setGymDays([]);
      setTimerState('idle');
      setElapsedSeconds(0);
      setActiveTopicId(null);
      pendingHydrationUserIdRef.current = null;
      setHydratedUserId(null);
    }
  }, [user?.id]); // Only re-run if actual user ID changes

  // Mark hydration complete only after loaded state is committed.
  useEffect(() => {
    if (!user) return;
    if (pendingHydrationUserIdRef.current !== user.id) return;
    if (hydratedUserId === user.id) return;
    setHydratedUserId(user.id);
  }, [topics, sessions, user?.id, hydratedUserId]);

  // 2. Persist Data When It Changes (User Scoped)
  useEffect(() => {
    if (!user || hydratedUserId !== user.id) return;
    storage.setForUser(user.id, STORAGE_KEYS.TOPICS, topics);
  }, [topics, user?.id]);

  useEffect(() => {
    if (!user || hydratedUserId !== user.id) return;
    storage.setForUser(user.id, STORAGE_KEYS.SESSIONS, sessions);
  }, [sessions, user?.id]);

  useEffect(() => {
    if (!user || hydratedUserId !== user.id) return;
    storage.setForUser(user.id, STORAGE_KEYS.OBJECTIVES, objectives);
  }, [objectives, user?.id]);

  useEffect(() => {
    if (!user || hydratedUserId !== user.id) return;
    storage.setForUser(user.id, STORAGE_KEYS.GYM_DAYS, gymDays);
  }, [gymDays, user?.id]);

  // Timer Logic
  useEffect(() => {
    if (timerState === 'running') {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      }
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerState]);

  // Keep persisted timer in sync on key state transitions.
  useEffect(() => {
    if (!user || hydratedUserId !== user.id) return;
    if (timerState === 'idle') {
      clearPersistedTimer();
      return;
    }

    const payload: PersistedTimer = {
      activeTopicId,
      timerState,
      startedAt: timerState === 'running' ? (startTimeRef.current || Date.now()) : null,
      elapsedSeconds,
    };
    persistTimer(payload);
  }, [activeTopicId, timerState, elapsedSeconds, user?.id, hydratedUserId]);

  const addTopic = (name: string, icon?: string) => {
    if (!user) return;

    const color = TOPIC_COLORS[topics.length % TOPIC_COLORS.length];
    const initialIcon = icon || TOPIC_ICONS[topics.length % TOPIC_ICONS.length];

    const newTopic: Topic = {
      id: generateUUID(),
      name,
      color,
      icon: initialIcon,
      totalMinutes: 0,
      createdAt: Date.now()
    };

    setTopics(prev => {
      const next = [...prev, newTopic];
      storage.setForUser(user.id, STORAGE_KEYS.TOPICS, next);
      return next;
    });

    if (!icon) {
      predictTopicIcon(name).then((predictedIcon) => {
        if (predictedIcon) {
          setTopics(currentTopics =>
            currentTopics.map(t =>
              t.id === newTopic.id ? { ...t, icon: predictedIcon } : t
            )
          );
        }
      });
    }
  };

  const deleteTopic = (id: string) => {
    if (!user) return;

    if (activeTopicId === id) {
      stopTimer();
    }

    setTopics(prev => {
      const next = prev.filter(t => t.id !== id);
      storage.setForUser(user.id, STORAGE_KEYS.TOPICS, next);
      return next;
    });
    setSessions(prev => {
      const next = prev.filter(s => s.topicId !== id);
      storage.setForUser(user.id, STORAGE_KEYS.SESSIONS, next);
      return next;
    });
  };

  const selectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    setElapsedSeconds(0);
    setTimerState('idle');
    startTimeRef.current = null;
  };

  const startTimer = () => {
    if (activeTopicId) {
      startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      setTimerState('running');
    }
  };

  const pauseTimer = () => {
    setTimerState('paused');
  };

  const resumeTimer = () => {
    startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
    setTimerState('running');
  };

  const stopTimer = () => {
    if (!activeTopicId || !user) return;

    const duration = elapsedSeconds;
    const sessionTopic = topics.find(t => t.id === activeTopicId);

    if (sessionTopic && duration > 0) {
      const newSession: Session = {
        id: generateUUID(),
        topicId: activeTopicId,
        topicName: sessionTopic.name,
        startTime: Date.now() - (duration * 1000),
        endTime: Date.now(),
        durationSeconds: duration
      };

      setSessions(prev => {
        const next = [newSession, ...prev];
        storage.setForUser(user.id, STORAGE_KEYS.SESSIONS, next);
        return next;
      });

      setTopics(prev => {
        const next = prev.map(t => {
          if (t.id === activeTopicId) {
            return { ...t, totalMinutes: t.totalMinutes + (duration / 60) };
          }
          return t;
        });
        storage.setForUser(user.id, STORAGE_KEYS.TOPICS, next);
        return next;
      });
    }

    setTimerState('idle');
    setElapsedSeconds(0);
    setActiveTopicId(null);
    startTimeRef.current = null;
  };

  const addObjective = (text: string, year: number, week: number) => {
    if (!user) return;
    const newObjective: Objective = {
      id: generateUUID(),
      text,
      completed: false,
      year,
      week,
      createdAt: Date.now(),
    };
    setObjectives(prev => {
      const next = [...prev, newObjective];
      storage.setForUser(user.id, STORAGE_KEYS.OBJECTIVES, next);
      return next;
    });
  };

  const updateObjective = (id: string, text: string) => {
    if (!user) return;
    setObjectives(prev => {
      const next = prev.map(o => o.id === id ? { ...o, text } : o);
      storage.setForUser(user.id, STORAGE_KEYS.OBJECTIVES, next);
      return next;
    });
  };

  const toggleObjective = (id: string) => {
    if (!user) return;
    setObjectives(prev => {
      const next = prev.map(o => o.id === id ? { ...o, completed: !o.completed } : o);
      storage.setForUser(user.id, STORAGE_KEYS.OBJECTIVES, next);
      return next;
    });
  };

  const deleteObjective = (id: string) => {
    if (!user) return;
    setObjectives(prev => {
      const next = prev.filter(o => o.id !== id);
      storage.setForUser(user.id, STORAGE_KEYS.OBJECTIVES, next);
      return next;
    });
  };

  const toggleGymDay = (dateStr: string) => {
    if (!user) return;
    setGymDays(prev => {
      const exists = prev.includes(dateStr);
      let next;
      if (exists) {
        next = prev.filter(d => d !== dateStr);
      } else {
        next = [...prev, dateStr];
      }
      storage.setForUser(user.id, STORAGE_KEYS.GYM_DAYS, next);
      return next;
    });
  };

  const dataContextValue = React.useMemo(() => ({
    topics,
    sessions,
    objectives,
    addTopic,
    updateTopic,
    addManualMinutes,
    deleteTopic,
    addObjective,
    updateObjective,
    toggleObjective,
    deleteObjective,
    gymDays,
    toggleGymDay
  }), [topics, sessions, objectives, gymDays, user?.id, hydratedUserId, activeTopicId]); // Dependencies for functions

  const timerContextValue = React.useMemo(() => ({
    activeTopicId,
    timerState,
    elapsedSeconds,
    selectTopic,
    startTimer,
    pauseTimer,
    stopTimer,
    resumeTimer
  }), [activeTopicId, timerState, elapsedSeconds, topics, user?.id]); // Dependencies for timer functions

  return (
    <DataContext.Provider value={dataContextValue}>
      <TimerContext.Provider value={timerContextValue}>
        {children}
      </TimerContext.Provider>
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a DataProvider');
  }
  return context;
};
