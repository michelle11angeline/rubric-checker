import "server-only";

import { RubricAnalysisSchema, type RubricAnalysis } from "./schema";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
}

function extractJson(raw: string): string {
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const combinedSystem = `${systemPrompt}\n\n${JSON_SCHEMA_INSTRUCTION}`;
  const userMessage = `RUBRIC:\n${rubric}\n\nASSIGNMENT:\n${assignment}`;

  async function callGemini(contents: GeminiContent[]): Promise<string> {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: combinedSystem }] },
        contents,
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned no text content.");
    }
    return text;
  }

  const firstRaw = await callGemini([
    { role: "user", parts: [{ text: userMessage }] },
  ]);

  try {
    return parseAndValidate(firstRaw);
  } catch (firstError) {
    const errorDetail =
      firstError instanceof Error ? firstError.message : String(firstError);

    const retryRaw = await callGemini([
      { role: "user", parts: [{ text: userMessage }] },
      { role: "model", parts: [{ text: firstRaw }] },
      {
        role: "user",
        parts: [
          {
            text: `Your response was not valid JSON matching the required schema. Validation error: ${errorDetail}\n\nReturn only the corrected JSON object — no markdown, no prose.`,
          },
        ],
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
