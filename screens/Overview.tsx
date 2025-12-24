import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { Bell, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
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
};

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { sessions, topics, activeTopicId, elapsedSeconds } = useData();
  const [weekOffset, setWeekOffset] = useState(0);
  const [focusPeriod, setFocusPeriod] = useState<'3d' | '7d' | '30d'>('7d');

  // Merge active timer data into topics for real-time display
  const displayTopics = useMemo(() => {
    if (!activeTopicId) return topics;
    return topics.map(t => {
      if (t.id === activeTopicId) {
        return { ...t, totalMinutes: t.totalMinutes + (elapsedSeconds / 60) };
      }
      return t;
    });
  }, [topics, activeTopicId, elapsedSeconds]);

  // Merge active timer into sessions for streak check in real-time
  const displaySessions = useMemo(() => {
    if (activeTopicId && elapsedSeconds > 0) {
      const tempSession = {
        id: 'temp',
        topicId: activeTopicId,
        topicName: '', // not needed for calc
        startTime: Date.now() - elapsedSeconds * 1000,
        endTime: Date.now(),
        durationSeconds: elapsedSeconds
      };
      return [...sessions, tempSession];
    }
    return sessions;
  }, [sessions, activeTopicId, elapsedSeconds]);

  const streak = calculateStreak(displaySessions, user);
  const totalMinutes = displayTopics.reduce((acc, t) => acc + t.totalMinutes, 0);

  // Daily Goal (convert seconds to minutes for the chart). Default to 0 if not set.
  const dailyGoalMinutes = (user?.preferences.dailyGoalSeconds ?? 0) / 60;

  const focusRange = useMemo(() => {
    const now = new Date();
    const endMs = now.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const days = focusPeriod === '3d' ? 3 : focusPeriod === '7d' ? 7 : 30;
    const startMs = startOfToday - (days - 1) * dayMs;

    return { startMs, endMs, days };
  }, [focusPeriod]);

  const focusDistribution = useMemo(() => {
    const byTopic = new Map<string, { name: string; color: string; seconds: number }>();

    const topicMeta = new Map<string, { name: string; color: string }>();
    topics.forEach(t => {
      topicMeta.set(t.id, { name: t.name, color: t.color });
    });

    for (const s of displaySessions) {
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
  }, [displaySessions, focusRange.startMs, focusRange.endMs, topics]);

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

    // Process active session if running
    if (activeTopicId && elapsedSeconds > 0) {
      const now = new Date();
      if (now.getTime() >= weekRange.start.getTime() && now.getTime() <= weekRange.end.getTime()) {
        const dayIndex = (now.getDay() + 6) % 7;
        dayMap[dayIndex].minutes += (elapsedSeconds / 60);
      }
    }

    // Allow decimals for smooth visual updates
    return dayMap.map(d => ({ ...d, minutes: Number(d.minutes.toFixed(2)) }));
  }, [sessions, weekRange.start, weekRange.end, activeTopicId, elapsedSeconds]);

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

  return (
    <div className="flex flex-col h-full space-y-6 pb-24 animate-slide-up">

      {/* Header */}
      <div className="flex justify-between items-end pt-2 px-1">
        <div>
          <h2 className="text-[13px] font-semibold text-primary mb-1 opacity-90">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
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
      <Card gradient className="relative overflow-hidden border-0 shadow-xl shadow-blue-900/20">
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

      {/* Focus Distribution */}
      <Card className="shadow-sm">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="font-heading font-bold text-xl text-white tracking-tight text-left">Focus Distribution</h3>
          <select
            value={focusPeriod}
            onChange={(e) => setFocusPeriod(e.target.value as '3d' | '7d' | '30d')}
            className="bg-surfaceHighlight text-white text-[11px] font-semibold rounded-lg h-7 px-2 pr-6 outline-none border border-[#3A3A3C]/50 cursor-pointer hover:border-[#3A3A3C] hover:bg-[#323234] transition-all duration-200 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27%3e%3cpath fill=%27%238E8E93%27 d=%27M6 8L0 0h12z%27/%3e%3c/svg%3e')] bg-[length:10px] bg-[right_6px_center] bg-no-repeat"
          >
            <option value="3d">Last 3 days</option>
            <option value="7d">Last week</option>
            <option value="30d">Last month</option>
          </select>
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
      </Card>

      {/* Weekly Activity */}
      <Card className="shadow-sm">
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
      </Card>
    </div>
  );
};