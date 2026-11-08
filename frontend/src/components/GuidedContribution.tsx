import React, { useState } from 'react';

interface GuidedContributionProps {
  steps: string[];
}

/** Turns the returned contribution plan into a user-managed checklist. */
export const GuidedContribution: React.FC<GuidedContributionProps> = ({ steps }) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => new Set());
  const completedCount = completedSteps.size;
  const remainingCount = steps.length - completedCount;
  const nextIncompleteIndex = steps.findIndex((_, index) => !completedSteps.has(index));

  const toggleStep = (index: number) => {
    setCompletedSteps((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (steps.length === 0) {
    return <p className="empty-state">No contribution steps were provided. Review the issue context before proceeding.</p>;
  }

  return (
    <div className="guided-contribution">
      <p className="guidance-note">Suggested guidance only. Checking a step records your review here; it does not verify code changes.</p>
      <div className="guided-progress-summary">
        <span>{completedCount} completed</span>
        <span>{remainingCount} remaining</span>
      </div>
      <progress
        className="guided-progress-bar"
        value={completedCount}
        max={steps.length}
        aria-label={`${completedCount} of ${steps.length} contribution steps marked complete`}
      />
      <ol className="guided-steps-list">
        {steps.map((step, index) => {
          const isComplete = completedSteps.has(index);
          const isNext = index === nextIncompleteIndex;
          return (
            <li
              key={`${index}-${step}`}
              className={`guided-step${isComplete ? ' is-complete' : ''}${isNext ? ' is-next' : ''}`}
              aria-current={isNext ? 'step' : undefined}
            >
              <label className="guided-step-label">
                <input
                  type="checkbox"
                  checked={isComplete}
                  onChange={() => toggleStep(index)}
                  aria-label={`Mark contribution step ${index + 1} ${isComplete ? 'incomplete' : 'complete'}`}
                />
                <span className="guided-step-number" aria-hidden="true">{index + 1}</span>
                <span className="guided-step-text">{step}</span>
                {isNext && <span className="guided-next-label">Next step</span>}
                {isComplete && <span className="guided-complete-label">Marked complete</span>}
              </label>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
