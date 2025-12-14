import React from 'react';
import { AppTab } from '../types';
import { LayoutDashboard, Timer, MessageSquareText, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: AppTab.Overview, icon: LayoutDashboard, label: 'Overview' },
    { id: AppTab.Tracking, icon: Timer, label: 'Tracking' },
    { id: AppTab.Coach, icon: MessageSquareText, label: 'Coach' },
    { id: AppTab.Profile, icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
       {/* iOS Glassmorphism Background Container with Hairline Border */}
      <div className="absolute inset-0 glass-panel border-t border-[rgba(255,255,255,0.15)]" />
      
      {/* 
          Updated alignment: 
          - Used items-center to vertically center the icons.
          - Kept safe-area-bottom and a small padding-bottom to clear the home indicator comfortably.
      */}
      <div className="relative flex justify-around items-center h-[83px] max-w-md mx-auto safe-area-bottom pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center w-full h-12 active:opacity-70 transition-opacity"
            >
              <div className="mb-1 relative">
                <Icon 
                  size={26} 
                  className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-[#8E8E93]'}`} 
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-primary' : 'text-[#8E8E93]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};