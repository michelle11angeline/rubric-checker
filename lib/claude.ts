import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { RubricAnalysisSchema, type RubricAnalysis } from "./schema";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const JSON_SCHEMA_INSTRUCTION = `
Respond with a JSON object only — no markdown fences, no preamble, no prose after.
The object must match this exact schema:

{
  "criteria": [
    {
      "criterion": "<criterion name>",
      "band": "Strong" | "Medium" | "Weak",
      "score": <number>,
      "quotes": ["<direct quote from assignment>", ...],
      "fix": "<optional suggestion for improvement>"
    }
  ],
  "overallScore": <number>,
  "overallSummary": "<one paragraph summary>"
}
`;

function extractJson(raw: string): string {
  // Strip markdown code fences if Claude wraps the output anyway
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : raw.trim();
}

function parseAndValidate(raw: string): RubricAnalysis {
  const cleaned = extractJson(raw);
  const json = JSON.parse(cleaned);
  return RubricAnalysisSchema.parse(json);
}

export async function analyzeRubric(
  systemPrompt: string,
  rubric: string,
  assignment: string,
): Promise<RubricAnalysis> {
  const combinedSystem = `${systemPrompt}\n\n${JSON_SCHEMA_INSTRUCTION}`;

  const userMessage = `RUBRIC:\n${rubric}\n\nASSIGNMENT:\n${assignment}`;

  async function callClaude(
    messages: Anthropic.MessageParam[],
  ): Promise<string> {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system: combinedSystem,
      messages,
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("Claude returned no text content.");
    }
    return block.text;
  }

  // First attempt
  const firstRaw = await callClaude([{ role: "user", content: userMessage }]);

  try {
    return parseAndValidate(firstRaw);
  } catch (firstError) {
    const errorDetail =
      firstError instanceof Error ? firstError.message : String(firstError);

    // Retry with a correction turn — conversation ends with user role, not a prefill
    const retryRaw = await callClaude([
      { role: "user", content: userMessage },
      { role: "assistant", content: firstRaw },
      {
        role: "user",
        content: `Your response was not valid JSON matching the required schema. Validation error: ${errorDetail}\n\nReturn only the corrected JSON object — no markdown, no prose.`,
      },
    ]);

    try {
      return parseAndValidate(retryRaw);
    } catch (retryError) {
      const retryDetail =
        retryError instanceof Error ? retryError.message : String(retryError);
      throw new Error(
        `Rubric analysis failed validation after retry. Error: ${retryDetail}`,
      );
    }
  }
}
