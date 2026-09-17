import React, { useState } from 'react';
import { Issue } from '../types';
import { SEVERITY_COLOR } from '../utils/scoring';
import { Copy, Check, Terminal, ShieldAlert, Bug, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface IssueCardProps {
  issue: Issue;
  index: number;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, index }) => {
  const [copied, setCopied] = useState(false);
  const color = SEVERITY_COLOR[issue.severity] || '#64748b';

  const handleCopy = () => {
    navigator.clipboard.writeText(issue.suggested_fix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = () => {
    switch (issue.type) {
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'bug':
        return <Bug className="w-4 h-4 text-amber-400" />;
      case 'smell':
      default:
        return <Sparkles className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <motion.div
      id={`issue-card-${index}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 p-4 transition-all duration-200 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1 rounded bg-slate-800/80 border border-slate-750">
            {getCategoryIcon()}
          </div>
          <span
            style={{ backgroundColor: color }}
            className="text-[10px] font-extrabold text-white px-2 py-0.5 rounded tracking-wider uppercase font-mono"
          >
            {issue.severity}
          </span>
          <h4 className="font-bold text-white text-sm sm:text-base">
            {issue.title}
          </h4>
          <span className="text-xs text-slate-400 font-mono bg-slate-800/60 px-2 py-0.5 rounded border border-slate-750">
            line {issue.line}
          </span>
        </div>
      </div>

      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
        {issue.explanation}
      </p>

      {issue.suggested_fix && (
        <div className="mt-2 rounded-lg bg-slate-950 border border-slate-800/80 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800/60 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-blue-400" /> Suggested Fix
            </span>
            <button
              id={`copy-fix-btn-${index}`}
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-white transition-colors py-0.5 px-2 rounded hover:bg-slate-800 text-slate-400 cursor-pointer"
              title="Copy suggested fix"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[11px]">Copy fix</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 text-xs font-mono text-emerald-300/90 overflow-x-auto whitespace-pre leading-relaxed">
            <code>{issue.suggested_fix}</code>
          </pre>
        </div>
      )}
    </motion.div>
  );
};
