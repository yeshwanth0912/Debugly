export type IssueType = 'bug' | 'security' | 'smell';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface Issue {
  id?: string;
  type: IssueType;
  title: string;
  severity: SeverityLevel;
  line: number | string;
  explanation: string;
  suggested_fix: string;
}

export interface ReviewResult {
  overall_summary: string;
  issues: Issue[];
  source?: 'live' | 'cache' | 'timeout' | 'error' | 'empty' | 'static';
  error?: string;
}

export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'c++' | 'other';

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  language: SupportedLanguage;
  code: string;
  score: number;
  issueCount: number;
  summary: string;
  result: ReviewResult;
}
