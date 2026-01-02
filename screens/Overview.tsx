import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { Bell, Flame, ChevronLeft, ChevronRight, ChevronDown, Target, Plus, Trash2, Check, ExternalLink, Pencil, Dumbbell, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppScreen, User, Session } from '../types';

interface OverviewProps {
  onNavigate: (screen: AppScreen) => void;
}

const calculateStreak = (sessions: Session[], user: User | null) => {
  if (!user) return 0;

  const minSeconds = user.preferences.streakMinSeconds || 600;
  const minTopics = user.preferences.streakMinTopics || 1;

  const getDayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const now = new Date();
  const todayStart = getDayStart(now);

  const dailyTotals = new Map<number, { seconds: number; topics: Set<string> }>();

  for (const s of sessions) {
    const startTime = Number.isFinite(s?.startTime) ? s.startTime : (Number.isFinite(s?.endTime) ? s.endTime : NaN);
    const endTime = Number.isFinite(s?.endTime) ? s.endTime : (Number.isFinite(s?.startTime) ? s.startTime : NaN);
    const topicId = typeof s?.topicId === 'string' ? s.topicId : '';

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || !topicId) continue;

    const normalizedStart = Math.min(startTime, endTime);
    const normalizedEnd = Math.max(startTime, endTime);
    if (normalizedEnd <= normalizedStart) continue;

    let cursor = getDayStart(new Date(normalizedStart));
    const lastDayStart = getDayStart(new Date(normalizedEnd));

    while (cursor <= lastDayStart) {
      const dayStart = cursor;
      const dayEnd = dayStart + dayMs;
      const overlapStart = Math.max(normalizedStart, dayStart);
      const overlapEnd = Math.min(normalizedEnd, dayEnd);

      if (overlapEnd > overlapStart) {
        const seconds = Math.floor((overlapEnd - overlapStart) / 1000);
        const prev = dailyTotals.get(dayStart) || { seconds: 0, topics: new Set<string>() };
        prev.seconds += seconds;
        prev.topics.add(topicId);
        dailyTotals.set(dayStart, prev);
      }

      cursor += dayMs;
    }
  }

  const meetsRequirements = (dayStart: number) => {
    const entry = dailyTotals.get(dayStart);
    if (!entry) return false;
    return entry.seconds >= minSeconds && entry.topics.size >= minTopics;
  };

  let streak = 0;
  let dayCursor = todayStart;
  while (meetsRequirements(dayCursor)) {
    streak += 1;
    dayCursor -= dayMs;
    if (streak > 3650) break;
  }

  return streak;
};

