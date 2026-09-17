import React, { useRef, useState } from 'react';
import { SupportedLanguage } from '../types';
import { Upload, Zap, Trash2, FileCode, Play, Loader2, CheckCircle2 } from 'lucide-react';
import { DEMO_VULNERABLE_CODE, DEMO_BUGGY_CODE, DEMO_CLEAN_CODE } from '../data/samples';

interface CodeInputProps {
  code: string;
  setCode: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isDemo: boolean;
  setIsDemo: (isDemo: boolean) => void;
  onReview: () => void;
  loading: boolean;
}

export const CodeInput: React.FC<CodeInputProps> = ({
  code,
  setCode,
  language,
  setLanguage,
  isDemo,
  setIsDemo,
  onReview,
  loading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleLoadDemo = () => {
    setCode(DEMO_VULNERABLE_CODE);
    setLanguage('python');
    setIsDemo(true);
    setFileName('vulnerable_example.py');
  };

  const handleLoadBuggy = () => {
    setCode(DEMO_BUGGY_CODE);
    setLanguage('python');
    setIsDemo(false);
    setFileName('buggy_example.py');
  };

  const handleLoadClean = () => {
    setCode(DEMO_CLEAN_CODE);
    setLanguage('python');
    setIsDemo(false);
    setFileName('clean_example.py');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    setFileName(file.name);
    setIsDemo(false);

    // Auto-detect language from extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'py') setLanguage('python');
    else if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') setLanguage('javascript');
    else if (ext === 'java') setLanguage('java');
    else if (ext === 'cpp' || ext === 'c' || ext === 'cc' || ext === 'h') setLanguage('c++');
    else setLanguage('other');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCode(content || '');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readFile(e.dataTransfer.files[0]);
    }
  };

  const lineCount = code ? code.split(/\r?\n/).length : 0;

  return (
    <div className="space-y-4">
      {/* Top Controls: Language & Demo Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-4">
          <label
            htmlFor="language-select"
            className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5"
          >
            Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="python">python</option>
            <option value="javascript">javascript</option>
            <option value="java">java</option>
            <option value="c++">c++</option>
            <option value="other">other</option>
          </select>
        </div>

        <div className="sm:col-span-8 flex flex-wrap gap-2 sm:justify-end">
          <button
            id="load-demo-btn"
            type="button"
            onClick={handleLoadDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Vulnerable (Security)
          </button>
          <button
            id="load-buggy-btn"
            type="button"
            onClick={handleLoadBuggy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            Buggy (Logic)
          </button>
          <button
            id="load-clean-btn"
            type="button"
            onClick={handleLoadClean}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Clean Benchmark
          </button>
        </div>
      </div>

      {/* File Uploader */}
      <div
        id="drop-zone"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'
        }`}
      >
        <input
          id="file-input"
          ref={fileInputRef}
          type="file"
          accept=".py,.js,.java,.cpp,.c,.ts,.go,.rb,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-1.5">
          <Upload className="w-5 h-5 text-slate-400" />
          <div className="text-xs sm:text-sm text-slate-300 font-medium">
            {fileName ? (
              <span className="text-blue-400 font-mono">Loaded: {fileName}</span>
            ) : (
              <span>Upload a source file (drag & drop or click)</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            Supported types: .py, .js, .java, .cpp, .c, .ts, .go, .rb
          </span>
        </div>
      </div>

      {/* Textarea for code */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <label htmlFor="code-textarea" className="font-semibold uppercase tracking-wider">
            Or paste source code here
          </label>
          <div className="flex items-center gap-3">
            {lineCount > 0 && (
              <span className="font-mono text-slate-500">
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </span>
            )}
            {code && (
              <button
                id="clear-code-btn"
                type="button"
                onClick={() => {
                  setCode('');
                  setFileName(null);
                  setIsDemo(false);
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="relative rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <textarea
            id="code-textarea"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setIsDemo(false);
            }}
            placeholder="# Paste your code here to analyze..."
            rows={12}
            className="w-full bg-transparent p-4 font-mono text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          id="review-code-btn"
          type="button"
          onClick={onReview}
          disabled={loading || !code.trim()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md transition-colors cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing code...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Review Code</span>
            </>
          )}
        </button>

        {isDemo && (
          <span className="text-xs text-amber-400/90 font-medium">
            ⚡ Demo sample loaded (backed by pre-baked safe fallback cache)
          </span>
        )}
      </div>
    </div>
  );
};
