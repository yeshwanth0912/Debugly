import { Issue, SeverityLevel } from '../types';

export const SEVERITY_PENALTY: Record<SeverityLevel, number> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 2,
};

export const SEVERITY_COLOR: Record<SeverityLevel, string> = {
  critical: "#dc2626", // red
  high: "#ea580c",     // orange
  medium: "#ca8a04",   // yellow
  low: "#2563eb",      // blue
};

export const SEVERITY_BG_CLASS: Record<SeverityLevel, string> = {
  critical: "bg-red-700 text-white border-red-800",
  high: "bg-orange-700 text-white border-orange-800",
  medium: "bg-amber-700 text-white border-amber-800",
  low: "bg-blue-700 text-white border-blue-800",
};

export const TYPE_LABEL: Record<string, string> = {
  bug: "🐛 Bug",
  security: "🔒 Security",
  smell: "👃 Smell",
};

export function computeScore(issues: Issue[]): number {
  let score = 100;
  for (const issue of issues) {
    const sev = (issue.severity || 'low').toLowerCase() as SeverityLevel;
    score -= SEVERITY_PENALTY[sev] ?? 2;
  }
  return Math.max(score, 0);
}

export function scoreLabel(score: number): { text: string; color: string } {
  if (score >= 90) return { text: "Excellent", color: "text-emerald-400" };
  if (score >= 75) return { text: "Good", color: "text-blue-400" };
  if (score >= 50) return { text: "Needs Work", color: "text-amber-400" };
  return { text: "Poor", color: "text-red-400" };
}