// Updated format: Always 0h 0m 0s
const formatDuration = (totalMinutes: number) => {
  const totalSeconds = Math.floor(totalMinutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
};

// Compact formatter for chart center
const formatDurationCenter = (totalMinutes: number) => {
  const totalSeconds = Math.floor(totalMinutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) return { val: `${h}h ${m}m`, unit: `${s}s` };
  if (m > 0) return { val: `${m}m`, unit: `${s}s` };
  return { val: `0h 0m`, unit: `${s}s` };
  if (m > 0) return { val: `${m}m`, unit: `${s}s` };
  return { val: `0h 0m`, unit: `${s}s` };
};

const getWeekNumber = (d: Date) => {
  // ISO 8601 week number
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return {
    year: date.getUTCFullYear(),
    week: Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  };
};

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { sessions, topics, objectives, addObjective, deleteObjective, toggleObjective, updateObjective, gymDays, toggleGymDay } = useData();
  const [weekOffset, setWeekOffset] = useState(0);

  // Gym Calendar State
  const [gymMonthOffset, setGymMonthOffset] = useState(0);

  // Weekly Objectives State (Locked to current week)
  const [isAddingObjective, setIsAddingObjective] = useState(false);
  const [newObjectiveText, setNewObjectiveText] = useState('');

  // Editing State
  const [editingObjectiveId, setEditingObjectiveId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const currentObjectiveWeek = useMemo(() => {
    return getWeekNumber(new Date());
  }, []);

  const weekObjectives = useMemo(() => {
    return objectives.filter(o => o.year === currentObjectiveWeek.year && o.week === currentObjectiveWeek.week);
  }, [objectives, currentObjectiveWeek]);

  const handleAddObjective = () => {
    if (!newObjectiveText.trim()) return;
    addObjective(newObjectiveText, currentObjectiveWeek.year, currentObjectiveWeek.week);
    setNewObjectiveText('');
    setIsAddingObjective(false);
  };

  const startEditing = (id: string, currentText: string) => {
    setEditingObjectiveId(id);
    setEditingText(currentText);
  };

  const handleUpdateObjective = () => {
    if (editingObjectiveId && editingText.trim()) {
      updateObjective(editingObjectiveId, editingText);
      setEditingObjectiveId(null);
      setEditingText('');
    }
  };

  const handleToggleObjective = (id: string, currentlyCompleted: boolean) => {
    toggleObjective(id);
    if (!currentlyCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };
  const [focusPeriod, setFocusPeriod] = useState<'today' | 'this_week' | '3d' | '7d' | '30d' | 'all_time'>(() => {
    const saved = localStorage.getItem('focusPeriod');
    return (saved as 'today' | 'this_week' | '3d' | '7d' | '30d' | 'all_time') || 'this_week';
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);



  React.useEffect(() => {
    localStorage.setItem('focusPeriod', focusPeriod);
  }, [focusPeriod]);

  const streak = calculateStreak(sessions, user);
  const totalMinutes = topics.reduce((acc, t) => acc + t.totalMinutes, 0);

  // Daily Goal (convert seconds to minutes for the chart). Default to 0 if not set.
  const dailyGoalMinutes = (user?.preferences.dailyGoalSeconds ?? 0) / 60;

  const focusRange = useMemo(() => {
    const now = new Date();
    const endMs = now.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    if (focusPeriod === 'all_time') {
      return { startMs: 0, endMs };
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let startMs = 0;

    if (focusPeriod === 'today') {
      startMs = startOfToday;
    } else if (focusPeriod === 'this_week') {
      const currentDay = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
      startMs = startOfToday - (currentDay - 1) * dayMs;
    } else {
      const days = focusPeriod === '3d' ? 3 : focusPeriod === '7d' ? 7 : 30;
      startMs = startOfToday - (days - 1) * dayMs;
    }

    return { startMs, endMs };
  }, [focusPeriod]);

  const focusDistribution = useMemo(() => {
    const byTopic = new Map<string, { name: string; color: string; seconds: number }>();

    const topicMeta = new Map<string, { name: string; color: string }>();
    topics.forEach(t => {
      topicMeta.set(t.id, { name: t.name, color: t.color });
    });

    for (const s of sessions) {
      const startTime = Number.isFinite(s?.startTime) ? s.startTime : (Number.isFinite(s?.endTime) ? s.endTime : NaN);
      const endTime = Number.isFinite(s?.endTime) ? s.endTime : (Number.isFinite(s?.startTime) ? s.startTime : NaN);
      const topicId = typeof s?.topicId === 'string' ? s.topicId : '';
      if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || !topicId) continue;

      const normalizedStart = Math.min(startTime, endTime);
      const normalizedEnd = Math.max(startTime, endTime);
      if (normalizedEnd <= focusRange.startMs || normalizedStart >= focusRange.endMs) continue;

      const overlapStart = Math.max(normalizedStart, focusRange.startMs);
      const overlapEnd = Math.min(normalizedEnd, focusRange.endMs);
      if (overlapEnd <= overlapStart) continue;

      const seconds = Math.floor((overlapEnd - overlapStart) / 1000);
      const meta = topicMeta.get(topicId);
      const name = meta?.name || s.topicName || 'Unknown';
      const color = meta?.color || '#2C2C2E';

      const prev = byTopic.get(topicId) || { name, color, seconds: 0 };
      prev.seconds += seconds;
      byTopic.set(topicId, prev);
    }

    const items = Array.from(byTopic.entries()).map(([topicId, v]) => ({
      topicId,
      name: v.name,
      color: v.color,
      minutes: v.seconds / 60,
      seconds: v.seconds,
    })).filter(i => i.seconds > 0);

    items.sort((a, b) => b.seconds - a.seconds);

    const totalSecondsInPeriod = items.reduce((acc, i) => acc + i.seconds, 0);

    return {
      items,
      chartData: items.map(i => ({ name: i.name, value: i.minutes, color: i.color })),
      totalMinutesInPeriod: totalSecondsInPeriod / 60,
    };
  }, [sessions, focusRange.startMs, focusRange.endMs, topics]);

  // Weekly Data Logic
  const getWeekDateRange = (offset: number) => {
    const now = new Date();
    const currentDay = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
    const start = new Date(now);
    start.setDate(now.getDate() - currentDay + 1 + (offset * 7));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { text: `${fmt(start)} - ${fmt(end)}`, start, end };
  };

  const weekRange = getWeekDateRange(weekOffset);

  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Initialize map
    const dayMap = days.map(d => ({ name: d, minutes: 0 }));

    // Process completed sessions
    sessions.forEach(session => {
      const bucketTime = Number.isFinite(session?.endTime) ? session.endTime : session?.startTime;
      if (!Number.isFinite(bucketTime)) return;
      if (bucketTime >= weekRange.start.getTime() && bucketTime <= weekRange.end.getTime()) {
        const date = new Date(bucketTime);
        const dayIndex = (date.getDay() + 6) % 7; // Mon=0, Sun=6
        if (!Number.isFinite(dayIndex) || dayIndex < 0 || dayIndex > 6) return;
        const durationSeconds = Number.isFinite(session?.durationSeconds) ? session.durationSeconds : 0;
        dayMap[dayIndex].minutes += (durationSeconds / 60);
      }
    });

    // Allow decimals for smooth visual updates
    return dayMap.map(d => ({ ...d, minutes: Number(d.minutes.toFixed(2)) }));
  }, [sessions, weekRange.start, weekRange.end]);

  // Calculate Y-axis domain to ensure Goal Line is always visible (if set)
  // We find the max value in the data, compare it to the goal (if > 0), and add some padding.
  const maxDataValue = Math.max(...weeklyData.map(d => d.minutes), 0.1);
  const targets = dailyGoalMinutes > 0 ? [maxDataValue, dailyGoalMinutes] : [maxDataValue];
  const yAxisMax = Math.max(...targets) * 1.2;

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const centerText = formatDurationCenter(focusDistribution.totalMinutesInPeriod);

  // Gym Stats Calculation
  const gymStats = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Filter gym days to only include this year
    const gymDaysThisYear = gymDays.filter(d => d.startsWith(`${now.getFullYear()}-`));
    const count = gymDaysThisYear.length;
    const percentage = dayOfYear > 0 ? Math.round((count / dayOfYear) * 100) : 0;

    return { count, percentage };
  }, [gymDays]);

  // Calendar Grid Generation
  const calendarData = useMemo(() => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + gymMonthOffset, 1);
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    const startDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).getDay() || 7; // ISO: 1-7

    // Generate dates
    const days = [];
    // Empty slots for start padding
    for (let i = 1; i < startDay; i++) {
      days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(targetDate.getFullYear(), targetDate.getMonth(), i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ day: i, iso });
    }

    return { monthName, days };
  }, [gymMonthOffset]);

  return (
    <div className="flex flex-col h-full space-y-6 pb-24 animate-slide-up">

      {/* Header */}
      {/* Header */}
      <div className="flex justify-between items-end pt-2 px-1">
        <div>
          <h2 className="text-[13px] font-semibold text-primary mb-1 opacity-90">
            {new Date().getFullYear()} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-white leading-tight">{getGreeting()}</h1>
        </div>
        <div
          onClick={() => onNavigate('Notifications')}
          className="w-12 h-12 bg-surfaceHighlight rounded-full flex items-center justify-center cursor-pointer active:opacity-70 transition-opacity"
        >
          <Bell size={24} className="text-textSecondary" />
        </div>
      </div>

      {/* Streak Card */}
      <Card className="relative overflow-hidden border border-white/5 shadow-2xl shadow-black/50 bg-gradient-to-br from-[#323234] to-[#18181a]">
        <div className="relative z-10 flex flex-row items-center justify-between px-2">
          <div>
            <div className="text-[13px] font-bold text-white/80 mb-2">Current Streak</div>
            <div className="text-6xl font-bold text-white leading-none tracking-tighter flex items-baseline gap-2">
              {streak} <span className="text-2xl font-medium opacity-60 tracking-normal">days</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Flame size={64} className="text-white fill-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </Card>


      {/* Objective Card */}
      <Card className="shadow-sm">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-primary" />
            <h3 className="font-heading font-bold text-xl text-white tracking-tight text-left">Weekly Objectives</h3>
          </div>
          <div className="flex items-center gap-2 bg-[#2C2C2E] rounded-lg p-2">
            <span className="text-[12px] font-semibold tabular-nums text-white min-w-[50px] text-center">
              Week {currentObjectiveWeek.week}
            </span>
          </div>
        </div>

        <div className="px-2 flex flex-col gap-2">
          {weekObjectives.length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              {weekObjectives.map(obj => (
                <div key={obj.id} className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${obj.completed
                  ? 'bg-green-500/20 border-green-500/30'
                  : 'bg-[#2C2C2E]/50 border-white/5 hover:border-white/10'
                  }`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleObjective(obj.id, obj.completed)}
                      className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${obj.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-[#48484A] hover:border-primary/50'
                        }`}
                    >
                      {obj.completed && <Check size={14} className="text-white animate-in zoom-in duration-200" />}
                    </button>

                    {editingObjectiveId === obj.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={handleUpdateObjective}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateObjective()}
                        className="flex-1 bg-transparent text-white text-[16px] font-medium outline-none border-b border-primary/50 pb-0.5"
                      />
                    ) : (
                      <span className={`text-[16px] font-medium truncate transition-all duration-300 ${obj.completed ? 'text-white' : 'text-gray-200'
                        }`}>
                        {obj.text}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(obj.id, obj.text)}
                      className="p-2 text-textSecondary hover:text-white transition-all"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteObjective(obj.id)}
                      className="p-2 text-textSecondary hover:text-[#FF453A] transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Objective Button / Input */}
          <button
            onClick={() => setIsAddingObjective(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-[#3A3A3C] text-textSecondary hover:text-white hover:border-[#5A5A5E] hover:bg-[#3A3A3C]/10 transition-all group"
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Add Objective</span>
          </button>
        </div>
      </Card>

      {/* Gym Card */}
      < Card className="shadow-sm" >
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <Dumbbell size={20} className="text-primary" />
            <h3 className="font-heading font-bold text-xl text-white tracking-tight text-left">Gym</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-textSecondary font-bold">Progress</span>
              <span className="text-white font-bold text-sm tabular-nums">{gymStats.percentage}%</span>
            </div>
            <div className="w-[1px] h-6 bg-[#3A3A3C]"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-textSecondary font-bold">Total Days</span>
              <span className="text-white font-bold text-sm tabular-nums">{gymStats.count}</span>
            </div>
          </div>
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between bg-[#2C2C2E]/50 rounded-t-xl p-3 border-b border-white/5">
          <button onClick={() => setGymMonthOffset(p => p - 1)} className="p-1 text-textSecondary hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px] font-semibold text-white">{calendarData.monthName}</span>
          <button onClick={() => setGymMonthOffset(p => p + 1)} className="p-1 text-textSecondary hover:text-white transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-[#1C1C1E] border border-white/5 border-t-0 rounded-b-xl p-4">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <span key={i} className="text-[10px] font-bold text-[#8E8E93]">{day}</span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-y-2 place-items-center">
            {calendarData.days.map((d, i) => {
              if (!d) return <div key={i} />;
              const isChecked = gymDays.includes(d.iso);
              const isToday = d.iso === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={d.iso}
                  onClick={() => toggleGymDay(d.iso)}
                  className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium cursor-pointer transition-all duration-200 select-none
                        ${isChecked
                      ? 'bg-primary text-white shadow-[0_0_10px_rgba(0,122,255,0.4)] scale-105'
                      : 'bg-[#2C2C2E] text-[#8E8E93] hover:bg-[#3A3A3C] hover:text-white'
                    }
                        ${isToday && !isChecked ? 'ring-1 ring-primary text-primary' : ''}
                     `}
                >
                  {d.day}
                </div>
              );
            })}
          </div>
        </div>
      </Card >

      {/* Focus Distribution */}
      < Card className="shadow-sm" >
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="font-heading font-bold text-xl text-white tracking-tight text-left">Focus Distribution</h3>
          <div className="relative z-20">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 bg-surfaceHighlight text-white text-[11px] font-semibold rounded-lg h-7 px-2.5 outline-none border border-[#3A3A3C]/50 cursor-pointer hover:border-[#3A3A3C] hover:bg-[#323234] transition-all duration-200"
            >
              <span>
                {focusPeriod === 'today' && 'Today'}
                {focusPeriod === 'this_week' && 'This Week'}
                {focusPeriod === '3d' && 'Last 3 Days'}
                {focusPeriod === '7d' && 'Last 7 Days'}
                {focusPeriod === '30d' && 'Last Month'}
                {focusPeriod === 'all_time' && 'All Time'}
              </span>
              <ChevronDown size={12} className={`text-textSecondary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-32 bg-[#1C1C1E]/95 backdrop-blur-xl border border-[#3A3A3C]/50 rounded-xl shadow-2xl py-1 z-20 overflow-hidden ring-1 ring-black/5">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'this_week', label: 'This Week' },
                    { id: '3d', label: 'Last 3 Days' },
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '30d', label: 'Last Month' },
                    { id: 'all_time', label: 'All Time' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setFocusPeriod(option.id as any);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] font-medium transition-colors ${focusPeriod === option.id
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-200 hover:bg-[#323234]'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-64 w-64 relative flex-shrink-0 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={focusDistribution.chartData.length ? focusDistribution.chartData : [{ value: 1 }]}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={8}
                  animationDuration={1400}
                  animationBegin={200}
                  animationEasing="ease-out"
                >
                  {focusDistribution.chartData.length ? focusDistribution.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  )) : <Cell fill="#2C2C2E" />}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold tabular-nums tracking-tight text-white">{centerText.val}</span>
              <span className="text-sm text-textSecondary font-medium mt-1">{centerText.unit}</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2 px-2">
            {focusDistribution.items.map(t => (
              <div key={t.topicId} className="flex items-center justify-between text-[15px] bg-surfaceHighlight/30 p-3 rounded-lg">
                <div className="flex items-center min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full mr-2.5 flex-shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="text-gray-200 font-medium tracking-tight truncate">{t.name}</span>
                </div>
                <span className="text-textSecondary text-[13px] ml-2 tabular-nums font-semibold">{formatDuration(t.minutes)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card >

      {/* Weekly Activity */}
      < Card className="shadow-sm" >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 bg-[#2C2C2E] rounded-lg p-1">
            <button onClick={() => setWeekOffset(p => p - 1)} className="p-1 text-textSecondary hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-[13px] font-semibold tabular-nums text-white min-w-[100px] text-center">
              {weekRange.text}
            </span>
            <button onClick={() => setWeekOffset(p => p + 1)} className="p-1 text-textSecondary hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <h3 className="font-heading font-bold text-sm text-textSecondary uppercase tracking-wider">Activity</h3>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8E8E93', fontSize: 12 }}
                dy={10}
              />
              {/* Explicitly set YAxis domain to ensure goal line is visible if set */}
              <YAxis
                hide
                domain={[0, yAxisMax]}
              />
              <Tooltip
                cursor={{ fill: '#2C2C2E', stroke: 'none' }}
                contentStyle={{ backgroundColor: '#1C1C1E', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${Math.round(value)} mins`, 'Focus']}
              />
              {dailyGoalMinutes > 0 && (
                <ReferenceLine
                  y={dailyGoalMinutes}
                  stroke="#FF453A"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  opacity={0.8}
                />
              )}
              <Bar
                dataKey="minutes"
                fill="#007AFF"
                radius={[4, 4, 4, 4]}
                barSize={32}
                isAnimationActive={false}
              >
                {weeklyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.minutes > 0.1 ? '#007AFF' : '#2C2C2E'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card >

      {/* Add Objective Modal */}
      {isAddingObjective && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 sm:items-center sm:pt-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#2C2C2E]/30">
              <h3 className="font-heading font-bold text-lg text-white">Add Objective</h3>
              <button
                onClick={() => setIsAddingObjective(false)}
                className="p-1 text-textSecondary hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
                  Goal for week {currentObjectiveWeek.week}
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newObjectiveText}
                  onChange={(e) => setNewObjectiveText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddObjective()}
                  placeholder="What is your main focus?"
                  className="w-full bg-[#2C2C2E] text-white text-[15px] px-4 py-3.5 rounded-xl border border-white/10 focus:border-primary/50 outline-none placeholder:text-textSecondary/50 transition-colors"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsAddingObjective(false)}
                  className="flex-1 py-3 rounded-xl bg-[#2C2C2E] text-textSecondary font-medium hover:bg-[#3A3A3C] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddObjective}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Add Objective
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};