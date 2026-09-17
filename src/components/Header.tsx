import React from 'react';
import { ShieldAlert, Sparkles, CheckCircle2, History, FileDown, ChevronDown, Zap } from 'lucide-react';

interface HeaderProps {
  hasApiKey?: boolean;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenExport?: () => void;
  hasResults: boolean;
  onSelectPreset: (type: 'vulnerable' | 'buggy' | 'clean') => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
  historyCount,
  onOpenHistory,
  onOpenExport,
  hasResults,
  onSelectPreset,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Debugly
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-medium">
                v1.2 AI
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Code Review & Vulnerability Detection Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 sm:hidden">
              AI Code Review & Vulnerability Detection Agent
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Presets dropdown / quick menu */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Preset</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl backdrop-blur-md p-1.5 hidden group-hover:block z-40">
              <button
                onClick={() => onSelectPreset('vulnerable')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors flex flex-col cursor-pointer"
              >
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  ⚡ Vulnerable Sample
                </span>
                <span className="text-[11px] text-slate-400">SQL injection, hardcoded key, pickle</span>
              </button>
              <button
                onClick={() => onSelectPreset('buggy')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors flex flex-col cursor-pointer mt-1"
              >
                <span className="font-semibold text-blue-300 flex items-center gap-1">
                  ⚡ Buggy Sample
                </span>
                <span className="text-[11px] text-slate-400">Zero-division, empty list, O(n²)</span>
              </button>
              <button
                onClick={() => onSelectPreset('clean')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors flex flex-col cursor-pointer mt-1"
              >
                <span className="font-semibold text-emerald-300 flex items-center gap-1">
                  ⚡ Clean & Secure Sample
                </span>
                <span className="text-[11px] text-slate-400">100/100 score benchmark</span>
              </button>
            </div>
          </div>

          {/* Export Report Button */}
          {hasResults && onOpenExport && (
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Report</span>
            </button>
          )}

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600/80 text-[10px] font-mono font-bold flex items-center justify-center text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* Engine Status */}
          <div className="hidden sm:flex items-center">
            {hasApiKey ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/40 text-emerald-400 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Live Gemini Engine
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                Hybrid Engine Ready
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
