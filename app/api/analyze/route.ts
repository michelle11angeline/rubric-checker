import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

import { analyzeRubric } from "@/lib/gemini";

// In-memory rate limiter — resets on redeploy/cold start, acceptable for low traffic.
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface RateEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateEntry>();

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. You may submit up to 5 requests per hour." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).rubric !== "string" ||
    typeof (body as Record<string, unknown>).assignment !== "string"
  ) {
    return NextResponse.json(
      { error: "Request body must include string fields 'rubric' and 'assignment'." },
      { status: 400 },
    );
  }

  const { rubric, assignment } = body as { rubric: string; assignment: string };

  if (rubric.trim() === "") {
    return NextResponse.json(
      { error: "'rubric' must not be empty." },
      { status: 400 },
    );
  }
  if (assignment.trim() === "") {
    return NextResponse.json(
      { error: "'assignment' must not be empty." },
      { status: 400 },
    );
  }

  let systemPrompt: string;
  try {
    const promptPath = path.join(process.cwd(), "prompts", "v2.md");
    systemPrompt = await readFile(promptPath, "utf-8");
  } catch {
    return NextResponse.json(
      { error: "Failed to load system prompt." },
      { status: 500 },
    );
  }

  try {
    const result = await analyzeRubric(systemPrompt, rubric, assignment);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
