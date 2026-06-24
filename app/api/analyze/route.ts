import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

import { analyzeRubric } from "@/lib/gemini";

export async function POST(request: NextRequest) {
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
    const promptPath = path.join(process.cwd(), "prompts", "v1.md");
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
