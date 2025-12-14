
import React from 'react';
import { Bot, Sparkles, Construction } from 'lucide-react';

export const Coach = () => {
  return (
    <div className="flex flex-col h-full bg-black pb-[83px]">
        
        {/* Header */}
        <div className="flex-none pt-2 pb-3 border-b border-[#2C2C2E]/50 flex items-center justify-center bg-black/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-surfaceHighlight mb-1 overflow-hidden relative shadow-sm border border-white/5">
                    <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">K</div>
                </div>
                <h1 className="font-heading font-semibold text-[15px] leading-tight text-white">Coach K</h1>
                <span className="text-[11px] text-textSecondary font-medium">iCoach • Gemini 2.5</span>
            </div>
        </div>

        {/* Placeholder Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in pt-12">
            <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-[#1C1C1E] flex items-center justify-center shadow-2xl border border-white/5 z-10 relative">
                    <Bot size={40} className="text-[#8E8E93]" strokeWidth={1.5} />
                </div>
                {/* Decorative glow/blur behind */}
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150" />
            </div>
            
            <h2 className="font-heading text-2xl font-bold text-white mb-3 tracking-tight">Not Available Yet</h2>
            
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-[260px] mx-auto">
                Coach K is currently offline for upgrades. Check back in a future update for AI-powered insights.
            </p>

            <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] rounded-full border border-white/5 shadow-sm">
                <Sparkles size={14} className="text-[#FFD60A]" />
                <span className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Coming Soon</span>
            </div>
        </div>
    </div>
  );
};
