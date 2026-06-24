# rubric-checker

A stateless web app that lets students self-check their assignments against a rubric using the Claude API.

Paste your assignment and rubric, and get structured feedback on how well the submission meets each criterion — no login, no database, no persistence.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Claude API (Anthropic)

## Project structure

```
app/          # Next.js App Router pages and layouts
app/api/      # API route handlers (Claude calls live here)
components/   # Reusable React components
prompts/      # Prompt templates passed to Claude
lib/          # Shared utilities and helpers
```

## Getting started

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
