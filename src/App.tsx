import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewResults } from './components/ReviewResults';
import { AnimatedRadar } from './components/AnimatedRadar';
import { ScanHistoryDrawer } from './components/ScanHistoryDrawer';
import { ExportModal } from './components/ExportModal';
import { ReviewResult, SupportedLanguage, ScanHistoryItem } from './types';
import {
  CACHED_DEMO_RESULT,
  CACHED_CLEAN_RESULT,
  DEMO_VULNERABLE_CODE,
  DEMO_BUGGY_CODE,
  DEMO_CLEAN_CODE,
} from './data/samples';
import { computeScore } from './utils/scoring';
import { AlertCircle, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'debugly_scan_history_v1';

export const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // History & Export Modal State
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not parse scan history from storage:', e);
    }

    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiKey || data.hasAnthropicKey) {
          setHasApiKey(true);
        }
      })
      .catch((err) => {
        console.warn('Health check failed:', err);
      });
  }, []);

  const saveHistoryItem = (reviewResult: ReviewResult, sourceCode: string, lang: SupportedLanguage) => {
    try {
      const score = computeScore(reviewResult.issues || []);
      const title =
        sourceCode.includes('sk-hardcoded-secret')
          ? 'Vulnerable SQLite & Pickle Service'
          : sourceCode.includes('divide(a, b)')
          ? 'Buggy Zero-Division & Nested Loop'
          : sourceCode.includes('safe_divide')
          ? 'Clean & Hardened Benchmark'
          : sourceCode.split('\n')[0].slice(0, 45) || 'Custom Code Scan';

      const newItem: ScanHistoryItem = {
        id: 'scan_' + Date.now(),
        timestamp: Date.now(),
        title,
        language: lang,
        code: sourceCode,
        score,
        issueCount: (reviewResult.issues || []).length,
        summary: reviewResult.overall_summary,
        result: reviewResult,
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev.filter((i) => i.title !== title)].slice(0, 20);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
          console.warn('Failed to save to localStorage:', err);
        }
        return updated;
      });
    } catch (e) {
      console.warn('Error saving history item:', e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const handleSelectHistoryScan = (item: ScanHistoryItem) => {
    setCode(item.code);
    setLanguage(item.language);
    setResult(item.result);
    setNotification(`Loaded snapshot: "${item.title}"`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectPreset = (type: 'vulnerable' | 'buggy' | 'clean') => {
    if (type === 'vulnerable') {
      setCode(DEMO_VULNERABLE_CODE);
      setLanguage('python');
      setIsDemo(true);
    } else if (type === 'buggy') {
      setCode(DEMO_BUGGY_CODE);
      setLanguage('python');
      setIsDemo(false);
    } else {
      setCode(DEMO_CLEAN_CODE);
      setLanguage('python');
      setIsDemo(false);
    }
    setResult(null);
  };

  const handleApplyFixToCode = (fixedCode: string) => {
    setCode(fixedCode);
    setNotification('Patched code applied to the editor!');
    setTimeout(() => setNotification(null), 3500);
    // Smooth scroll back to editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReview = async () => {
    if (!code.trim()) {
      setErrorBanner('Please paste or upload some code first.');
      return;
    }

    setErrorBanner(null);
    setLoading(true);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          is_demo_sample: isDemo,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: ReviewResult = await response.json();
      setResult(data);
      saveHistoryItem(data, code, language);
    } catch (err: any) {
      console.error('Review request failed:', err);
      if (isDemo || code.includes('sk-hardcoded-secret')) {
        setResult(CACHED_DEMO_RESULT);
        saveHistoryItem(CACHED_DEMO_RESULT, code, language);
      } else {
        const errorResult: ReviewResult = {
          overall_summary: 'The analysis service encountered an error. Please check your syntax or try again.',
          issues: [],
          source: 'error',
        };
        setResult(errorResult);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Brand Header */}
      <Header
        hasApiKey={hasApiKey}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        hasResults={!!result}
        onSelectPreset={handleSelectPreset}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-semibold shadow-lg backdrop-blur-md"
            >
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Banner */}
        {errorBanner && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-200 text-sm shadow-md">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* Code Input Card */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          <CodeInput
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            isDemo={isDemo}
            setIsDemo={setIsDemo}
            onReview={handleReview}
            loading={loading}
          />
        </div>

        {/* Animated Scanning Radar & Engine Stepper (Active during review) */}
        {loading && <AnimatedRadar language={language} />}

        {/* Review Results Dashboard */}
        {result && !loading && (
          <ReviewResults
            result={result}
            code={code}
            onApplyFixToCode={handleApplyFixToCode}
          />
        )}
      </main>

      {/* History Drawer */}
      <ScanHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectScan={handleSelectHistoryScan}
        onClearHistory={handleClearHistory}
      />

      {/* Export Report Modal */}
      {result && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          result={result}
          code={code}
          language={language}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Debugly</span>
            <span>•</span>
            <span>AI Code Review & Vulnerability Detection Agent</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Deterministic 0-100 Quality Scoring</span>
            <span>•</span>
            <span>OWASP & CWE Grounded</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
