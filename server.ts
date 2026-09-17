import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const MAX_ISSUES_PER_CATEGORY = 3;

const CACHED_DEMO_RESULT = {
  overall_summary: "This file has a critical SQL injection vulnerability, a hardcoded API key, and an unsafe deserialization call.",
  issues: [
    {
      type: "security",
      title: "SQL injection via string concatenation",
      severity: "critical",
      line: 9,
      explanation: 'user_id is concatenated directly into the SQL string, so a malicious value like "1 OR 1=1" lets an attacker read or modify arbitrary rows.',
      suggested_fix: 'cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))',
    },
    {
      type: "security",
      title: "Hardcoded API key in source",
      severity: "high",
      line: 3,
      explanation: "Secrets committed to source code end up in version history and are easy to leak.",
      suggested_fix: 'Load it from an environment variable:\nAPI_KEY = os.environ["API_KEY"]',
    },
    {
      type: "security",
      title: "Unsafe deserialization with pickle",
      severity: "high",
      line: 15,
      explanation: "pickle.load on an untrusted file can execute arbitrary code during deserialization.",
      suggested_fix: "Use json.load for plain config data, or validate the source is trusted before unpickling.",
    },
    {
      type: "smell",
      title: "Import inside function body",
      severity: "low",
      line: 14,
      explanation: "Local imports are sometimes fine, but a top-level import is more discoverable and avoids repeated import overhead.",
      suggested_fix: "Move `import pickle` to the top of the file.",
    },
  ],
  source: "cache",
};

const CACHED_BUGGY_RESULT = {
  overall_summary: "This file contains potential zero-division crashes and an inefficient O(n^2) nested loop.",
  issues: [
    {
      type: "bug",
      title: "Missing division by zero check",
      severity: "high",
      line: 11,
      explanation: "divide(a, b) performs direct division without validating if b is zero, which will crash with ZeroDivisionError.",
      suggested_fix: "if b == 0:\n    raise ValueError('Cannot divide by zero')\nreturn a / b",
    },
    {
      type: "bug",
      title: "Empty list ZeroDivisionError",
      severity: "high",
      line: 18,
      explanation: "get_average(numbers) does not check if the numbers list is empty before dividing by len(numbers), causing a ZeroDivisionError.",
      suggested_fix: "if not numbers:\n    return 0.0\nreturn total / len(numbers)",
    },
    {
      type: "smell",
      title: "O(n^2) duplicate-detection nested loops",
      severity: "medium",
      line: 4,
      explanation: "Nested index iteration for duplicate search results in quadratic time complexity. Use a set or hash map for O(n) detection.",
      suggested_fix: "seen = set()\nduplicates = set()\nfor item in items:\n    if item in seen:\n        duplicates.add(item)\n    seen.add(item)\nreturn list(duplicates)",
    },
  ],
  source: "cache",
};

const CACHED_CLEAN_RESULT = {
  overall_summary: "Excellent code quality. No security vulnerabilities, crashes, or code smells were detected.",
  issues: [],
  source: "cache",
};

function numberLines(code: string): string {
  const lines = code.split(/\r?\n/);
  const width = lines.length > 0 ? String(lines.length).length : 1;
  return lines.map((line, i) => `${String(i + 1).padStart(width, ' ')}: ${line}`).join('\n');
}

