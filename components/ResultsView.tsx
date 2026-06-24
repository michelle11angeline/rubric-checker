import type { RubricAnalysis, CriterionResult, Band } from "@/lib/schema";

const bandStyles: Record<Band, { badge: string; border: string }> = {
  Strong: {
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    border: "border-green-200 dark:border-green-800",
  },
  Medium: {
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  Weak: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    border: "border-red-200 dark:border-red-800",
  },
};

function CriterionCard({ criterion }: { criterion: CriterionResult }) {
  const styles = bandStyles[criterion.band];
  const showFix = criterion.band === "Weak" || criterion.band === "Medium";

  return (
    <div className={`rounded-lg border-2 p-5 ${styles.border}`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold">{criterion.criterion}</h3>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}>
            {criterion.band}
          </span>
          <span className="text-sm font-medium tabular-nums text-gray-600 dark:text-gray-400">
            {criterion.score}
          </span>
        </div>
      </div>

      {criterion.quotes.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          {criterion.quotes.map((quote, i) => (
            <blockquote
              key={i}
              className="border-l-4 border-gray-300 pl-3 text-sm italic text-gray-600 dark:border-gray-600 dark:text-gray-400"
            >
              "{quote}"
            </blockquote>
          ))}
        </div>
      )}

      {showFix && criterion.fix && (
        <div className="mt-3 rounded-md bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800">
          <span className="mr-1 font-semibold">Suggestion:</span>
          {criterion.fix}
        </div>
      )}
    </div>
  );
}

interface ResultsViewProps {
  result: RubricAnalysis;
}

export default function ResultsView({ result }: ResultsViewProps) {
  return (
    <section className="mt-10 flex flex-col gap-6">
      <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
        <div className="mb-2 flex items-center gap-3">
          <h2 className="text-xl font-bold">Overall score</h2>
          <span className="text-2xl font-bold tabular-nums">{result.overallScore}</span>
        </div>
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {result.overallSummary}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {result.criteria.map((criterion, i) => (
          <CriterionCard key={i} criterion={criterion} />
        ))}
      </div>
    </section>
  );
}
