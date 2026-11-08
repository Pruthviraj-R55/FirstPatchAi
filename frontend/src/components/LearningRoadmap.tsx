import React, { useEffect, useMemo, useState } from 'react';

interface RoadmapStage {
  id: string;
  title: string;
  summary: string;
  objectives: string[];
}

const STORAGE_KEY = 'firstpatch-learn-roadmap-v1';
const stages: RoadmapStage[] = [
  { id: 'understand-git', title: 'Understand Git', summary: 'Build a mental model of version control.', objectives: ['Explain what version control is for.', 'Distinguish a local repository from a remote repository.', 'Describe what a commit records.', 'Explain the working directory, staging area, and repository.'] },
  { id: 'learn-commands', title: 'Learn Git commands', summary: 'Practice the everyday commands in a safe repository.', objectives: ['Check Git is installed and inspect configuration.', 'Review changes with status and diff.', 'Stage specific files and make a commit.', 'View history and create or switch branches.', 'Explain how push and pull move changes.'] },
  { id: 'understand-github', title: 'Understand GitHub', summary: 'Learn how hosted repositories support collaboration.', objectives: ['Find the README and contribution guide.', 'Explain a fork and a remote.', 'Locate issues and pull requests.', 'Describe the path from a fork branch to a proposed change.'] },
  { id: 'collaborate', title: 'Collaborate', summary: 'Keep work focused and respond to other contributors.', objectives: ['Configure origin and upstream for a fork.', 'Create a focused branch.', 'Recognize and resolve merge conflicts.', 'Review a pull request against its requirements.', 'Follow contribution guidelines and communicate clearly.'] },
  { id: 'first-contribution', title: 'Make a first contribution', summary: 'Turn understanding into a small, reviewable change.', objectives: ['Choose an appropriately scoped issue.', 'Trace relevant code and existing tests.', 'Make one focused change.', 'Run relevant checks and review the full diff.', 'Push a branch and open a clear pull request.'] },
];

function readProgress(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const validIds = new Set(stages.flatMap((stage) => stage.objectives.map((_, index) => `${stage.id}-${index + 1}`)));
    return Object.fromEntries(Object.entries(parsed).filter(([key, value]) => validIds.has(key) && typeof value === 'boolean' && value));
  } catch {
    return {};
  }
}

export const LearningRoadmap: React.FC = () => {
  const [completed, setCompleted] = useState<Record<string, boolean>>(readProgress);
  const [expandedStage, setExpandedStage] = useState(stages[0].id);
  const totalTasks = useMemo(() => stages.reduce((total, stage) => total + stage.objectives.length, 0), []);
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch {
      // Progress remains usable for this visit when browser storage is unavailable.
    }
  }, [completed]);

  const toggleTask = (taskId: string, checked: boolean) => {
    setCompleted((current) => {
      const next = { ...current };
      if (checked) next[taskId] = true;
      else delete next[taskId];
      return next;
    });
  };

  const resetProgress = () => {
    if (!window.confirm('Reset all learning roadmap progress saved in this browser?')) return;
    setCompleted({});
    setExpandedStage(stages[0].id);
  };

  return (
    <section className="learn-roadmap" aria-labelledby="roadmap-title">
      <header className="learn-section-heading">
        <div>
          <p className="learn-eyebrow">Your learning path</p>
          <h2 id="roadmap-title">A path to your first contribution</h2>
          <p>Move through the stages at your own pace. You can use the analyzer at any time.</p>
        </div>
      </header>

      <div className="roadmap-progress-card">
        <div className="roadmap-progress-copy">
          <div><strong>{completedCount} of {totalTasks} tasks complete</strong><span>{progress}%</span></div>
          <div className="roadmap-progress-track" role="progressbar" aria-label="Learning roadmap progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>Progress is saved locally in this browser and does not sync across devices.</p>
        </div>
        <button type="button" className="learn-reset-button" onClick={resetProgress} disabled={completedCount === 0}>Reset progress</button>
      </div>

      <div className="roadmap-stage-list">
        {stages.map((stage, index) => {
          const done = stage.objectives.filter((_, taskIndex) => completed[`${stage.id}-${taskIndex + 1}`]).length;
          const isComplete = done === stage.objectives.length;
          const isExpanded = expandedStage === stage.id;
          return (
            <article key={stage.id} className={`roadmap-stage${isComplete ? ' is-complete' : ''}${isExpanded ? ' is-expanded' : ''}`}>
              <button type="button" className="roadmap-stage-toggle" aria-expanded={isExpanded} aria-controls={`${stage.id}-tasks`} onClick={() => setExpandedStage(isExpanded ? '' : stage.id)}>
                <span className="roadmap-stage-number">{isComplete ? '✓' : `0${index + 1}`}</span>
                <span className="roadmap-stage-title"><strong>{stage.title}</strong><small>{stage.summary}</small></span>
                <span className="roadmap-stage-state">{isComplete ? 'Complete' : `${done}/${stage.objectives.length}`}<span aria-hidden="true">{isExpanded ? '−' : '+'}</span></span>
              </button>
              {isExpanded && (
                <div id={`${stage.id}-tasks`} className="roadmap-stage-content">
                  <ul>
                    {stage.objectives.map((objective, taskIndex) => {
                      const taskId = `${stage.id}-${taskIndex + 1}`;
                      return <li key={taskId}><label><input type="checkbox" checked={Boolean(completed[taskId])} onChange={(event) => toggleTask(taskId, event.target.checked)} /><span>{objective}</span></label></li>;
                    })}
                  </ul>
                  {index === stages.length - 1 && <p className="roadmap-guidance-note">These tasks are learning guidance. FirstPatch AI does not make code changes or run the project’s tests.</p>}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
