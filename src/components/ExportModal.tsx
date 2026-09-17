import React, { useState } from 'react';
import { ReviewResult } from '../types';
import { computeScore, scoreLabel } from '../utils/scoring';
import { X, Copy, Check, Download, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ReviewResult;
  code: string;
  language: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  result,
  code,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');

  if (!isOpen) return null;

  const score = computeScore(result.issues || []);
  const scoreInfo = scoreLabel(score);

  const generateMarkdown = () => {
    const lines = [
      `# Debugly Code Audit Report`,
      `**Generated:** ${new Date().toLocaleString()}`,
      `**Language:** ${language}`,
      `**Quality Score:** ${score}/100 (${scoreInfo.text})`,
      `**Total Findings:** ${result.issues.length}`,
      ``,
      `## Executive Summary`,
      `${result.overall_summary}`,
      ``,
      `## Detected Issues & Vulnerabilities`,
    ];

    if (result.issues.length === 0) {
      lines.push(`_No issues detected. Code adheres to clean standards._`);
    } else {
      result.issues.forEach((issue, idx) => {
        lines.push(`### ${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.title} (Line ${issue.line})`);
        lines.push(`- **Category:** ${issue.type}`);
        lines.push(`- **Explanation:** ${issue.explanation}`);
        if (issue.suggested_fix) {
          lines.push(``, `**Suggested Fix:**`, '```' + language, issue.suggested_fix, '```');
        }
        lines.push(``);
      });
    }

    return lines.join('\n');
  };

  const content = format === 'markdown' ? generateMarkdown() : JSON.stringify(result, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debugly-audit-report.${format === 'markdown' ? 'md' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Export Audit Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Format:</span>
            <div className="flex rounded-lg bg-slate-800 p-0.5">
              <button
                onClick={() => setFormat('markdown')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  format === 'markdown' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  format === 'json' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                JSON
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Content</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
};
