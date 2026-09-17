import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { scoreLabel } from '../utils/scoring';

interface AnimatedScoreGaugeProps {
  score: number;
}

export const AnimatedScoreGauge: React.FC<AnimatedScoreGaugeProps> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = score / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  const scoreInfo = scoreLabel(score);

  // SVG parameters
  const size = 130;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = "#10b981"; // emerald
  let grade = "A+";
  if (score < 50) {
    strokeColor = "#ef4444"; // red
    grade = "F";
  } else if (score < 75) {
    strokeColor = "#f59e0b"; // amber
    grade = "C";
  } else if (score < 90) {
    strokeColor = "#3b82f6"; // blue
    grade = "B";
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Progress Ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold text-white tracking-tight leading-none"
          >
            {displayScore}
          </motion.span>
          <span className="text-[11px] font-mono text-slate-400 mt-0.5">/ 100</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`text-base font-bold ${scoreInfo.color}`}>
            {scoreInfo.text}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
            Grade: {grade}
          </span>
        </div>
        <p className="text-xs text-slate-400 max-w-[170px] leading-relaxed">
          Base score 100 with penalties applied by issue severity.
        </p>
      </div>
    </div>
  );
};
