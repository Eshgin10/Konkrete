
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { User as UserIcon, Flame, ChevronRight, Mail, Minus, Plus, Target, Lock, Eye, EyeOff, PieChart, BarChart3, Settings } from 'lucide-react';

const ListItem = ({
    icon: Icon,
    iconColor,
    label,
    value,
    onClick,
    isLast,
    showChevron = true
}: any) => (
    <div
        onClick={onClick}
        className="flex items-center pl-4 bg-[#1C1C1E] active:bg-[#2C2C2E] transition-colors cursor-pointer min-h-[56px]"
    >
        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center mr-4 shadow-sm`} style={{ backgroundColor: iconColor }}>
            <Icon size={18} className="text-white stroke-[2.5]" />
        </div>
        <div className={`flex-1 flex items-center justify-between pr-4 py-4 border-b ${isLast ? 'border-transparent' : 'border-[#38383A]'}`}>
            <span className="text-[17px] text-white font-medium tracking-tight">{label}</span>
            <div className="flex items-center text-[#8E8E93]">
                <span className="text-[17px] mr-2">{value}</span>
                {showChevron && <ChevronRight size={18} className="opacity-40" />}
            </div>
        </div>
    </div>
);

const CounterControl = ({ label, value, onChange, min = 0, unit = '' }: { label: string, value: number, onChange: (val: number) => void, min?: number, unit?: string }) => (
    <div className="flex items-center justify-between bg-[#2C2C2E] rounded-2xl p-4">
        <span className="text-[17px] font-medium text-white">{label}</span>
        <div className="flex items-center gap-4">
            <button
                onClick={() => onChange(Math.max(min, value - 1))}
                className="w-10 h-10 rounded-full bg-[#3A3A3C] flex items-center justify-center active:scale-95 transition-transform"
            >
                <Minus size={20} className="text-white" />
            </button>
            <span className="text-[17px] font-bold text-white tabular-nums w-12 text-center">
                {value}{unit}
            </span>
            <button
                onClick={() => onChange(value + 1)}
                className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-blue-500/20"
            >
                <Plus size={20} className="text-white" />
            </button>
        </div>
    </div>
);

export const Profile = () => {
    const { user, logout, updateProfile } = useAuth();

    // Modes: 'none' | 'details' | 'streak' | 'dailyGoal'
    const [editMode, setEditMode] = useState<'none' | 'details' | 'streak' | 'dailyGoal'>('none');

    // Details State
    const [name, setName] = useState(user?.displayName || '');
    const [showPassword, setShowPassword] = useState(false);

    // Streak State
    const totalSecs = user?.preferences.streakMinSeconds || 600;
    const [streakHours, setStreakHours] = useState(Math.floor(totalSecs / 3600));
    const [streakMins, setStreakMins] = useState(Math.floor((totalSecs % 3600) / 60));
    const [streakSecs, setStreakSecs] = useState(totalSecs % 60);
    const [streakTopics, setStreakTopics] = useState(user?.preferences.streakMinTopics || 1);

    // Daily Goal State
    // Default to 0 if not present, to represent "not set"
    const dailyGoalTotalSecs = user?.preferences.dailyGoalSeconds ?? 0;
    const [goalHours, setGoalHours] = useState(Math.floor(dailyGoalTotalSecs / 3600));
    const [goalMins, setGoalMins] = useState(Math.floor((dailyGoalTotalSecs % 3600) / 60));
    const [goalSecs, setGoalSecs] = useState(dailyGoalTotalSecs % 60);

    const handleSaveDetails = () => {
        updateProfile({ displayName: name });
        setEditMode('none');
    };

    const handleSaveStreak = () => {
        const total = (streakHours * 3600) + (streakMins * 60) + streakSecs;
        updateProfile({
            preferences: {
                ...user?.preferences!,
                streakMinSeconds: total,
                streakMinTopics: streakTopics
            }
        });
        setEditMode('none');
    };

    const handleSaveDailyGoal = () => {
        const total = (goalHours * 3600) + (goalMins * 60) + goalSecs;
        updateProfile({
            preferences: {
                ...user?.preferences!,
                dailyGoalSeconds: total
            }
        });
        setEditMode('none');
    };

    const handleToggleFocusView = () => {
        const currentView = user?.preferences.focusDistributionView || 'pie';
        const newView = currentView === 'pie' ? 'bar' : 'pie';

        updateProfile({
            preferences: {
                ...user?.preferences!,
                focusDistributionView: newView
            }
        });
    };

    const openStreakSettings = () => {
        const s = user?.preferences.streakMinSeconds || 600;
        setStreakHours(Math.floor(s / 3600));
        setStreakMins(Math.floor((s % 3600) / 60));
        setStreakSecs(s % 60);
        setStreakTopics(user?.preferences.streakMinTopics || 1);
        setEditMode('streak');
    };

    const openDailyGoalSettings = () => {
        const s = user?.preferences.dailyGoalSeconds ?? 0;
        setGoalHours(Math.floor(s / 3600));
        setGoalMins(Math.floor((s % 3600) / 60));
        setGoalSecs(s % 60);
        setEditMode('dailyGoal');
    };

    const getSummaryText = () => {
        const parts = [];
        if (streakHours > 0) parts.push(`${streakHours} hour${streakHours !== 1 ? 's' : ''}`);
        if (streakMins > 0) parts.push(`${streakMins} minute${streakMins !== 1 ? 's' : ''}`);
        if (streakSecs > 0) parts.push(`${streakSecs} second${streakSecs !== 1 ? 's' : ''}`);

        const timeString = parts.length > 0 ? parts.join(' ') : '0 seconds';
        const topicString = `${streakTopics} topic${streakTopics !== 1 ? 's' : ''}`;

        return (
            <span className="text-[15px] text-[#8E8E93] leading-relaxed block text-center mt-4 px-2">
                To keep your streak alive, you must complete at least <strong className="text-white">{timeString}</strong> of focus across <strong className="text-white">{topicString}</strong>.
            </span>
        );
    };

    const formatDailyGoalPreview = () => {
        const s = user?.preferences.dailyGoalSeconds ?? 0;
        if (s === 0) return 'Not Set';

        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;

        let str = '';
        if (h > 0) str += `${h}h `;
        if (m > 0) str += `${m}m `;
        if (sec > 0) str += `${sec}s`;
        if (!str) str = '0s';

        return str.trim();
    };

    return (
        <div className="flex flex-col h-full pb-32 animate-slide-up bg-black">
            <div className="px-1 pt-2 mb-8">
                <h1 className="font-heading text-4xl font-bold text-white tracking-tight">Profile</h1>
            </div>

            <div className="flex items-center space-x-5 mb-10 px-1">
                <div className="w-[88px] h-[88px] rounded-full bg-[#2C2C2E] flex items-center justify-center text-3xl font-medium text-[#8E8E93] border border-[#38383A] shadow-lg">
                    {user?.displayName?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="font-heading text-2xl font-bold text-white leading-tight tracking-tight mb-1">{user?.displayName}</h2>
                    <p className="text-[15px] text-[#8E8E93] font-medium">{user?.email}</p>
                </div>
            </div>

            {editMode === 'details' && (
                <div className="px-1 space-y-6 animate-fade-in">
                    <div className="bg-[#1C1C1E] rounded-2xl p-6 space-y-4">
                        <h3 className="font-heading text-xl font-bold text-white mb-2">Edit Details</h3>
                        <Input label="Display Name" value={name} onChange={(e) => setName(e.target.value)} />
                        <div className="opacity-50 pointer-events-none">
                            <Input label="Email (Read Only)" value={user?.email || ''} readOnly />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                        <Button variant="secondary" onClick={() => setEditMode('none')} fullWidth>Cancel</Button>
                        <Button onClick={handleSaveDetails} fullWidth>Save</Button>
                    </div>
                </div>
            )}

            {editMode === 'streak' && (
                <div className="px-1 space-y-6 animate-fade-in">
                    <div className="bg-[#1C1C1E] rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-heading text-xl font-bold text-white">Streak Config</h3>
                            <Flame size={24} className="text-[#FF9F0A] fill-[#FF9F0A]/20" />
                        </div>
                        <p className="text-[15px] text-textSecondary mb-4">Daily requirements to keep your streak alive.</p>

                        <CounterControl
                            label="Hours"
                            value={streakHours}
                            onChange={setStreakHours}
                            unit="h"
                        />
                        <CounterControl
                            label="Minutes"
                            value={streakMins}
                            onChange={(v) => {
                                if (v >= 60) { setStreakHours(h => h + 1); setStreakMins(0); }
                                else if (v < 0) { if (streakHours > 0) { setStreakHours(h => h - 1); setStreakMins(59); } }
                                else setStreakMins(v);
                            }}
                            unit="m"
                        />
                        <CounterControl
                            label="Seconds"
                            value={streakSecs}
                            onChange={(v) => {
                                if (v >= 60) { setStreakMins(m => m + 1); setStreakSecs(0); }
                                else if (v < 0) { if (streakMins > 0) { setStreakMins(m => m - 1); setStreakSecs(59); } }
                                else setStreakSecs(v);
                            }}
                            unit="s"
                        />
                        <CounterControl
                            label="Min Topics"
                            value={streakTopics}
                            onChange={setStreakTopics}
                            min={1}
                        />

                        {getSummaryText()}
                    </div>
                    <div className="flex gap-4 pt-2">
                        <Button variant="secondary" onClick={() => setEditMode('none')} fullWidth>Cancel</Button>
                        <Button onClick={handleSaveStreak} fullWidth>Save</Button>
                    </div>
                </div>
            )}

            {editMode === 'dailyGoal' && (
                <div className="px-1 space-y-6 animate-fade-in">
                    <div className="bg-[#1C1C1E] rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-heading text-xl font-bold text-white">Daily Goal</h3>
                            <Target size={24} className="text-[#30D158]" />
                        </div>
                        <p className="text-[15px] text-textSecondary mb-4">Set your target daily focus time. This will appear on your activity chart.</p>

                        <CounterControl
                            label="Hours"
                            value={goalHours}
                            onChange={setGoalHours}
                            unit="h"
                        />
                        <CounterControl
                            label="Minutes"
                            value={goalMins}
                            onChange={(v) => {
                                if (v >= 60) { setGoalHours(h => h + 1); setGoalMins(0); }
                                else if (v < 0) { if (goalHours > 0) { setGoalHours(h => h - 1); setGoalMins(59); } }
                                else setGoalMins(v);
                            }}
                            unit="m"
                        />
                        <CounterControl
                            label="Seconds"
                            value={goalSecs}
                            onChange={(v) => {
                                if (v >= 60) { setGoalMins(m => m + 1); setGoalSecs(0); }
                                else if (v < 0) { if (goalMins > 0) { setGoalMins(m => m - 1); setGoalSecs(59); } }
                                else setGoalSecs(v);
                            }}
                            unit="s"
                        />
                    </div>
                    <div className="flex gap-4 pt-2">
                        <Button variant="secondary" onClick={() => setEditMode('none')} fullWidth>Cancel</Button>
                        <Button onClick={handleSaveDailyGoal} fullWidth>Save</Button>
                    </div>
                </div>
            )}

            {editMode === 'none' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="overflow-hidden rounded-2xl mx-1 bg-[#1C1C1E]">
                        <ListItem
                            icon={UserIcon}
                            iconColor="#007AFF"
                            label="Personal Details"
                            value="Edit"
                            onClick={() => { setName(user?.displayName || ''); setEditMode('details'); }}
                            isLast={false}
                        />
                        <ListItem
                            icon={Mail}
                            iconColor="#32ADE6"
                            label="Email"
                            value={user?.email?.split('@')[0] + '...'}
                            isLast={!user?.password}
                            showChevron={false}
                        />
                        {user?.password && (
                            <ListItem
                                icon={Lock}
                                iconColor="#FF2D55"
                                label="Password"
                                value={
                                    <div className="flex items-center gap-2">
                                        <span className="tabular-nums">{showPassword ? user.password : '••••••••'}</span>
                                        {showPassword ? <EyeOff size={16} className="opacity-50" /> : <Eye size={16} className="opacity-50" />}
                                    </div>
                                }
                                onClick={() => setShowPassword(!showPassword)}
                                isLast={true}
                                showChevron={false}
                            />
                        )}
                    </div>

                    <div className="overflow-hidden rounded-2xl mx-1 bg-[#1C1C1E]">
                        <ListItem
                            icon={Flame}
                            iconColor="#FF9F0A"
                            label="Streak Settings"
                            value=""
                            onClick={openStreakSettings}
                            isLast={false}
                        />
                        <ListItem
                            icon={Target}
                            iconColor="#30D158"
                            label="Daily Goal"
                            value={formatDailyGoalPreview()}
                            onClick={openDailyGoalSettings}
                            isLast={false}
                        />
                        <ListItem
                            icon={Settings}
                            iconColor="#8E8E93"
                            label="Focus Distribution View"
                            value={user?.preferences.focusDistributionView === 'bar' ? 'Bar Graph' : 'Pie Chart'}
                            onClick={handleToggleFocusView}
                            isLast={true}
                        />
                    </div>

                    <div className="overflow-hidden rounded-2xl mx-1">
                        <button
                            onClick={logout}
                            className="w-full bg-[#1C1C1E] active:bg-[#2C2C2E] flex items-center justify-center h-[56px] text-[17px] text-[#FF453A] font-medium transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>

                    <p className="text-center text-[13px] text-[#8E8E93] opacity-60 font-medium">
                        Konkrete v1.0.0 (2024.10)
                    </p>
                </div>
            )}
        </div>
    );
};
