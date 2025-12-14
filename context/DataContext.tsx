
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Topic, Session, TimerState } from '../types';
import { storage } from '../services/storage';
import { STORAGE_KEYS, TOPIC_COLORS, TOPIC_ICONS } from '../constants';
import { predictTopicIcon } from '../services/geminiService';
import { useAuth } from './AuthContext';
import { generateUUID } from '../services/uuid';

interface DataContextType {
  topics: Topic[];
  sessions: Session[];
  activeTopicId: string | null;
  timerState: TimerState;
  elapsedSeconds: number;
  
  addTopic: (name: string, icon?: string) => void;
  deleteTopic: (id: string) => void;
  selectTopic: (topicId: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resumeTimer: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inject Auth to get userId
  const { user } = useAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Timer State (Ephemeral)
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // 1. Load Data When User Changes
  useEffect(() => {
    if (user) {
        const loadedTopics = storage.getForUser<Topic[]>(user.id, STORAGE_KEYS.TOPICS, []);
        const loadedSessions = storage.getForUser<Session[]>(user.id, STORAGE_KEYS.SESSIONS, []);
        setTopics(loadedTopics);
        setSessions(loadedSessions);
    } else {
        // Clear sensitive data from memory on logout
        setTopics([]);
        setSessions([]);
        setTimerState('idle');
        setElapsedSeconds(0);
        setActiveTopicId(null);
    }
  }, [user?.id]); // Only re-run if actual user ID changes

  // 2. Persist Data When It Changes (User Scoped)
  useEffect(() => {
    if (user && topics.length > 0) {
        storage.setForUser(user.id, STORAGE_KEYS.TOPICS, topics);
    } else if (user && topics.length === 0) {
        // Handle case where user deleted all topics, need to sync empty array
        // Check if we have ever saved to avoid overwriting initial load
        // But since we load on mount, this is safe-ish. 
        // Better: ensure we don't save empty array over existing data during initial mount race
        // The Load effect runs first.
        storage.setForUser(user.id, STORAGE_KEYS.TOPICS, topics);
    }
  }, [topics, user?.id]);

  useEffect(() => {
    if (user && sessions.length > 0) {
        storage.setForUser(user.id, STORAGE_KEYS.SESSIONS, sessions);
    } else if (user && sessions.length === 0) {
        storage.setForUser(user.id, STORAGE_KEYS.SESSIONS, sessions);
    }
  }, [sessions, user?.id]);

  // Timer Logic
  useEffect(() => {
    if (timerState === 'running') {
      startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
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
    
    setTopics(prev => [...prev, newTopic]);

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
    
    setTopics(prev => prev.filter(t => t.id !== id));
    setSessions(prev => prev.filter(s => s.topicId !== id));
  };

  const selectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    setElapsedSeconds(0);
    setTimerState('idle');
  };

  const startTimer = () => {
    if (activeTopicId) {
        setTimerState('running');
    }
  };

  const pauseTimer = () => {
    setTimerState('paused');
  };

  const resumeTimer = () => {
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
      
      setSessions(prev => [newSession, ...prev]);
      
      setTopics(prev => prev.map(t => {
        if (t.id === activeTopicId) {
          return { ...t, totalMinutes: t.totalMinutes + (duration / 60) };
        }
        return t;
      }));
    }

    setTimerState('idle');
    setElapsedSeconds(0);
    setActiveTopicId(null);
  };

  return (
    <DataContext.Provider value={{
      topics, sessions, activeTopicId, timerState, elapsedSeconds,
      addTopic, deleteTopic, selectTopic, startTimer, pauseTimer, stopTimer, resumeTimer
    }}>
      {children}
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
