# Rubric Checker

A web app that helps students self-check assignments against a marking rubric before submitting. Built to solve a real, recurring personal problem — catching gaps before grading, not after.

## How it works

Paste a rubric and an assignment as plain text, click Analyze, and the tool returns a structured, criterion-by-criterion breakdown: a qualitative band (Strong/Medium/Weak), a numeric score estimate, direct quotes pulled verbatim from the submission as evidence, and an overall total.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Zod for structured output validation
- Google Gemini API (2.5 Flash)
- Deployed on Vercel via GitHub, with continuous deployment from `main`

## v1 scope (current)

- Stateless: no database, no auth, no file uploads — plain text paste only
- In-memory rate limiting (5 requests/IP/hour)
- Single-user, no persistence — results live only in browser state for the session

## Prompt iteration

Tracked in `/prompts/` as a deliberate feedback-loop story, with a changelog comment at the top of each version explaining what changed and why:

- `v1.md` — generic baseline, deliberately unrefined
- `v2.md` — adds a mandatory verbatim-quoting requirement, so feedback is evidence-grounded in the actual submission rather than generic or hallucinated
- `v3.md` (planned) — adds weighting-awareness, so higher-weighted criteria are surfaced/prioritized in the feedback

## Known limitations / in progress

- Fix-requirement gap: the original spec calls for actionable fix suggestions on weak criteria; this isn't yet explicit in the prompt
- Leniency: initial test runs have scored submissions uniformly "Strong" — whether the model is genuinely discriminating between strong and weak work needs further testing
- README and resume framing describe Gemini as the current implementation and Claude as the intended target, to keep the portfolio narrative accurate

## Getting started

```bash
npm install
# Add GEMINI_API_KEY to .env.local
npm run dev
```
