import React, { useState } from 'react';
import type { AnalysisResult } from '../types/api';

interface ContributionReadinessProps {
  result: AnalysisResult;
}

/** Keeps model-detected context separate from tasks the user marks as reviewed. */
export const ContributionReadiness: React.FC<ContributionReadinessProps> = ({ result }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => new Set());
  const files = result.relevant_files;
  const plan = result.contribution_plan;
  const tests = result.suggested_tests;
  const uncertainties = result.uncertainties;

  const items = [
    {
      id: 'files',
      label: 'I inspected the identified files in the repository.',
      detected: files.length
        ? `AI identified ${files.length} relevant file${files.length === 1 ? '' : 's'}; confirm the paths and relevance yourself.`
        : 'No relevant files were identified. Consider whether more source context is needed.',
    },
    {
      id: 'plan',
      label: 'I worked through the suggested contribution plan.',
      detected: plan.length
        ? `AI returned ${plan.length} contribution step${plan.length === 1 ? '' : 's'}.`
        : 'No contribution steps were returned. Review the issue context before proceeding.',
    },
    {
      id: 'tests',
      label: 'I reviewed the suggested tests and decided what to run.',
      detected: tests.length
        ? `AI suggested ${tests.length} test${tests.length === 1 ? '' : 's'}. FirstPatch AI has not executed them.`
        : 'No test suggestions were returned. Identify relevant tests in the repository.',
    },
    {
      id: 'uncertainties',
      label: uncertainties.length
        ? 'I resolved or documented the listed uncertainties.'
        : 'I checked the assumptions behind the analysis against the repository.',
      detected: uncertainties.length
        ? `AI flagged ${uncertainties.length} uncertainty item${uncertainties.length === 1 ? '' : 's'} to review.`
        : 'AI did not flag uncertainties; independently verify assumptions before contributing.',
    },
  ];

  const toggleItem = (id: string) => {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="result-card readiness-card card-span-full" aria-labelledby="readiness-heading">
      <div className="readiness-heading">
        <div>
          <h3 id="readiness-heading">Contribution readiness</h3>
          <p>Review the analysis and mark what you have checked. These items do not verify code changes or test execution.</p>
        </div>
        <span className="readiness-user-label">Your checklist</span>
      </div>
      <ul className="readiness-list">
        {items.map((item) => (
          <li key={item.id} className="readiness-item">
            <label className="readiness-action">
              <input
                type="checkbox"
                checked={checkedItems.has(item.id)}
                onChange={() => toggleItem(item.id)}
              />
              <span>{item.label}</span>
            </label>
            <p className="readiness-detected"><strong>From analysis:</strong> {item.detected}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
