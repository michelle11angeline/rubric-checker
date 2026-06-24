"use client";

import { useState } from "react";
import AnalysisForm from "@/components/AnalysisForm";
import ResultsView from "@/components/ResultsView";
import type { RubricAnalysis } from "@/lib/schema";

export default function Home() {
  const [result, setResult] = useState<RubricAnalysis | null>(null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold">Rubric Checker</h1>
      <p className="mb-8 text-sm text-gray-500">
        Paste a rubric and an assignment to get criterion-by-criterion feedback.
      </p>

      <AnalysisForm onResult={setResult} />

      {result && <ResultsView result={result} />}
    </main>
  );
}
