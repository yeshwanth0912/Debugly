import React from 'react';
import { motion } from 'motion/react';
import { Issue, ReviewResult } from '../types';
import { computeScore } from '../utils/scoring';
import { AnimatedScoreGauge } from './AnimatedScoreGauge';
import { ShieldAlert, Bug, Sparkles, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DashboardBentoProps {
  result: ReviewResult;
  onFilterCategory?: (category: string) => void;
}

export const DashboardBento: React.FC<DashboardBentoProps> = ({ result, onFilterCategory }) => {
  const issues = result.issues || [];
  const score = computeScore(issues);

  const securityIssues = issues.filter((i) => i.type === 'security');
  const bugIssues = issues.filter((i) => i.type === 'bug');
  const smellIssues = issues.filter((i) => i.type === 'smell');

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const highCount = issues.filter((i) => i.severity === 'high').length;

  const estimatedFixMinutes = issues.length === 0 ? 0 : Math.max(5, issues.length * 4);

  return (
    <div className="space-y-4">
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Quality Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-lg flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Health Score</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              0-100 METRIC
            </span>
          </div>
          <AnimatedScoreGauge score={score} />
        </motion.div>

        {/* Card 2: Security Threats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onClick={() => onFilterCategory && onFilterCategory('security')}
          className="rounded-2xl border border-slate-800 hover:border-red-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-lg flex flex-col justify-between cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5 text-red-400">
              <ShieldAlert className="w-4 h-4" /> Security Radar
            </span>
            {criticalCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/60 font-mono animate-pulse">
                {criticalCount} CRITICAL
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                OWASP CHECK
              </span>
            )}
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {securityIssues.length}
              </span>
              <span className="text-xs text-slate-400">vulnerabilities found</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {securityIssues.length > 0
                ? `${criticalCount} critical, ${highCount} high severity risks detected.`
                : 'No injection, secret leak, or deserialization flaws found.'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 group-hover:text-red-300">
            <span>Filter security issues</span>
            <span>&rarr;</span>
          </div>
        </motion.div>

        {/* Card 3: Logic & Runtime Bugs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => onFilterCategory && onFilterCategory('bug')}
          className="rounded-2xl border border-slate-800 hover:border-amber-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-lg flex flex-col justify-between cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Bug className="w-4 h-4" /> Logic & Crash Risks
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              AST AUDIT
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {bugIssues.length}
              </span>
              <span className="text-xs text-slate-400">runtime bugs</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {bugIssues.length > 0
                ? 'Edge case zero-division, type errors, or exception hazards.'
                : 'No unhandled zero divisions or fatal runtime paths.'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 group-hover:text-amber-300">
            <span>Filter bug issues</span>
            <span>&rarr;</span>
          </div>
        </motion.div>

        {/* Card 4: Code Smells & Remediation Time */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          onClick={() => onFilterCategory && onFilterCategory('smell')}
          className="rounded-2xl border border-slate-800 hover:border-blue-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-lg flex flex-col justify-between cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Sparkles className="w-4 h-4" /> Debt & Smells
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              MAINTAINABILITY
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {smellIssues.length}
              </span>
              <span className="text-xs text-slate-400">smells identified</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Est. fix time: ~{estimatedFixMinutes} mins</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 group-hover:text-blue-300">
            <span>Filter code smells</span>
            <span>&rarr;</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
