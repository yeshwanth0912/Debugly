import React, { useState } from 'react';
import { ReviewResult, IssueType, SeverityLevel } from '../types';
import { TYPE_LABEL, SEVERITY_BG_CLASS } from '../utils/scoring';
import { DashboardBento } from './DashboardBento';
import { IssueCard } from './IssueCard';
import { AnnotatedCodeViewer } from './AnnotatedCodeViewer';
import { ShieldCheck, Layers, Code2, Sparkles, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewResultsProps {
  result: ReviewResult;
  code: string;
  onApplyFixToCode?: (fixedCode: string) => void;
}

export const ReviewResults: React.FC<ReviewResultsProps> = ({
  result,
  code,
  onApplyFixToCode,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'inspector'>('cards');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const issues = result.issues || [];

  // Filter issues based on active filters
  const filteredIssues = issues.filter((issue) => {
    if (selectedType !== 'all' && issue.type !== selectedType) return false;
    if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = issue.title.toLowerCase().includes(q);
      const matchExpl = issue.explanation.toLowerCase().includes(q);
      const matchFix = issue.suggested_fix.toLowerCase().includes(q);
      if (!matchTitle && !matchExpl && !matchFix) return false;
    }
    return true;
  });

  return (
    <div id="review-results-section" className="mt-8 space-y-6">
      {/* 1. Animated Bento Dashboard Grid */}
      <DashboardBento
        result={result}
        onFilterCategory={(cat) => {
          setSelectedType(cat);
          setActiveTab('cards');
        }}
      />

      {/* 2. Executive Summary Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <span className="text-[11px] font-bold font-mono tracking-wider text-blue-400 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Executive Summary
          </span>
          <h3 className="text-base sm:text-lg font-semibold text-slate-100 leading-snug">
            {result.overall_summary || "Audit complete."}
          </h3>
        </div>

        {result.source && (
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Engine: {result.source === 'cache' ? 'Verified Safe Cache' : result.source === 'live' ? 'Live Gemini AI' : result.source}
            </span>
          </div>
        )}
      </motion.div>

      {/* 3. View Switcher Tabs & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Findings ({issues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'inspector'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Interactive Code Inspector</span>
          </button>
        </div>

        {/* Filters (Shown when in Cards tab) */}
        {activeTab === 'cards' && issues.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="security">🔒 Security</option>
              <option value="bug">🐛 Bugs</option>
              <option value="smell">👃 Smells</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        )}
      </div>

      {/* 4. Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'cards' ? (
          <motion.div
            key="cards-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {issues.length === 0 ? (
              <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-8 text-center space-y-3">
                <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">No Issues or Vulnerabilities Detected!</h4>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Your source code passed all static security audits, parameterization checks, and syntax heuristics with a 100/100 score.
                </p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
                <p className="text-sm font-medium">No findings match the current filter selection.</p>
                <button
                  onClick={() => {
                    setSelectedType('all');
                    setSelectedSeverity('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs text-blue-400 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredIssues.map((issue, idx) => (
                  <IssueCard key={idx} issue={issue} index={idx} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="inspector-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnnotatedCodeViewer
              code={code}
              result={result}
              onApplyFixToCode={onApplyFixToCode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
