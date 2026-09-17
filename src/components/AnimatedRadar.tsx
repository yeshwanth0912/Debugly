import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Cpu, Search, CheckCircle, Terminal } from 'lucide-react';

interface AnimatedRadarProps {
  language: string;
}

const STEPS = [
  { id: 1, text: "Tokenizing AST & parsing syntax tree...", icon: Cpu },
  { id: 2, text: "Running static taint & injection analysis...", icon: Search },
  { id: 3, text: "Deep AI model vulnerability inspection...", icon: ShieldAlert },
  { id: 4, text: "Synthesizing remediation diffs & quality score...", icon: CheckCircle },
];

export const AnimatedRadar: React.FC<AnimatedRadarProps> = ({ language }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-slate-900/90 backdrop-blur-md p-6 sm:p-8 my-6 relative overflow-hidden shadow-2xl">
      {/* Laser Scanning Line */}
      <motion.div
        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-10 opacity-75 shadow-[0_0_15px_#38bdf8]"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
      />

      <div className="flex flex-col md:flex-row items-center gap-8 justify-between relative z-20">
        {/* Left: Animated Radar Screen */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-500/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border border-blue-500/30"
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
          />
          <div className="absolute inset-8 rounded-full border border-slate-700 bg-slate-950/80 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="w-full h-full flex items-center justify-center"
            >
              <div className="w-1/2 h-0.5 bg-gradient-to-r from-transparent to-cyan-400 origin-right" />
            </motion.div>
          </div>
          <ShieldAlert className="w-8 h-8 text-cyan-400 relative z-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
        </div>

        {/* Right: Step-by-Step Progress Pipeline */}
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                Debugly Engine Scan • {language.toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-mono text-cyan-400 animate-pulse">
              ANALYSIS IN PROGRESS
            </span>
          </div>

          <div className="space-y-2.5">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isDone = activeStep > idx;
              const isCurrent = activeStep === idx;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className={`flex items-center gap-3 text-xs sm:text-sm p-2 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-blue-500/10 text-cyan-300 border border-blue-500/30'
                      : isDone
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isCurrent
                        ? 'bg-cyan-500/20 text-cyan-400 animate-spin'
                        : 'bg-slate-800 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono">{step.text}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
