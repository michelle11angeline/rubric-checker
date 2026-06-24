import { z } from "zod";

export const BandSchema = z.enum(["Strong", "Medium", "Weak"]);

export const CriterionResultSchema = z.object({
  criterion: z.string(),
  band: BandSchema,
  score: z.number(),
  quotes: z.array(z.string()),
  fix: z.string().optional(),
});

export const RubricAnalysisSchema = z.object({
  criteria: z.array(CriterionResultSchema),
  overallScore: z.number(),
  overallSummary: z.string(),
});

export type Band = z.infer<typeof BandSchema>;
export type CriterionResult = z.infer<typeof CriterionResultSchema>;
export type RubricAnalysis = z.infer<typeof RubricAnalysisSchema>;
