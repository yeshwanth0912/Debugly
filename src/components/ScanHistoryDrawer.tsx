import React from 'react';
import { ScanHistoryItem } from '../types';
import { History, X, Clock, ArrowRight, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { scoreLabel } from '../utils/scoring';

interface ScanHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScanHistoryItem[];
  onSelectScan: (item: ScanHistoryItem) => void;
  onClearHistory: () => void;
}

export const ScanHistoryDrawer: React.FC<ScanHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectScan,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Scan History</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {history.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No previous scans found</p>
              <p className="text-xs mt-1">Run an analysis to save audit snapshots.</p>
            </div>
          ) : (
            history.map((item) => {
              const scoreInfo = scoreLabel(item.score);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectScan(item);
                    onClose();
                  }}
                  className="rounded-xl border border-slate-800 hover:border-blue-500/50 bg-slate-950/80 p-4 transition-all cursor-pointer group hover:shadow-md"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-blue-400 font-semibold uppercase">
                      {item.language}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-900 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${scoreInfo.color}`}>
                        {item.score}/100
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">
                        {item.issueCount} {item.issueCount === 1 ? 'issue' : 'issues'}
                      </span>
                    </div>

                    <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px]">
                      Load <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 py-1.5 px-3 rounded-lg hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
