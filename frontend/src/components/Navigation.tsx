import React from 'react';
import { Scale } from 'lucide-react';

interface NavigationProps {
  currentStep: number;
}

export const Navigation: React.FC<NavigationProps> = ({ currentStep }) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-civic-dark/85 border-b border-civic-border/60 px-6 py-4 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-civic-dark rounded-[10px] flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-wide">
                LEGAL<span className="text-blue-400">ADVISER AI</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                OFFICIAL PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multilingual Legal & Civic Intelligence Platform
            </p>

          </div>
        </div>
      </div>
    </header>
  );
};