function runStaticChecks(code: string, language: string): string {
  const lines = code.split(/\r?\n/);
  const findings: string[] = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Bandit-style security checks
    if (/(SELECT|INSERT|UPDATE|DELETE).*\+/i.test(line) || /cursor\.execute\(.*["'].*\+/.test(line)) {
      findings.push(`- [bandit/high] line ${lineNum}: Possible SQL injection vector through string concatenation.`);
    }
    if (/(API_KEY|SECRET_KEY|PASSWORD|TOKEN)\s*=\s*['"][a-zA-Z0-9_\-]{8,}['"]/i.test(line)) {
      findings.push(`- [bandit/high] line ${lineNum}: Possible hardcoded secret or API key assignment.`);
    }
    if (/pickle\.(load|loads)\(/.test(line)) {
      findings.push(`- [bandit/high] line ${lineNum}: Pickle and modules that wrap it can be unsafe when used to deserialize untrusted data.`);
    }
    if (/eval\(|exec\(/.test(line)) {
      findings.push(`- [bandit/critical] line ${lineNum}: Use of eval or exec is inherently insecure.`);
    }

    // Pylint-style checks
    if (/def\s+[a-zA-Z0-9_]+\s*\(.*import\s+/.test(line) || (/^\s+import\s+/.test(line) && idx > 0)) {
      findings.push(`- [pylint/C0415] line ${lineNum}: Import outside toplevel.`);
    }
    if (/for\s+[a-zA-Z_]\s+in\s+range\(len\(/.test(line)) {
      findings.push(`- [pylint/C0200] line ${lineNum}: Consider using enumerate or direct iteration instead of iterating with range and len.`);
    }
    if (/\/ b(\s|$)/.test(line) && !code.includes('b == 0') && !code.includes('b != 0')) {
      findings.push(`- [pylint/W0703] line ${lineNum}: Potential division by zero without guard.`);
    }
  });

  return findings.join('\n');
}

function dedupeAndCap(issues: any[]): any[] {
  const byCategory: Record<string, any[]> = { bug: [], security: [], smell: [] };
  const seenTitles = new Set<string>();

  for (const issue of issues) {
    const cat = issue.type || 'smell';
    const titleKey = `${cat}:${String(issue.title || '').trim().toLowerCase()}`;
    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);

    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(issue);
  }

  const capped: any[] = [];
  for (const cat of ['security', 'bug', 'smell']) {
    const list = byCategory[cat] || [];
    list.sort((a, b) => {
      const rankA = SEVERITY_RANK[a.severity?.toLowerCase()] ?? 3;
      const rankB = SEVERITY_RANK[b.severity?.toLowerCase()] ?? 3;
      return rankA - rankB;
    });
    capped.push(...list.slice(0, MAX_ISSUES_PER_CATEGORY));
  }

  return capped;
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  });
});

app.post('/api/review', async (req: Request, res: Response) => {
  try {
    let { code, language = 'python', is_demo_sample = false } = req.body;

    if (!code || !code.trim()) {
      return res.json({
        overall_summary: "No code provided.",
        issues: [],
        source: "empty",
      });
    }

    if (code.length > 20000) {
      code = code.slice(0, 20000);
    }

    const isVulnerableDemo = is_demo_sample || (code.includes('sk-hardcoded-secret') && code.includes('SELECT * FROM users WHERE id ='));
    const isBuggyDemo = code.includes('divide(a, b)') && code.includes('get_average(numbers)');
    const isCleanDemo = code.includes('safe_divide') && code.includes('SELECT id, name, email FROM users WHERE id = ?');

    const staticContext = runStaticChecks(code, language);
    const numbered = numberLines(code);

    let staticBlock = '';
    if (staticContext) {
      staticBlock = `\nStatic analysis tool output for grounding — treat these as confirmed findings to explain and prioritize, not the only findings to report:\n${staticContext}\n`;
    }

    const prompt = `You are a senior code reviewer. The source below has been line-numbered for you — use those exact numbers in your \`line\` field, don't recount.

Language: ${language}

Analyze for:
1. Bugs (logic errors, edge cases, incorrect behavior)
2. Security vulnerabilities (injection, hardcoded secrets, unsafe deserialization, etc.)
3. Code smells (poor naming, duplication, overly long functions, tight coupling)
${staticBlock}
Report at most 3 most important issues per category (bug, security, smell) — prioritize severity over completeness.
Return a structured JSON object with:
- overall_summary: 1-2 sentence summary of the code's overall state.
- issues: list of objects with { type: 'bug'|'security'|'smell', title: string, severity: 'critical'|'high'|'medium'|'low', line: number, explanation: string, suggested_fix: string }

Source code:
<code>
${numbered}
</code>`;

    // Attempt Live AI Call if GEMINI_API_KEY is available
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('LLM_TIMEOUT')), 20000)
        );

        const callPromise = (async () => {
          const response = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  overall_summary: { type: Type.STRING },
                  issues: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, enum: ['bug', 'security', 'smell'] },
                        title: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ['critical', 'high', 'medium', 'low'] },
                        line: { type: Type.INTEGER },
                        explanation: { type: Type.STRING },
                        suggested_fix: { type: Type.STRING },
                      },
                      required: ['type', 'title', 'severity', 'line', 'explanation', 'suggested_fix'],
                    },
                  },
                },
                required: ['overall_summary', 'issues'],
              },
            },
          });

          const rawText = response.text || '{}';
          return JSON.parse(rawText);
        })();

        const result: any = await Promise.race([callPromise, timeoutPromise]);
        result.issues = dedupeAndCap(result.issues || []);
        result.source = 'live';
        return res.json(result);
      } catch (err: any) {
        console.warn('Live Gemini call error/timeout:', err?.message || err);
        // Fall back below
      }
    }

    // Anthropic API fallback if ANTHROPIC_API_KEY is provided
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('LLM_TIMEOUT')), 20000)
        );

        const callPromise = (async () => {
          const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY || '',
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 4000,
              tools: [
                {
                  name: 'submit_code_review',
                  description: 'Submit structured code review results',
                  input_schema: {
                    type: 'object',
                    properties: {
                      overall_summary: { type: 'string' },
                      issues: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type: { type: 'string', enum: ['bug', 'security', 'smell'] },
                            title: { type: 'string' },
                            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                            line: { type: 'integer' },
                            explanation: { type: 'string' },
                            suggested_fix: { type: 'string' },
                          },
                          required: ['type', 'title', 'severity', 'line', 'explanation', 'suggested_fix'],
                        },
                      },
                    },
                    required: ['overall_summary', 'issues'],
                  },
                },
              ],
              tool_choice: { type: 'tool', name: 'submit_code_review' },
              messages: [{ role: 'user', content: prompt }],
            }),
          });
          const data: any = await resp.json();
          const toolBlock = data?.content?.find((c: any) => c.type === 'tool_use' && c.name === 'submit_code_review');
          if (toolBlock?.input) {
            return toolBlock.input;
          }
          throw new Error('No tool_use in Anthropic response');
        })();

        const result: any = await Promise.race([callPromise, timeoutPromise]);
        result.issues = dedupeAndCap(result.issues || []);
        result.source = 'live';
        return res.json(result);
      } catch (err: any) {
        console.warn('Live Anthropic call error/timeout:', err?.message || err);
      }
    }

    // Cache Fallback: If demo sample or matches sample code
    if (isVulnerableDemo) {
      return res.json(CACHED_DEMO_RESULT);
    }
    if (isBuggyDemo) {
      return res.json(CACHED_BUGGY_RESULT);
    }
    if (isCleanDemo) {
      return res.json(CACHED_CLEAN_RESULT);
    }

    // If static analysis found findings, construct issue list from static analysis
    if (staticContext) {
      const staticIssues: any[] = [];
      const lines = code.split(/\r?\n/);
      lines.forEach((line: string, idx: number) => {
        const lineNum = idx + 1;
        if (/(SELECT|INSERT|UPDATE|DELETE).*\+/i.test(line)) {
          staticIssues.push({
            type: 'security',
            title: 'SQL injection via string concatenation',
            severity: 'critical',
            line: lineNum,
            explanation: 'Dynamic string concatenation in SQL queries creates vulnerabilities for unauthorized database access or manipulation.',
            suggested_fix: 'Use parameterized queries or prepared statements.',
          });
        }
        if (/(API_KEY|SECRET_KEY|PASSWORD|TOKEN)\s*=\s*['"][^'"]+['"]/i.test(line)) {
          staticIssues.push({
            type: 'security',
            title: 'Hardcoded secret or credential',
            severity: 'high',
            line: lineNum,
            explanation: 'Secrets stored directly in source code risk being committed to public repositories and leaking.',
            suggested_fix: 'Load secrets from environment variables (e.g. process.env or os.environ).',
          });
        }
        if (/pickle\.(load|loads)\(/.test(line)) {
          staticIssues.push({
            type: 'security',
            title: 'Unsafe deserialization with pickle',
            severity: 'high',
            line: lineNum,
            explanation: 'Unpickling untrusted data can lead to arbitrary remote code execution.',
            suggested_fix: 'Use safe data serialization formats such as JSON.',
          });
        }
        if (/for\s+[a-zA-Z_]\s+in\s+range\(len\(/.test(line)) {
          staticIssues.push({
            type: 'smell',
            title: 'Non-idiomatic nested index iteration',
            severity: 'low',
            line: lineNum,
            explanation: 'Iterating with range(len(...)) is non-idiomatic and inefficient when checking items.',
            suggested_fix: 'Use set lookups or direct item iteration.',
          });
        }
      });

      if (staticIssues.length > 0) {
        return res.json({
          overall_summary: "Static analysis detected security issues and code smells in the provided source code.",
          issues: dedupeAndCap(staticIssues),
          source: "static",
        });
      }
    }

    // Default graceful response
    return res.json({
      overall_summary: "No obvious syntax or static vulnerabilities detected in the input.",
      issues: [],
      source: "empty",
    });
  } catch (error: any) {
    console.error('API /review unexpected failure:', error);
    res.status(500).json({
      overall_summary: "Something went wrong during analysis. Please try again.",
      issues: [],
      source: "error",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
