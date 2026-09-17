# AI Code Review & Vulnerability Detection Agent

## Setup

```bash
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...   # Windows: set ANTHROPIC_API_KEY=sk-ant-...
streamlit run app.py
```

A virtual environment isn't strictly required, but it avoids a PATH
headache: `static_checks.py` already invokes bandit/pylint as
`python -m bandit` / `python -m pylint` rather than bare commands, so
they run through whichever Python launched Streamlit — inside an
activated venv that's always the right one, no separate PATH setup
needed.

## What's here

- `app.py` — Streamlit UI: paste/upload box, language selector,
  one-click demo sample, severity-colored result cards, quality score.
- `analyzer.py` — builds the prompt (with line-numbered source),
  forces structured JSON via a tool call (not prompt-only JSON —
  this is the reliability fix over plain "respond with only JSON"
  instructions), retries once on failure, caps/dedupes issues.
- `static_checks.py` — runs bandit + pylint on Python input and folds
  their findings into the prompt as grounding context (the "hybrid
  static analysis" differentiator). Python-only; no-ops for other
  languages.
- `scoring.py` — deterministic issue-list → 0-100 quality score.
- `demo_cache.py` — a pre-baked known-good result for the demo
  sample, used as a live-demo safety net if the API call times out
  or errors during the actual presentation.
- `samples/` — `buggy_example.py` (bug + smell) and
  `vulnerable_example.py` (SQL injection + hardcoded secret +
  unsafe deserialization) for testing and the demo.

## Before you go on stage

1. Test the "Load demo sample" → "Review Code" flow at least twice
   with a real API key so `demo_cache.py`'s cached result is a true
   backup, not a guess. Feel free to regenerate `CACHED_DEMO_RESULT`
   from an actual run.
2. Confirm bandit/pylint actually ran once by checking the static
   analysis findings show up in a review's explanations — if the
   packages didn't install correctly, `static_checks.py` degrades to
   silent no-op rather than crashing, so a broken install is easy to
   miss until you check.
3. Time the walkthrough against the 2-minute demo script in the PRD.

## Testing checklist (from the PRD)

- [ ] Empty input shows a friendly message, not a crash
- [ ] A 500+ line file completes without timing out
- [ ] Malformed LLM output triggers one retry, then a graceful error
- [ ] All three issue types (bug/security/smell) appear at least once
- [ ] Every issue shows severity, explanation, and suggested fix
- [ ] Quality score updates correctly as issues are added/removed
