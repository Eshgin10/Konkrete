
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Star, Trophy, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../constants';
import { Notification } from '../types';
import { useAuth } from '../context/AuthContext';

interface NotificationsProps {
  onBack: () => void;
}

const ICON_MAP: Record<string, any> = {
  'trophy': Trophy,
  'zap': Zap,
  'star': Star,
  'bell': Bell
};

const formatTimeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const Notifications: React.FC<NotificationsProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    // Load from user storage
    const stored = storage.getForUser<Notification[]>(user.id, STORAGE_KEYS.NOTIFICATIONS, []);
    setNotifications(stored.sort((a, b) => b.timestamp - a.timestamp));
  }, [user]);

  const markAllAsRead = () => {
    if (!user) return;
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    storage.setForUser(user.id, STORAGE_KEYS.NOTIFICATIONS, updated);
  };

  return (
    <div className="flex flex-col h-full animate-slide-up pb-24">
      {/* Header */}
      <div className="flex items-center pt-2 px-1 mb-6">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary active:opacity-70 transition-opacity mr-4"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">Notifications</h1>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4 px-1">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const Icon = ICON_MAP[notif.icon] || Bell;
            return (
              <div 
                key={notif.id}
                className={`
                  relative p-4 rounded-2xl flex gap-4 transition-colors
                  ${notif.read ? 'bg-surface' : 'bg-surfaceHighlight border border-white/5'}
                `}
              >
                {!notif.read && (
                  <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(0,122,255,0.6)]" />
                )}
                
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-background/50"
                >
                  <Icon size={22} color={notif.color} strokeWidth={2.5} />
                </div>
                
                <div className="flex-1 pr-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-heading font-semibold text-[15px] text-white leading-tight">{notif.title}</h3>
                    <span className="text-[12px] text-textSecondary font-medium">{formatTimeAgo(notif.timestamp)}</span>
                  </div>
                  <p className="text-[14px] text-textSecondary leading-snug">{notif.message}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <Bell size={48} className="text-textSecondary mb-4" />
            <p className="text-lg font-medium text-white">All caught up</p>
            <p className="text-sm text-textSecondary">No new notifications at the moment.</p>
          </div>
        )}
      </div>
      
      {notifications.length > 0 && notifications.some(n => !n.read) && (
          <div className="mt-8 px-4">
            <button 
                onClick={markAllAsRead}
                className="w-full text-center text-[15px] text-primary font-semibold py-4 active:opacity-60 transition-opacity"
            >
                Mark all as read
            </button>
          </div>
      )}
    </div>
  );
};
