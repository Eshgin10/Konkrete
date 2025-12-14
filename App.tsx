import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Onboarding } from './screens/Onboarding';
import { AuthScreen } from './screens/Auth';
import { BottomNav } from './components/BottomNav';
import { AppTab, AppScreen } from './types';
import { storage } from './services/storage';
import { STORAGE_KEYS } from './constants';

// Screens
import { Overview } from './screens/Overview';
import { Tracking } from './screens/Tracking';
import { Coach } from './screens/Coach';
import { Profile } from './screens/Profile';
import { Notifications } from './screens/Notifications';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppTab.Overview);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const done = storage.get<boolean>(STORAGE_KEYS.ONBOARDING_DONE, false);
    setOnboardingComplete(done);
    setCheckingOnboarding(false);
  }, []);

  const completeOnboarding = () => {
    storage.set(STORAGE_KEYS.ONBOARDING_DONE, true);
    setOnboardingComplete(true);
  };

  if (isLoading || checkingOnboarding) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary font-medium tracking-tight">Loading...</div>;
  }

  if (!onboardingComplete) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const navigateTo = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  // Determine if the current screen should use the default padding and scrolling.
  // Coach needs full height/width control for its own internal scrolling.
  const isFullHeightScreen = currentScreen === AppTab.Coach;

  // Render Logic
  const renderScreen = () => {
    switch (currentScreen) {
      case AppTab.Overview: return <Overview onNavigate={navigateTo} />;
      case AppTab.Tracking: return <Tracking />;
      case AppTab.Coach: return <Coach />;
      case AppTab.Profile: return <Profile />;
      case 'Notifications': return <Notifications onBack={() => navigateTo(AppTab.Overview)} />;
      default: return <Overview onNavigate={navigateTo} />;
    }
  };

  return (
    <DataProvider>
      <div className="min-h-screen bg-background text-textPrimary flex flex-col safe-area-top safe-area-bottom overflow-hidden">
        {/* 
          Main Content Container
          - If isFullHeightScreen: No padding, no default overflow (screen handles it).
          - Otherwise: Standard iOS margin (px-4) and vertical scrolling.
        */}
        <main 
          className={`flex-1 ${
            isFullHeightScreen 
              ? 'flex flex-col overflow-hidden p-0' 
              : 'overflow-y-auto px-4 py-4 scrollbar-hide'
          }`}
        >
          {renderScreen()}
        </main>
        
        {/* Bottom Nav matches AppTab enum. If we are on Notifications, we can highlight nothing or keep previous. 
            Here we just cast currentScreen if it matches a tab. */}
        <BottomNav 
          currentTab={currentScreen as AppTab} 
          onTabChange={(tab) => navigateTo(tab)} 
        />
      </div>
    </DataProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;