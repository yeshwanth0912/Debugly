import { ReviewResult } from '../types';

export const DEMO_VULNERABLE_CODE = `import sqlite3

API_KEY = "sk-hardcoded-secret-12345"  # hardcoded secret


def get_user(user_id):
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    query = "SELECT * FROM users WHERE id = " + user_id  # SQL injection
    cursor.execute(query)
    return cursor.fetchone()


def load_config(path):
    import pickle
    with open(path, "rb") as f:
        return pickle.load(f)  # unsafe deserialization
`;

export const DEMO_BUGGY_CODE = `def process(items):
    result = []
    for i in range(len(items)):
        for j in range(len(items)):
            if items[i] == items[j] and i != j:
                result.append(items[i])  # O(n^2) duplicate-detection smell
    return result


def divide(a, b):
    return a / b  # no zero-check — will crash on b=0


def get_average(numbers):
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)  # crashes on empty list
`;

export const DEMO_CLEAN_CODE = `import os
import json
import sqlite3

API_KEY = os.environ.get("API_KEY", "")


def get_user(user_id: int):
    with sqlite3.connect("app.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,))
        return cursor.fetchone()


def load_config(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def safe_divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
`;

export const CACHED_CLEAN_RESULT: ReviewResult = {
  overall_summary: "Excellent code quality. No security vulnerabilities, crashes, or code smells were detected.",
  issues: [],
  source: "cache",
};

export const CACHED_DEMO_RESULT: ReviewResult = {
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
