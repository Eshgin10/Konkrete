import React from 'react';
import { Button } from '../components/Button';
import { Target, Zap, Shield } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-blue-600/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[30%] bg-purple-600/20 blur-[100px] rounded-full" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        <div className="w-20 h-20 bg-surfaceHighlight rounded-2xl flex items-center justify-center mb-8 shadow-2xl border border-white/5">
          <Target size={40} className="text-primary" />
        </div>

        {/* Applied font-heading */}
        <h1 className="font-heading text-4xl font-bold mb-3 tracking-tight">Konkrete</h1>
        <p className="text-lg text-textSecondary mb-12">Precision Goal Tracking &<br/>AI Coaching</p>

        <div className="space-y-8 w-full text-left px-4 mb-12">
            <div className="flex items-start space-x-4">
                <div className="mt-1 p-2 bg-blue-500/10 rounded-lg">
                    <Zap size={20} className="text-blue-400" />
                </div>
                <div>
                    {/* Applied font-heading */}
                    <h3 className="font-heading font-semibold text-white">Focus First</h3>
                    <p className="text-sm text-gray-400 mt-1">Track deep work sessions without distractions.</p>
                </div>
            </div>
            <div className="flex items-start space-x-4">
                <div className="mt-1 p-2 bg-purple-500/10 rounded-lg">
                    <Target size={20} className="text-purple-400" />
                </div>
                <div>
                    <h3 className="font-heading font-semibold text-white">Smart Insights</h3>
                    <p className="text-sm text-gray-400 mt-1">Get personalized coaching from AI based on your habits.</p>
                </div>
            </div>
            <div className="flex items-start space-x-4">
                <div className="mt-1 p-2 bg-green-500/10 rounded-lg">
                    <Shield size={20} className="text-green-400" />
                </div>
                <div>
                    <h3 className="font-heading font-semibold text-white">Privacy by Default</h3>
                    <p className="text-sm text-gray-400 mt-1">Your data stays on your device. Offline capability.</p>
                </div>
            </div>
        </div>

        <Button onClick={onComplete} fullWidth className="h-14 text-lg">
          Get Started
        </Button>
      </div>
    </div>
  );
};