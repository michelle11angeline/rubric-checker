"use client";

import { useState } from "react";
import type { RubricAnalysis } from "@/lib/schema";

interface AnalysisFormProps {
  onResult: (result: RubricAnalysis) => void;
}

export default function AnalysisForm({ onResult }: AnalysisFormProps) {
  const [rubric, setRubric] = useState("");
  const [assignment, setAssignment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubric, assignment }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      onResult(data as RubricAnalysis);
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-3xl">
      <div className="flex flex-col gap-2">
        <label htmlFor="rubric" className="text-sm font-semibold">
          Rubric
        </label>
        <textarea
          id="rubric"
          value={rubric}
          onChange={(e) => setRubric(e.target.value)}
          placeholder="Paste the assignment rubric here…"
          rows={8}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="assignment" className="text-sm font-semibold">
          Assignment
        </label>
        <textarea
          id="assignment"
          value={assignment}
          onChange={(e) => setAssignment(e.target.value)}
          placeholder="Paste the student assignment here…"
          rows={12}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
          disabled={loading}
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Analyzing…" : "Analyze"}
      </button>
    </form>
  );
}
